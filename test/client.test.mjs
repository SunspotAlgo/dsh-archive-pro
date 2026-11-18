/**
 * Contract checks for the scheduled-session half of dsh-archive-pro.
 *
 * The browser half must not reach into the schedule service directly: the
 * host owns that knowledge and answers over two local routes. These checks
 * keep the two halves honest.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const results = [];
function check(label, actual, expected) {
	const ok = JSON.stringify(actual) === JSON.stringify(expected);
	results.push(ok);
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
	if (!ok) console.log(`   expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const clientSource = readFileSync(join(root, 'client/client.js'), 'utf8');
const hostSource = readFileSync(join(root, 'lib/routes.js'), 'utf8');
const discoverySource = readFileSync(join(root, 'lib/scheduled-sessions.js'), 'utf8');

// --- the client module still loads through the DSH contract ----------------
let captured = null;
const sandbox = { __ModuleLoader__: { load: (spec) => { captured = spec; } }, setTimeout, clearTimeout };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(clientSource, sandbox);

check('module id', captured.id, 'dsh-archive-pro');

const reactStub = {
	createElement: () => null,
	Fragment: {},
	useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
	useMemo: (factory) => factory(),
	useCallback: (fn) => fn,
	useEffect: () => {},
	useRef: () => ({ current: null }),
	useSyncExternalStore: () => null,
};
const jsxStub = { jsx: () => null, jsxs: () => null, Fragment: {} };
const uiStub = { MenuItemButton: () => null, Modal: () => null, Button: () => null };

const moduleExports = captured.factory((name) => {
	if (name === 'react') return reactStub;
	if (name === 'react/jsx-runtime') return jsxStub;
	if (name === '@deepseek-ai/dsh-client-ui-primitives') return uiStub;
	throw new Error(`unexpected require: ${name}`);
});

check('exported name', moduleExports.name, 'dsh-archive-pro');

// --- both sections register ------------------------------------------------
const sections = [];
const ctx = {
	effect: (fn) => { fn(); return () => {}; },
	locale: { register: () => {}, bind: () => (key) => key },
	slots: {
		inject: (slotName, register) => { if (slotName === 'settings.section') register(); },
		register: (spec) => { sections.push({ name: spec.name, id: spec.id, order: spec.order }); return () => {}; },
	},
};
moduleExports.apply(ctx);

check('exactly one settings section', sections.length, 1);
check('the section keeps the archive id', sections.some((s) => s.id === 'archive-pro'), true);
check('no separate scheduled section', sections.some((s) => s.id === 'archive-pro-scheduled'), false);
check('the section hosts a tab bar', clientSource.includes('tabArchived') && clientSource.includes('tabScheduled'), true);

// --- the client only uses the local routes ---------------------------------
check('reads the scheduled list route', clientSource.includes('/dsh-archive-pro/scheduled-sessions'), true);
check('passes the age threshold to the host', clientSource.includes('minAgeMinutes=${minAgeMinutes}'), true);
check('archives through the archive route', clientSource.includes('"/dsh-archive-pro/archive"'), true);
check('does not call the schedule service itself', /ctx\.get\(['"]schedule['"]\)/.test(clientSource), false);

// --- the host exposes both routes ------------------------------------------
check('the host serves the scheduled list route', hostSource.includes("'/dsh-archive-pro/scheduled-sessions'"), true);
check('the host reads the age threshold', hostSource.includes("searchParams.get('minAgeMinutes')"), true);
check('the host archives through the archive route', hostSource.includes("'/dsh-archive-pro/archive'"), true);
check('the host rejects a cross-origin archive', hostSource.includes('untrusted origin'), true);

// --- the age threshold reaches the discovery -------------------------------
check('the discovery takes a minimum age', discoverySource.includes('minAgeMs'), true);
check('the discovery skips a running task', discoverySource.includes('executionActive'), true);
check('the discovery keeps the newest delivery time', discoverySource.includes('deliveredAtMs'), true);

// --- discovery safety ------------------------------------------------------
check('a session target is never a task session', discoverySource.includes("target?.kind === 'new' || target?.kind === 'new_once'"), true);
check('the discovery skips the session target', /createsSessions\(task\?\.target\)/.test(discoverySource), true);
check('the schedule service is read lazily', discoverySource.includes("host?.get?.('schedule')"), true);

// --- the manifest ships the new module -------------------------------------
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
check('the discovery module is packaged', manifest.files.includes('lib'), true);

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exitCode = failed === 0 ? 0 : 1;
