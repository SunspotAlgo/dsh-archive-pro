/**
 * End-to-end test of the scheduled-session flow of dsh-archive-pro.
 *
 * A fake Host stands in for the real services: a schedule service with two
 * tasks (one creating sessions, one reusing a user session), a workspace
 * registry that records archive calls, and an on-disk session directory.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listScheduledSessions, archiveSessions } from '../lib/routes.js';

const results = [];
function check(label, actual, expected) {
	const ok = JSON.stringify(actual) === JSON.stringify(expected);
	results.push(ok);
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
	if (!ok) console.log(`   expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const home = mkdtempSync(join(tmpdir(), 'archive-pro-test-'));
const sessionsRoot = join(home, 'sessions', 'workspace-a');
mkdirSync(sessionsRoot, { recursive: true });
for (const id of ['session-11111111-1111-4111-8111-111111111111', 'session-22222222-2222-4222-8222-222222222222', 'session-99999999-9999-4999-8999-999999999999']) {
	mkdirSync(join(sessionsRoot, id), { recursive: true });
	writeFileSync(join(sessionsRoot, id, 'log.jsonl'), '{}\n');
}

// A title cache so the listing has names to show.
mkdirSync(join(home, 'storages', 'session_projcache', 'sessions'), { recursive: true });
writeFileSync(
	join(home, 'storages', 'session_projcache', 'sessions', 'session-11111111-1111-4111-8111-111111111111.json'),
	JSON.stringify({ record: { rows: { title: { val: '每日复盘一' } }, identity: { createdAt: 1_700_000_000_000 } } }),
);

const archivedCalls = [];
const archivedSet = new Set(['session-00000000-0000-4000-8000-000000000000']);

const tasks = [
	{
		id: 'task-new',
		record: { title: '每日复盘' },
		target: { kind: 'new', create: {} },
		records: [
			{ targetSessionId: 'session-11111111-1111-4111-8111-111111111111', deliveredAt: '2026-11-18T01:00:00Z' },
			{ targetSessionId: 'session-22222222-2222-4222-8222-222222222222', deliveredAt: '2026-11-18T02:00:00Z' },
			{ targetSessionId: 'session-00000000-0000-4000-8000-000000000000', deliveredAt: '2026-11-17T01:00:00Z' },
		],
	},
	{
		id: 'task-reuse',
		record: { title: '复用到旧会话' },
		target: { kind: 'session', sessionId: 'session-99999999-9999-4999-8999-999999999999' },
		records: [{ targetSessionId: 'session-99999999-9999-4999-8999-999999999999', deliveredAt: '2026-11-18T01:00:00Z' }],
	},
];

const host = {
	sessionPersistence: { root: join(home, 'sessions') },
	workspaceRegistry: {
		// The real registry exposes the archive set as a live getter.
		get archivedSessionIds() { return [...archivedSet]; },
		requireState: () => ({ archivedSessionIds: [...archivedSet], pinnedSessionIds: ['session-22222222-2222-4222-8222-222222222222'] }),
		list: () => [],
		async archiveSession(sessionId) {
			archivedCalls.push(sessionId);
			archivedSet.add(sessionId);
		},
	},
	get: (name) => (name === 'schedule'
		? {
			list: async () => ({ items: tasks, shown: tasks.length, total: tasks.length }),
			history: async ({ id }) => {
				const task = tasks.find((candidate) => candidate.id === id);
				return {
					id,
					records: task?.records ?? [],
					earlierRecordsUnavailable: false,
					earlierRecordsPruned: false,
					retention: { days: 30 },
				};
			},
		}
		: undefined),
};

console.log('\n=== the listing holds only unarchived task sessions ===');
{
	const data = await listScheduledSessions(host);
	check('available', data.available, true);
	check('two sessions listed', data.sessions.length, 2);
	const ids = data.sessions.map((r) => r.sessionId);
	check('the already archived session is gone', ids.includes('session-00000000-0000-4000-8000-000000000000'), false);
	check('the reused user session is gone', ids.includes('session-99999999-9999-4999-8999-999999999999'), false);
	check('the task sessions are present', ids.includes('session-11111111-1111-4111-8111-111111111111') && ids.includes('session-22222222-2222-4222-8222-222222222222'), true);
	check('the task title is shown', data.sessions.find((r) => r.sessionId === 'session-11111111-1111-4111-8111-111111111111').taskTitle, '每日复盘');
	check('the session title is read from the cache', data.sessions.find((r) => r.sessionId === 'session-11111111-1111-4111-8111-111111111111').title, '每日复盘一');
	check('the pinned flag is set', data.sessions.find((r) => r.sessionId === 'session-22222222-2222-4222-8222-222222222222').isPinned, true);
	check('the size is measured', data.sessions.find((r) => r.sessionId === 'session-11111111-1111-4111-8111-111111111111').sizeBytes > 0, true);
}

console.log('\n=== archiving the selection hides them from the listing ===');
{
	const result = await archiveSessions(host, ['session-11111111-1111-4111-8111-111111111111', 'session-22222222-2222-4222-8222-222222222222']);
	check('two archived', result.archived, 2);
	check('no failures', result.failed, 0);
	check('the registry was called for both', archivedCalls.length, 2);

	const data = await listScheduledSessions(host);
	check('the listing is empty now', data.sessions.length, 0);
}

console.log('\n=== one failure does not stop the batch ===');
{
	const fresh = new Set(['session-00000000-0000-4000-8000-000000000000']);
	const calls = [];
	const failing = {
		...host,
		workspaceRegistry: {
			...host.workspaceRegistry,
			archivedSessionIds: [...fresh],
			async archiveSession(sessionId) {
				calls.push(sessionId);
				if (sessionId === 'session-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') throw new Error('cannot archive');
				fresh.add(sessionId);
			},
		},
	};
	const result = await archiveSessions(failing, ['session-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'session-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'session-cccccccc-cccc-4ccc-8ccc-cccccccccccc']);
	check('two succeeded', result.archived, 2);
	check('one failed', result.failed, 1);
	check('the failure is reported', result.errors[0].sessionId, 'session-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
	check('the error message is kept', result.errors[0].error.includes('cannot archive'), true);
	check('every id was attempted', calls.length, 3);
}

console.log('\n=== invalid ids are rejected before any call ===');
{
	const calls = [];
	const strict = {
		...host,
		workspaceRegistry: {
			...host.workspaceRegistry,
			async archiveSession(sessionId) { calls.push(sessionId); },
		},
	};
	const result = await archiveSessions(strict, ['not-a-session', 'session-dddddddd-dddd-4ddd-8ddd-dddddddddddd']);
	check('only the valid id was attempted', calls, ['session-dddddddd-dddd-4ddd-8ddd-dddddddddddd']);
	check('one archived', result.archived, 1);
}

console.log('\n=== without a schedule service the listing reports unavailability ===');
{
	const without = { ...host, get: () => undefined };
	const data = await listScheduledSessions(without);
	check('not available', data.available, false);
	check('no sessions', data.sessions.length, 0);
}

rmSync(home, { recursive: true, force: true });

console.log('\n=== a session the user deleted is not counted as found ===');
{
	// The delivery history names a session that no longer exists anywhere.
	const goneHome = mkdtempSync(join(tmpdir(), 'archive-pro-gone-'));
	const goneId = 'session-33333333-3333-4333-8333-333333333333';
	const liveId = 'session-44444444-4444-4444-8444-444444444444';
	mkdirSync(join(goneHome, 'sessions', 'ws', liveId), { recursive: true });
	const old = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
	const goneTasks = [
		{
			id: 'task-gone',
			record: { title: '历史任务' },
			target: { kind: 'new', create: {} },
			records: [
				{ targetSessionId: goneId, deliveredAt: old },
				{ targetSessionId: liveId, deliveredAt: old },
			],
		},
	];
	const goneHost = {
		sessionPersistence: { root: join(goneHome, 'sessions') },
		workspaceRegistry: {
			get archivedSessionIds() { return []; },
			requireState: () => ({ pinnedSessionIds: [] }),
			list: () => [],
		},
		get: (name) => (name === 'schedule'
			? {
				list: async () => ({ items: goneTasks, shown: goneTasks.length, total: goneTasks.length }),
				history: async ({ id }) => ({
					id,
					records: goneTasks.find((t) => t.id === id)?.records ?? [],
					earlierRecordsUnavailable: false,
					earlierRecordsPruned: false,
					retention: { days: 30 },
				}),
			}
			: undefined),
	};

	const body = await listScheduledSessions(goneHost, { minAgeMs: 60 * 60 * 1000 });
	check('only the live session is listed', body.sessions.length, 1);
	check('the count matches the list', body.discovered, body.sessions.length);
	check('the vanished session is counted as gone', body.skippedGone, 1);
	check('the history total still names both', body.total, 2);
	rmSync(goneHome, { recursive: true, force: true });
}

console.log('\n=== an already archived session is counted separately ===');
{
	const archHome = mkdtempSync(join(tmpdir(), 'archive-pro-arch-'));
	const archId = 'session-55555555-5555-4555-8555-555555555555';
	mkdirSync(join(archHome, 'sessions', 'ws', archId), { recursive: true });
	const old = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
	const archTasks = [
		{
			id: 'task-arch',
			record: { title: '已归档' },
			target: { kind: 'new', create: {} },
			records: [{ targetSessionId: archId, deliveredAt: old }],
		},
	];
	const archHost = {
		sessionPersistence: { root: join(archHome, 'sessions') },
		workspaceRegistry: {
			get archivedSessionIds() { return [archId]; },
			requireState: () => ({ pinnedSessionIds: [] }),
			list: () => [],
		},
		get: (name) => (name === 'schedule'
			? {
				list: async () => ({ items: archTasks, shown: archTasks.length, total: archTasks.length }),
				history: async ({ id }) => ({
					id,
					records: archTasks.find((t) => t.id === id)?.records ?? [],
					earlierRecordsUnavailable: false,
					earlierRecordsPruned: false,
					retention: { days: 30 },
				}),
			}
			: undefined),
	};

	const body = await listScheduledSessions(archHost, { minAgeMs: 60 * 60 * 1000 });
	check('nothing is offered', body.sessions.length, 0);
	check('the count matches the empty list', body.discovered, 0);
	check('the archived session is counted as archived', body.skippedArchived, 1);
	rmSync(archHome, { recursive: true, force: true });
}

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exitCode = failed === 0 ? 0 : 1;
