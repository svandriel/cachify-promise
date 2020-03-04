import { CacheOptions } from '../types/cache-options';
import { CacheState } from '../types/cache-state';
import { isExpired } from './is-expired';
import { log } from './log';

export function startCleanupJob<T>(state: CacheState<T>, opts: CacheOptions<T>): void {
    if (!state.cleanupInterval && !opts.staleWhileRevalidate) {
        log(opts, `Starting cleanup job every ${opts.cleanupInterval} ms`);
        state.cleanupInterval = setInterval(() => {
            cleanup(state, opts);
        }, opts.cleanupInterval);
    }
}

export function stopCleanupJob<T>(state: CacheState<T>, opts: CacheOptions<T>): void {
    if (state.cleanupInterval) {
        log(opts, 'Stopping cleanup job');
        clearInterval(state.cleanupInterval);
        state.cleanupInterval = undefined;
    }
}

function cleanup<T>(state: CacheState<T>, opts: CacheOptions<T>): void {
    const removeableKeys: string[] = [];
    for (const [key, value] of state.cacheMap.entries()) {
        if (isExpired(opts, value)) {
            removeableKeys.push(key);
        }
    }
    if (removeableKeys.length > 0) {
        log(opts, `Expired keys: ${removeableKeys}`);
        removeableKeys.forEach(key => {
            state.cacheMap.delete(key);
        });
    }
    if (state.cacheMap.size === 0) {
        stopCleanupJob(state, opts);
    }
}
