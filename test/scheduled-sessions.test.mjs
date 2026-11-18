/**
 * Tests for the scheduled-session discovery of dsh-archive-pro.
 *
 * The critical property: a task that delivers into a Session the user already
 * had (`target.kind === 'session'`) must never contribute that Session to the
 * list, because archiving it would hide the user's own conversation.
 */
import { createsSessions, collectTaskSessions } from '../lib/scheduled-sessions.js';

const results = [];
function check(label, actual, expected) {
	const ok = JSON.stringify(actual) === JSON.stringify(expected);
	results.push(ok);
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
	if (!ok) console.log(`   expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/** Build a fake schedule service from a task list. */
function makeSchedule(tasks) {
	return {
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
	};
}

console.log('\n=== target classification ===');
check('new creates sessions', createsSessions({ kind: 'new' }), true);
check('new_once creates sessions', createsSessions({ kind: 'new_once' }), true);
check('session does not create sessions', createsSessions({ kind: 'session' }), false);
check('a missing target creates none', createsSessions(undefined), false);

console.log('\n=== a "new" task contributes its sessions ===');
{
	const host = {
		get: (name) => (name === 'schedule'
			? makeSchedule([
				{
					id: 'task-1',
					record: { title: '每日复盘' },
					target: { kind: 'new', create: {} },
					records: [
						{ targetSessionId: 'session-a', deliveredAt: '2026-11-18T01:00:00Z' },
						{ targetSessionId: 'session-b', deliveredAt: '2026-11-18T02:00:00Z' },
					],
				},
			])
			: undefined),
	};
	const scan = await collectTaskSessions(host);
	check('available', scan.available, true);
	check('task count', scan.tasks, 1);
	check('session count', scan.sessions.size, 2);
	check('task title kept', scan.sessions.get('session-a').taskTitle, '每日复盘');
}

console.log('\n=== a "session" task never contributes the user session ===');
{
	const host = {
		get: (name) => (name === 'schedule'
			? makeSchedule([
				{
					id: 'task-2',
					record: { title: '复用到旧会话' },
					target: { kind: 'session', sessionId: 'session-user' },
					records: [
						{ targetSessionId: 'session-user', deliveredAt: '2026-11-18T01:00:00Z' },
					],
				},
			])
			: undefined),
	};
	const scan = await collectTaskSessions(host);
	check('no sessions collected', scan.sessions.size, 0);
	check('the user session is unknown to the scan', scan.sessions.has('session-user'), false);
}

console.log('\n=== both kinds together ===');
{
	const host = {
		get: (name) => (name === 'schedule'
			? makeSchedule([
				{
					id: 'task-new',
					record: { title: '每次新建' },
					target: { kind: 'new', create: {} },
					records: [{ targetSessionId: 'session-x' }],
				},
				{
					id: 'task-reuse',
					record: { title: '复用旧会话' },
					target: { kind: 'session', sessionId: 'session-user' },
					records: [{ targetSessionId: 'session-user' }],
				},
				{
					id: 'task-once',
					record: { title: '仅首次新建' },
					target: { kind: 'new_once', sessionId: 'session-y', create: {} },
					records: [{ targetSessionId: 'session-y' }],
				},
			])
			: undefined),
	};
	const scan = await collectTaskSessions(host);
	check('two sessions collected', scan.sessions.size, 2);
	check('the new session is present', scan.sessions.has('session-x'), true);
	check('the new_once session is present', scan.sessions.has('session-y'), true);
	check('the reused user session is absent', scan.sessions.has('session-user'), false);
}

console.log('\n=== a missing schedule service degrades quietly ===');
{
	const host = { get: () => undefined };
	const scan = await collectTaskSessions(host);
	check('not available', scan.available, false);
	check('no sessions', scan.sessions.size, 0);
}

console.log('\n=== a throwing schedule service degrades quietly ===');
{
	const host = {
		get: () => ({
			list: async () => { throw new Error('boom'); },
			history: async () => { throw new Error('boom'); },
		}),
	};
	const scan = await collectTaskSessions(host);
	check('available but empty', scan.sessions.size, 0);
}

console.log('\n=== history paging is followed ===');
{
	let calls = 0;
	const host = {
		get: () => ({
			list: async () => ({ items: [{ id: 'task-p', record: { title: '分页' }, target: { kind: 'new', create: {} } }] }),
			history: async ({ before }) => {
				calls++;
				if (before === undefined) {
					return {
						id: 'task-p',
						records: [{ targetSessionId: 'session-1' }],
						nextBefore: 'cursor-1',
						earlierRecordsUnavailable: false,
						earlierRecordsPruned: false,
						retention: { days: 30 },
					};
				}
				return {
					id: 'task-p',
					records: [{ targetSessionId: 'session-2' }],
					earlierRecordsUnavailable: false,
					earlierRecordsPruned: false,
					retention: { days: 30 },
				};
			},
		}),
	};
	const scan = await collectTaskSessions(host);
	check('two pages read', calls, 2);
	check('both pages contributed', scan.sessions.size, 2);
}

console.log('\n=== the age threshold keeps fresh sessions out ===');
{
	// One session was delivered long ago, the other minutes ago.
	const old = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
	const fresh = new Date(Date.now() - 5 * 60 * 1000).toISOString();
	const host = {
		get: (name) => (name === 'schedule'
			? makeSchedule([
				{
					id: 'task-age',
					record: { title: '按时间筛选' },
					target: { kind: 'new', create: {} },
					records: [
						{ targetSessionId: 'session-old', deliveredAt: old },
						{ targetSessionId: 'session-fresh', deliveredAt: fresh },
					],
				},
			])
			: undefined),
	};

	const withoutThreshold = await collectTaskSessions(host);
	check('without a threshold both are found', withoutThreshold.sessions.size, 2);

	const oneHour = await collectTaskSessions(host, { minAgeMs: 60 * 60 * 1000 });
	check('the old session survives the threshold', oneHour.sessions.has('session-old'), true);
	check('the fresh session is left out', oneHour.sessions.has('session-fresh'), false);
	check('the fresh session is counted as skipped', oneHour.skippedRecent, 1);

	const oneMinute = await collectTaskSessions(host, { minAgeMs: 1 * 60 * 1000 });
	check('a shorter threshold keeps the fresh session', oneMinute.sessions.has('session-fresh'), true);
	check('and keeps the old one too', oneMinute.sessions.has('session-old'), true);
}

console.log('\n=== a task that is still executing is skipped entirely ===');
{
	const old = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
	const host = {
		get: (name) => (name === 'schedule'
			? makeSchedule([
				{
					id: 'task-running',
					record: { title: '正在执行' },
					target: { kind: 'new', create: {} },
					executionActive: true,
					records: [{ targetSessionId: 'session-running', deliveredAt: old }],
				},
			])
			: undefined),
	};
	const scan = await collectTaskSessions(host, { minAgeMs: 60 * 60 * 1000 });
	check('no session is offered', scan.sessions.size, 0);
	check('the running task is counted', scan.skippedRunning, 1);
}

console.log('\n=== the newest delivery decides the age ===');
{
	const old = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
	const fresh = new Date(Date.now() - 2 * 60 * 1000).toISOString();
	const host = {
		get: (name) => (name === 'schedule'
			? makeSchedule([
				{
					id: 'task-reuse',
					record: { title: '重复投递' },
					target: { kind: 'new', create: {} },
					records: [
						{ targetSessionId: 'session-shared', deliveredAt: old },
						{ targetSessionId: 'session-shared', deliveredAt: fresh },
					],
				},
			])
			: undefined),
	};
	const scan = await collectTaskSessions(host, { minAgeMs: 60 * 60 * 1000 });
	check('the session is excluded because it was delivered again recently', scan.sessions.size, 0);
}

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exitCode = failed === 0 ? 0 : 1;
