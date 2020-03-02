import { CacheEntry } from './types/cache-entry';
import { CacheOptions } from './types/cache-options';

const DEFAULT_TTL = Number.MAX_VALUE;
const DEFAULT_CLEANUP_INTERVAL = 10000;

export function getDefaultCacheOptions<T>(): CacheOptions<T> {
    return {
        cache: new Map<string, CacheEntry<T>>(),
        cleanupInterval: DEFAULT_CLEANUP_INTERVAL,
        debug: false,
        displayName: '<fn>',
        key: JSON.stringify,
        staleWhileRevalidate: false,
        stats: () => {
            /* no-op */
        },
        ttl: DEFAULT_TTL
    };
}
