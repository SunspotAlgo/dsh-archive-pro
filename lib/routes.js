/**
 * HTTP routes bridging the archive-pro settings page to the host.
 */
import { existsSync, readFileSync, readdirSync, lstatSync, statSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { releaseArchivedSession } from './session-lifecycle.js';
import { collectTaskSessions } from './scheduled-sessions.js';
import { homedir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';

const SESSION_ID_RE = /^session-[0-9a-fA-F-]+$/;

function dshHome(host) {
    const root = host?.sessionPersistence?.root;
    if (typeof root === 'string' && /[\\/]sessions[\\/]?$/.test(root)) return dirname(resolve(root));
    const configured = process.env.DSH_HOME;
    if (configured !== undefined && configured.trim().length > 0) {
        return resolve(configured === '~' ? homedir() : /^~[\\/]/.test(configured) ? join(homedir(), configured.slice(2)) : configured);
    }
    return join(homedir(), '.dsh');
}

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const deletingSessionIds = new Set();
export function isSessionDeletionBlocked(host, id) {
    return deletingSessionIds.has(id) || deletedSessionIds(dshHome(host)).includes(id);
}

function deletedSessionIds(home) {
    const path = join(home, 'storages', 'archive-manager-deleted.json');
    if (!existsSync(path)) return [];
    const ids = readJson(path).sessionIds;
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !SESSION_ID_RE.test(id))) {
        throw new Error('Invalid archive-pro deletion receipts');
    }
    return ids;
}

function rememberDeletion(home, sessionId) {
    const path = join(home, 'storages', 'archive-manager-deleted.json');
    const ids = [...new Set([...deletedSessionIds(home), sessionId])];
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.tmp`;
    writeJson(temporary, { version: 1, sessionIds: ids });
    renameSync(temporary, path);
}

function forgetSessionIndex(registry, id) {
    for (const key of ['headers', 'sessionPaths', 'missingSessionPaths', 'invalidSessionPaths']) {
        registry[key]?.delete?.(id);
    }
}

export async function reconcileDeletedSessions(host) {
    const registry = host?.workspaceRegistry;
    const deleted = new Set(deletedSessionIds(dshHome(host)));
    if (!deleted.size || !registry) return;
    await registry.enqueueOperation(async () => {
        for (const workspace of registry.list()) {
            for (const id of deleted) await workspace.detachSession(id);
        }
        const state = registry.requireState();
        const archived = state.archivedSessionIds.filter(id => !deleted.has(id));
        const pinned = (state.pinnedSessionIds ?? []).filter(id => !deleted.has(id));
        if (archived.length !== state.archivedSessionIds.length || pinned.length !== (state.pinnedSessionIds ?? []).length) {
            await registry.setState({ ...state, archivedSessionIds: archived, pinnedSessionIds: pinned });
        }
        for (const id of deleted) {
            await releaseArchivedSession(host, id);
            await clearProjectionCache(host, dshHome(host), id);
            forgetSessionIndex(registry, id);
        }
    });
}

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function sendJson(response, status, body) {
    const payload = JSON.stringify(body);
    response.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'content-length': Buffer.byteLength(payload),
    });
    response.end(payload);
}

function isSameOrigin(request) {
    const origin = request.headers['origin'];
    if (origin === undefined) return true;
    try {
        return new URL(origin).host === request.headers['host'];
    }
    catch {
        return false;
    }
}

function readJsonBody(request, maxBytes = 262144) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        let done = false;
        request.on('data', (chunk) => {
            if (done) return;
            size += chunk.length;
            if (size > maxBytes) {
                done = true;
                reject(new Error('request body too large'));
                return;
            }
            chunks.push(chunk);
        });
        request.on('end', () => {
            if (done) return;
            done = true;
            const text = Buffer.concat(chunks).toString('utf8');
            if (text.trim() === '') {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(text));
            }
            catch (error) {
                reject(new Error(`invalid json body: ${error.message}`));
            }
        });
        request.on('error', reject);
    });
}

function dirSizeBytes(dirPath) {
    let total = 0;
    try {
        for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
            const full = join(dirPath, entry.name);
            if (entry.isSymbolicLink()) continue;
            if (entry.isDirectory()) total += dirSizeBytes(full);
            else if (entry.isFile()) {
                try { total += statSync(full).size; } catch {}
            }
        }
    } catch {}
    return total;
}

function sessionDirOnDisk(home, sessionId, host) {
    const sessionsRoot = host?.sessionPersistence?.root ?? join(home, 'sessions');
    if (!existsSync(sessionsRoot)) return null;
    for (const entry of readdirSync(sessionsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const dir = join(sessionsRoot, entry.name, sessionId);
        if (existsSync(dir)) {
            if (lstatSync(dir).isSymbolicLink()) throw httpError(409, 'Refusing a linked session directory');
            return dir;
        }
    }
    return null;
}

function readPerSessionCache(home) {
    const dir = join(home, 'storages', 'session_projcache', 'sessions');
    if (!existsSync(dir)) return {};
    const out = {};
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
        const id = entry.name.slice(0, -'.json'.length);
        try {
            const record = readJson(join(dir, entry.name))?.record;
            const title = record?.rows?.title?.val;
            const createdAt = record?.identity?.createdAt;
            const summary = {};
            if (typeof title === 'string' && title.trim().length > 0) summary.title = title;
            if (typeof createdAt === 'number') summary.createdAt = createdAt;
            if (Object.keys(summary).length > 0) out[id] = summary;
        }
        catch {}
    }
    return out;
}

function readLegacyTitleCache(home) {
    const path = join(home, 'storages', 'session_projcache.json');
    if (!existsSync(path)) return {};
    try {
        const cache = readJson(path);
        const out = {};
        for (const [id, record] of Object.entries(cache.tables?.sessions ?? {})) {
            const title = record.rows?.title?.val;
            const createdAt = record.identity?.createdAt;
            const summary = {};
            if (typeof title === 'string' && title.trim().length > 0) summary.title = title;
            if (typeof createdAt === 'number') summary.createdAt = createdAt;
            out[id] = summary;
        }
        return out;
    }
    catch {
        return {};
    }
}

function readTitleCache(home) {
    const out = readLegacyTitleCache(home);
    for (const [id, summary] of Object.entries(readPerSessionCache(home))) {
        out[id] = { ...out[id], ...summary };
    }
    return out;
}

function buildWorkspaceLookup(host, workspaceJson) {
    const sessionToWs = new Map();
    const workspaces = [];
    if (host?.workspaceRegistry && typeof host.workspaceRegistry.list === 'function') {
        for (const ws of host.workspaceRegistry.list()) {
            const id = ws.id;
            const title = ws.title || (ws.path ? basename(ws.path) : id);
            const path = ws.path || '';
            workspaces.push({ id, title, path });
            const sids = Array.isArray(ws.sessionIds) ? ws.sessionIds : [];
            for (const sid of sids) sessionToWs.set(sid, { id, title, path });
        }
    }
    if (workspaceJson?.tables?.workspaces) {
        const seenWs = new Set(workspaces.map(w => w.id));
        for (const [id, ws] of Object.entries(workspaceJson.tables.workspaces)) {
            const title = ws.title || (ws.path ? basename(ws.path) : id);
            const path = ws.path || '';
            if (!seenWs.has(id)) { workspaces.push({ id, title, path }); seenWs.add(id); }
            for (const sid of (ws.sessionIds ?? [])) {
                if (!sessionToWs.has(sid)) sessionToWs.set(sid, { id, title, path });
            }
        }
    }
    return { sessionToWs, workspaces };
}

export function listArchivedSessions(host) {
    const home = dshHome(host);
    const workspacePath = join(home, 'storages', 'workspace.json');
    const workspace = existsSync(workspacePath) ? readJson(workspacePath) : null;
    const archived = host?.workspaceRegistry?.archivedSessionIds ?? workspace?.global?.archivedSessionIds ?? [];
    const pinnedSet = new Set(host?.workspaceRegistry?.requireState?.()?.pinnedSessionIds ?? workspace?.global?.pinnedSessionIds ?? []);
    const titles = readTitleCache(home);
    const table = host?.storageDomain?.get?.('session_projcache')?.table('sessions');
    for (const id of archived) {
        const record = table?.get(id);
        if (record) {
            const title = record.rows?.title?.val;
            const createdAt = record.identity?.createdAt;
            titles[id] = {
                ...titles[id],
                ...(typeof title === 'string' && title.trim() ? { title } : {}),
                ...(typeof createdAt === 'number' ? { createdAt } : {}),
            };
        }
    }
    const { sessionToWs, workspaces } = buildWorkspaceLookup(host, workspace);
    const deleted = new Set(deletedSessionIds(home));
    const sessions = archived.filter(id => !deleted.has(id)).map((sessionId) => {
        const dir = sessionDirOnDisk(home, sessionId, host);
        const ws = sessionToWs.get(sessionId) ?? null;
        return {
            sessionId,
            title: titles[sessionId]?.title ?? null,
            createdAt: titles[sessionId]?.createdAt ?? null,
            onDisk: dir !== null,
            sizeBytes: dir !== null ? dirSizeBytes(dir) : 0,
            workspaceId: ws ? ws.id : null,
            workspaceTitle: ws ? ws.title : null,
            isPinned: pinnedSet.has(sessionId),
        };
    });
    return { sessions, workspaces };
}

async function clearProjectionCache(host, home, sessionId) {
    const domain = host?.storageDomain?.get?.('session_projcache');
    if (domain) await domain.table('sessions').delete(sessionId);
    const recordPath = join(home, 'storages', 'session_projcache', 'sessions', `${sessionId}.json`);
    rmSync(recordPath, { force: true });
    const cachePath = join(home, 'storages', 'session_projcache.json');
    if (!existsSync(cachePath)) return;
    try {
        const cache = readJson(cachePath);
        const sessions = cache.tables?.sessions;
        if (sessions && sessionId in sessions) {
            delete sessions[sessionId];
            writeJson(cachePath, cache);
        }
    }
    catch {}
}

export async function deleteArchivedSession(host, sessionId) {
    if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) {
        throw httpError(400, `invalid session id: ${sessionId}`);
    }
    const home = dshHome(host);
    const registry = host?.workspaceRegistry;
    if (typeof registry?.enqueueOperation !== 'function') {
        throw httpError(503, 'workspace registry is unavailable');
    }
    await registry.enqueueOperation(async () => {
        const state = registry.requireState();
        if (!state.archivedSessionIds.includes(sessionId)) {
            throw httpError(400, `session is not archived: ${sessionId}`);
        }
        deletingSessionIds.add(sessionId);
        try {
            await releaseArchivedSession(host, sessionId);
            const dir = sessionDirOnDisk(home, sessionId, host);
            await clearProjectionCache(host, home, sessionId);
            for (const workspace of registry.list()) {
                await workspace.detachSession(sessionId);
            }
            if (dir !== null) rmSync(dir, { recursive: true, force: true });
            await registry.setState({
                ...state,
                archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId),
                pinnedSessionIds: (state.pinnedSessionIds ?? []).filter((id) => id !== sessionId),
            });
            rememberDeletion(home, sessionId);
            forgetSessionIndex(registry, sessionId);
            try { host.emit?.('api-session/removed', sessionId); }
            catch (error) { console.warn('archive-pro: sidebar notification failed:', error.message); }
        } finally { deletingSessionIds.delete(sessionId); }
    });
    return { deleted: true };
}

export async function deleteSessionFromMenu(host, sessionId) {
    if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) {
        throw httpError(400, 'invalid session id');
    }
    if (deletedSessionIds(dshHome(host)).includes(sessionId)) return { deleted: true };
    if (typeof host.workspaceRegistry?.archiveSession !== 'function') {
        throw httpError(503, '当前宿主不支持归档会话。');
    }
    await host.workspaceRegistry.archiveSession(sessionId, { stopActivity: true });
    return deleteArchivedSession(host, sessionId);
}

export async function restoreArchivedSession(host, sessionId) {
    if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) {
        throw httpError(400, `invalid session id: ${sessionId}`);
    }
    const registry = host?.workspaceRegistry;
    if (!registry || typeof registry.enqueueOperation !== 'function') {
        throw new Error('workspace registry is unavailable');
    }
    if (typeof registry.unarchiveSession === 'function') {
        const restored = registry.archivedSessionIds.includes(sessionId);
        await registry.unarchiveSession(sessionId);
        return { restored };
    }
    let restored = false;
    await registry.enqueueOperation(async () => {
        const state = registry.requireState();
        const archived = state?.archivedSessionIds;
        if (!Array.isArray(archived) || !archived.includes(sessionId)) return;
        await registry.setState({
            ...state,
            archivedSessionIds: archived.filter((id) => id !== sessionId),
        });
        restored = true;
    });
    return { restored };
}

export async function batchDeleteArchivedSessions(host, sessionIds) {
    if (!Array.isArray(sessionIds)) throw httpError(400, 'sessionIds must be an array');
    const unique = [...new Set(sessionIds.filter(id => typeof id === 'string' && SESSION_ID_RE.test(id)))];
    let deleted = 0;
    const errors = [];
    for (const id of unique) {
        try {
            await deleteArchivedSession(host, id);
            deleted++;
        } catch (error) {
            errors.push({ sessionId: id, error: error instanceof Error ? error.message : String(error) });
        }
    }
    return { deleted, failed: errors.length, total: unique.length, errors };
}

export async function batchRestoreArchivedSessions(host, sessionIds) {
    if (!Array.isArray(sessionIds)) throw httpError(400, 'sessionIds must be an array');
    const unique = [...new Set(sessionIds.filter(id => typeof id === 'string' && SESSION_ID_RE.test(id)))];
    let restored = 0;
    const errors = [];
    for (const id of unique) {
        try {
            const res = await restoreArchivedSession(host, id);
            if (res.restored) restored++;
        } catch (error) {
            errors.push({ sessionId: id, error: error instanceof Error ? error.message : String(error) });
        }
    }
    return { restored, failed: errors.length, total: unique.length, errors };
}

/**
 * List the Sessions that scheduled tasks created and that are not archived yet.
 *
 * The schedule service is optional: without it the page reports that the
 * feature is unavailable instead of failing.
 * @param host - the Host context.
 * @returns the archivable task Sessions, plus scan statistics.
 */
/**
 * Collect the Sessions that still exist.
 *
 * A scheduled task's delivery history keeps naming every session it ever
 * created, so the history alone cannot tell a live session from one the user
 * deleted. A session counts as alive when the registry still lists it or its
 * log directory is still on disk.
 * @param host - the Host context.
 * @param home - the DSH home directory.
 * @param workspace - the parsed workspace.json, or null.
 * @param sessionToWs - the session-to-workspace lookup.
 * @returns the set of live session identities.
 */
function liveSessionIds(host, home, workspace, sessionToWs) {
    const alive = new Set();
    // The registry knows the sessions the workspace still holds.
    for (const sessionId of sessionToWs.keys()) alive.add(sessionId);
    // A session whose directory is still on disk is alive even when the
    // registry has not caught up with it yet.
    const sessionsRoot = host?.sessionPersistence?.root ?? join(home, 'sessions');
    if (!existsSync(sessionsRoot)) return alive;
    let workspaceDirs = [];
    try {
        workspaceDirs = readdirSync(sessionsRoot, { withFileTypes: true });
    }
    catch {
        return alive;
    }
    for (const workspaceDir of workspaceDirs) {
        if (!workspaceDir.isDirectory()) continue;
        let entries = [];
        try {
            entries = readdirSync(join(sessionsRoot, workspaceDir.name), { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            // Directories are named either \`session-<id>\` or a bare uuid.
            alive.add(entry.name);
            if (!entry.name.startsWith('session-')) alive.add(`session-${entry.name}`);
        }
    }
    return alive;
}

export async function listScheduledSessions(host, options = {}) {
    const home = dshHome(host);
    const minAgeMs = Number.isFinite(options.minAgeMs) && options.minAgeMs > 0 ? options.minAgeMs : 0;
    const scan = await collectTaskSessions(host, { minAgeMs });
    if (!scan.available) {
        return {
            available: false,
            sessions: [],
            discovered: 0,
            archivable: 0,
            tasks: 0,
            pruned: false,
            skippedRecent: 0,
            skippedRunning: 0,
            skippedGone: 0,
            skippedArchived: 0,
            total: 0,
            minAgeMs,
        };
    }

    const archived = new Set(host?.workspaceRegistry?.archivedSessionIds ?? []);
    const deleted = new Set(deletedSessionIds(home));
    const pinnedSet = new Set(host?.workspaceRegistry?.requireState?.()?.pinnedSessionIds ?? []);
    const titles = readTitleCache(home);
    const workspacePath = join(home, 'storages', 'workspace.json');
    const workspace = existsSync(workspacePath) ? readJson(workspacePath) : null;
    const { sessionToWs } = buildWorkspaceLookup(host, workspace);

    // The delivery history names every session a task ever created, including
    // the ones the user deleted long ago. Only the sessions that still exist
    // can be archived, so the count must not be the raw history size.
    const alive = liveSessionIds(host, home, workspace, sessionToWs);

    const sessions = [];
    let skippedGone = 0;
    let skippedArchived = 0;
    for (const entry of scan.sessions.values()) {
        const sessionId = entry.sessionId;
        // The history outlives the session it names. A session that is in
        // neither the registry nor on disk is gone: the user deleted it, or
        // it was cleaned up. It cannot be archived, and it must not inflate
        // the count of sessions that are still there.
        if (!alive.has(sessionId)) {
            skippedGone += 1;
            continue;
        }
        // Already archived: it is in the archive the other tab manages.
        if (archived.has(sessionId)) {
            skippedArchived += 1;
            continue;
        }
        if (deleted.has(sessionId)) continue;
        const dir = sessionDirOnDisk(home, sessionId, host);
        const ws = sessionToWs.get(sessionId) ?? null;
        sessions.push({
            sessionId,
            title: titles[sessionId]?.title ?? null,
            createdAt: titles[sessionId]?.createdAt ?? null,
            onDisk: dir !== null,
            sizeBytes: dir !== null ? dirSizeBytes(dir) : 0,
            workspaceId: ws ? ws.id : null,
            workspaceTitle: ws ? ws.title : null,
            isPinned: pinnedSet.has(sessionId),
            taskTitle: entry.taskTitle,
            taskId: entry.taskId,
            taskStatus: entry.taskStatus,
            deliveredAt: entry.deliveredAt,
        });
    }

    sessions.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return {
        available: true,
        sessions,
        // The number of sessions that really exist and are ready to archive.
        discovered: sessions.length,
        archivable: sessions.length,
        // How many sessions the delivery history mentions in total.
        total: scan.total,
        tasks: scan.tasks,
        pruned: scan.pruned,
        skippedRecent: scan.skippedRecent,
        skippedRunning: scan.skippedRunning,
        skippedGone,
        skippedArchived,
        minAgeMs,
    };
}

/**
 * Archive several Sessions in one call.
 *
 * A failure on one Session never stops the rest; the caller receives a
 * per-Session error list.
 * @param host - the Host context.
 * @param sessionIds - identities of the Sessions to archive.
 * @returns how many were archived and which ones failed.
 */
export async function archiveSessions(host, sessionIds) {
    if (!Array.isArray(sessionIds)) throw httpError(400, 'sessionIds must be an array');
    const registry = host?.workspaceRegistry;
    if (typeof registry?.archiveSession !== 'function') {
        throw httpError(503, '当前宿主不支持归档会话。');
    }
    const unique = [...new Set(sessionIds.filter(id => typeof id === 'string' && SESSION_ID_RE.test(id)))];
    let archived = 0;
    const errors = [];
    for (const id of unique) {
        try {
            await registry.archiveSession(id, { stopActivity: true });
            archived++;
        } catch (error) {
            errors.push({ sessionId: id, error: error instanceof Error ? error.message : String(error) });
        }
    }
    return { archived, failed: errors.length, total: unique.length, errors };
}

export function mountArchiveRoutes(host) {
    const disposers = [
        host.webServer.register({
            kind: 'exact',
            path: '/dsh-archive-pro/list',
            handler: async (request, response) => {
                if (request.method !== 'GET') {
                    response.writeHead(405, { allow: 'GET' });
                    response.end();
                    return;
                }
                try {
                    await reconcileDeletedSessions(host);
                    const data = listArchivedSessions(host);
                    sendJson(response, 200, { ok: true, ...data });
                }
                catch (error) {
                    const status = typeof error.status === 'number' ? error.status : 500;
                    sendJson(response, status, { error: error instanceof Error ? error.message : String(error) });
                }
            },
        }),
        host.webServer.register({
            kind: 'exact',
            path: '/dsh-archive-pro/restore',
            handler: async (request, response) => {
                if (request.method !== 'POST') {
                    response.writeHead(405, { allow: 'POST' });
                    response.end();
                    return;
                }
                if (!isSameOrigin(request)) {
                    sendJson(response, 403, { error: 'untrusted origin' });
                    return;
                }
                try {
                    const body = await readJsonBody(request);
                    const sessionId = body?.sessionId;
                    if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) {
                        sendJson(response, 400, { error: 'invalid session id' });
                        return;
                    }
                    sendJson(response, 200, { ok: true, ...(await restoreArchivedSession(host, sessionId)) });
                }
                catch (error) {
                    const status = typeof error.status === 'number' ? error.status : 500;
                    sendJson(response, status, { error: error instanceof Error ? error.message : String(error) });
                }
            },
        }),
        host.webServer.register({
            kind: 'exact',
            path: '/dsh-archive-pro/delete',
            handler: async (request, response) => {
                if (request.method !== 'POST') {
                    response.writeHead(405, { allow: 'POST' });
                    response.end();
                    return;
                }
                if (!isSameOrigin(request)) {
                    sendJson(response, 403, { error: 'untrusted origin' });
                    return;
                }
                try {
                    const body = await readJsonBody(request);
                    const sessionId = body?.sessionId;
                    if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) {
                        sendJson(response, 400, { error: 'invalid session id' });
                        return;
                    }
                    sendJson(response, 200, { ok: true, ...(await (body.archiveFirst === true ? deleteSessionFromMenu(host, sessionId) : deleteArchivedSession(host, sessionId))) });
                }
                catch (error) {
                    const status = typeof error.status === 'number' ? error.status : 500;
                    sendJson(response, status, { error: error instanceof Error ? error.message : String(error) });
                }
            },
        }),
        host.webServer.register({
            kind: 'exact',
            path: '/dsh-archive-pro/batch-delete',
            handler: async (request, response) => {
                if (request.method !== 'POST') {
                    response.writeHead(405, { allow: 'POST' });
                    response.end();
                    return;
                }
                if (!isSameOrigin(request)) {
                    sendJson(response, 403, { error: 'untrusted origin' });
                    return;
                }
                try {
                    const body = await readJsonBody(request);
                    const result = await batchDeleteArchivedSessions(host, body?.sessionIds);
                    sendJson(response, 200, { ok: true, ...result });
                }
                catch (error) {
                    const status = typeof error.status === 'number' ? error.status : 500;
                    sendJson(response, status, { error: error instanceof Error ? error.message : String(error) });
                }
            },
        }),
        host.webServer.register({
            kind: 'exact',
            path: '/dsh-archive-pro/batch-restore',
            handler: async (request, response) => {
                if (request.method !== 'POST') {
                    response.writeHead(405, { allow: 'POST' });
                    response.end();
                    return;
                }
                if (!isSameOrigin(request)) {
                    sendJson(response, 403, { error: 'untrusted origin' });
                    return;
                }
                try {
                    const body = await readJsonBody(request);
                    const result = await batchRestoreArchivedSessions(host, body?.sessionIds);
                    sendJson(response, 200, { ok: true, ...result });
                }
                catch (error) {
                    const status = typeof error.status === 'number' ? error.status : 500;
                    sendJson(response, status, { error: error instanceof Error ? error.message : String(error) });
                }
            },
        }),
        host.webServer.register({
            kind: 'exact',
            path: '/dsh-archive-pro/scheduled-sessions',
            handler: async (request, response) => {
                if (request.method !== 'GET') {
                    response.writeHead(405, { allow: 'GET' });
                    response.end();
                    return;
                }
                try {
                    // The page chooses how old a delivery must be before the
                    // session may be archived; the filter lives here so the counts
                    // on the page describe exactly what would be archived.
                    const minutes = Number(new URL(request.url ?? '/', 'http://localhost').searchParams.get('minAgeMinutes'));
                    const minAgeMs = Number.isFinite(minutes) && minutes > 0 ? minutes * 60000 : 0;
                    sendJson(response, 200, { ok: true, ...(await listScheduledSessions(host, { minAgeMs })) });
                }
                catch (error) {
                    const status = typeof error.status === 'number' ? error.status : 500;
                    sendJson(response, status, { error: error instanceof Error ? error.message : String(error) });
                }
            },
        }),
        host.webServer.register({
            kind: 'exact',
            path: '/dsh-archive-pro/archive',
            handler: async (request, response) => {
                if (request.method !== 'POST') {
                    response.writeHead(405, { allow: 'POST' });
                    response.end();
                    return;
                }
                if (!isSameOrigin(request)) {
                    sendJson(response, 403, { error: 'untrusted origin' });
                    return;
                }
                try {
                    const body = await readJsonBody(request);
                    const result = await archiveSessions(host, body?.sessionIds);
                    sendJson(response, 200, { ok: true, ...result });
                }
                catch (error) {
                    const status = typeof error.status === 'number' ? error.status : 500;
                    sendJson(response, status, { error: error instanceof Error ? error.message : String(error) });
                }
            },
        }),
    ];
    return () => {
        for (const dispose of disposers) dispose();
    };
}
