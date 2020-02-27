import { CacheEntry } from './types/cache-entry';
import { CacheOptions } from './types/cache-options';

const DEFAULT_TTL = Number.MAX_VALUE;
const DEFAULT_CLEANUP_INTERVAL = 10000;

export function getDefaultCacheOptions<T>(): CacheOptions<T> {
    return {
        displayName: '<fn>',
        ttl: DEFAULT_TTL,
        staleWhileRevalidate: false,
        key: JSON.stringify,
        cache: new Map<string, CacheEntry<T>>(),
        cleanupInterval: DEFAULT_CLEANUP_INTERVAL,
        debug: false
    };
}
