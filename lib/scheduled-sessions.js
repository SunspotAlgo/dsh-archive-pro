/**
 * Discovery of the sessions that a scheduled task created.
 *
 * DSH does not mark a Session with the task that produced it: the schedule
 * runtime calls `sessionController.create({ sessionId, cwd, agentPreset })`
 * without any metadata, and the Session id is an ordinary random UUID. The
 * only reliable record is the task's own delivery receipt, whose
 * `targetSessionId` names the Session that accepted the delivery.
 *
 * Two target kinds create Sessions:
 *   - `new`      — every occurrence creates a fresh Session;
 *   - `new_once` — the first occurrence creates one Session that later
 *                  deliveries reuse.
 *
 * A `session` target reuses a Session the user already had. Those must never
 * be treated as task sessions, so they are skipped entirely.
 */

/** Page size used when reading one task's delivery history. */
const HISTORY_PAGE_LIMIT = 100;

/** Upper bound on pages read per task, so a huge history cannot stall a scan. */
const MAX_HISTORY_PAGES = 20;

/**
 * Read the schedule service, if the profile composes it.
 * @param host - the Host context.
 * @returns the schedule service, or undefined when it is not installed.
 */
export function scheduleService(host) {
    try {
        const service = host?.get?.('schedule');
        return service === undefined ? undefined : service;
    }
    catch {
        return undefined;
    }
}

/**
 * Whether a task target creates Sessions of its own.
 * @param target - the task's delivery target.
 * @returns true for `new` and `new_once` targets.
 */
export function createsSessions(target) {
    return target?.kind === 'new' || target?.kind === 'new_once';
}

/**
 * Read every saved delivery of one task, following the paging cursor.
 * @param schedule - the schedule service.
 * @param taskId - identity of the task whose history is read.
 * @returns the delivery records, newest first, plus whether the history was truncated.
 */
async function readAllDeliveries(schedule, taskId) {
    const records = [];
    let before;
    let pruned = false;
    for (let page = 0; page < MAX_HISTORY_PAGES; page++) {
        let result;
        try {
            result = await schedule.history({
                id: taskId,
                limit: HISTORY_PAGE_LIMIT,
                ...(before === undefined ? {} : { before }),
            });
        }
        catch {
            break;
        }
        if (result === undefined || result === null) break;
        if (Array.isArray(result.records)) {
            records.push(...result.records);
            if (result.earlierRecordsPruned === true) pruned = true;
            if (result.earlierRecordsUnavailable === true) pruned = true;
        }
        const next = result.nextBefore;
        if (next === undefined || next === null || next === before) break;
        before = next;
    }
    return { records, pruned };
}

/**
 * Collect every Session a scheduled task created.
 *
 * `minAgeMs` keeps the Sessions whose most recent delivery is too recent. A
 * delivery starts the run that the Session exists for, so a recent delivery
 * means that run is still fresh and the Session must not be archived yet.
 * @param host - the Host context.
 * @param options - the scan options.
 * @param options.minAgeMs - minimum age of the latest delivery, in milliseconds.
 * @returns a map from session id to the task that created it, plus scan notes.
 */
export async function collectTaskSessions(host, options = {}) {
    const minAgeMs = Number.isFinite(options.minAgeMs) && options.minAgeMs > 0 ? options.minAgeMs : 0;
    const cutoff = minAgeMs > 0 ? Date.now() - minAgeMs : null;
    const schedule = scheduleService(host);
    const result = {
        available: schedule !== undefined,
        sessions: new Map(),
        tasks: 0,
        pruned: false,
        skippedRecent: 0,
        skippedRunning: 0,
    };
    if (schedule === undefined) return result;

    let tasks = [];
    try {
        const listed = await schedule.list({ limit: 500, offset: 0 });
        tasks = Array.isArray(listed?.items) ? listed.items : [];
    }
    catch {
        return result;
    }
    result.tasks = tasks.length;

    for (const task of tasks) {
        if (!createsSessions(task?.target)) continue;
        // A task whose latest delivery is still queued or running is left alone.
        if (task?.executionActive === true) {
            result.skippedRunning += 1;
            continue;
        }
        const taskId = task?.id ?? task?.record?.id;
        if (taskId === undefined || taskId === null) continue;
        const title = task?.record?.title ?? task?.title ?? null;
        const { records, pruned } = await readAllDeliveries(schedule, taskId);
        if (pruned) result.pruned = true;
        for (const record of records) {
            const sessionId = record?.targetSessionId;
            if (typeof sessionId !== 'string' || sessionId === '') continue;
            const deliveredAt = record?.deliveredAt ?? null;
            const deliveredMs = deliveredAt === null ? Number.NaN : Date.parse(deliveredAt);
            const existing = result.sessions.get(sessionId);
            // Several tasks may share one Session; keep the latest delivery time.
            if (existing === undefined) {
                result.sessions.set(sessionId, {
                    sessionId,
                    taskTitle: typeof title === 'string' && title.trim() !== '' ? title : null,
                    taskId: String(taskId),
                    taskStatus: task?.status ?? null,
                    scheduledAt: record?.scheduledAt ?? null,
                    deliveredAt,
                    deliveredAtMs: Number.isNaN(deliveredMs) ? null : deliveredMs,
                });
            }
            else if (!Number.isNaN(deliveredMs) && (existing.deliveredAtMs === null || deliveredMs > existing.deliveredAtMs)) {
                existing.deliveredAtMs = deliveredMs;
                existing.deliveredAt = deliveredAt;
            }
        }
    }

    if (cutoff !== null) {
        for (const [sessionId, entry] of [...result.sessions]) {
            // A Session whose latest delivery time is unknown cannot be shown to
            // be old enough, so it waits for the next scan.
            if (entry.deliveredAtMs === null || entry.deliveredAtMs > cutoff) {
                result.sessions.delete(sessionId);
                result.skippedRecent += 1;
            }
        }
    }

    return result;
}
