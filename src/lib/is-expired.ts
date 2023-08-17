import { getTime } from '../cache-promise';
import { CacheEntry } from '../types/cache-entry';
import { CacheOptions } from '../types/cache-options';

export function isExpired<T>(
    opts: CacheOptions<T>,
    entry: CacheEntry<T>
): boolean {
    const age = getTime() - entry.time;
    return age > opts.ttl;
}
