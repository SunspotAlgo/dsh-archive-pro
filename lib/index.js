/**
 * dsh-archive-pro host half: mounts the archive-management HTTP routes
 * once the profile composes the webServer service.
 */
import { mountArchiveRoutes, reconcileDeletedSessions, isSessionDeletionBlocked } from './routes.js';

/** Cordis plugin identity (the name the profile patch inserts). */
export const name = 'dsh-archive-pro';

/**
 * Register the plugin against the host context.
 * @param ctx - Host context that may acquire the webServer service.
 * @param config - Optional profile override from the loader (unused today).
 */
export function apply(ctx, config) {
    ctx.inject(['webServer', 'storageDomain', 'workspaceRegistry', 'sessionPersistence', 'sessions', 'agents'], (host) => {
        host.effect(() => mountArchiveRoutes(host), 'dsh-archive-pro: http routes');
        host.on('agent/created', ({ agent }) => {
            if (isSessionDeletionBlocked(host, agent.id)) {
                throw new Error('该会话已删除或正在删除，不能重新加载。');
            }
        });
        const repair = () => reconcileDeletedSessions(host).catch(error => {
            console.warn('archive-pro: deletion reconciliation failed:', error.message);
        });
        host.on('domain/changed', change => {
            if (change.domain === 'workspace'
                || (change.domain === 'session_projcache' && change.operation !== 'deleted'
                    && isSessionDeletionBlocked(host, change.key))) void repair();
        });
        void repair();
    });
}
