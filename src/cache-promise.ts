import { getDefaultCacheOptions } from './defaults';
import { CacheEntry } from './types/cache-entry';
import { CacheOptions, CacheOptions0, CacheOptions1, CacheOptions2, CacheOptions3 } from './types/cache-options';
import {
    PromiseReturningFunction,
    PromiseReturningFunction0,
    PromiseReturningFunction1,
    PromiseReturningFunction2,
    PromiseReturningFunction3
} from './types/promise-returning-function';
import { CacheStats } from './types/stats';

export * from './types/cache-entry';
export * from './types/cache-options';
export * from './types/item-storage';
export * from './types/promise-returning-function';
export * from './types/stats';

export function cachifyPromise<T>(
    req: PromiseReturningFunction0<T>,
    cacheOptions?: Partial<CacheOptions0<T>>
): PromiseReturningFunction0<T>;
export function cachifyPromise<A, T>(
    req: PromiseReturningFunction1<A, T>,
    cacheOptions?: Partial<CacheOptions1<A, T>>
): PromiseReturningFunction1<A, T>;
export function cachifyPromise<A, B, T>(
    req: PromiseReturningFunction2<A, B, T>,
    cacheOptions?: Partial<CacheOptions2<A, B, T>>
): PromiseReturningFunction2<A, B, T>;
export function cachifyPromise<A, B, C, T>(
    req: PromiseReturningFunction3<A, B, C, T>,
    cacheOptions?: Partial<CacheOptions3<A, B, C, T>>
): PromiseReturningFunction3<A, B, C, T>;

export function cachifyPromise<T>(
    fn: PromiseReturningFunction<T>,
    cacheOptions?: Partial<CacheOptions<T>>
): PromiseReturningFunction<T> {
    const opts: CacheOptions<T> = Object.assign({}, getDefaultCacheOptions<T>(), cacheOptions);
    const cache = opts.cache;
    const pendingPromises: Record<string, Promise<T>> = {};
    let cleanupInterval: NodeJS.Timeout | undefined;

    const stats: CacheStats = {
        hitValue: 0,
        hitPromise: 0,
        miss: 0,
        put: 0
    };

    return (...args: any[]) => {
        const key = opts.key(...args);

        if (pendingPromises[key] && !(opts.staleWhileRevalidate && cache.has(key))) {
            log(`cache ${opts.displayName}: ${key} promise cache hit`);
            incrementStatsValue('hitPromise');
            return pendingPromises[key];
        }

        if (cache.has(key)) {
            const entry = cache.get(key) as CacheEntry<T>;
            if (!isExpired(entry)) {
                log(`Cache hit for '${key}'`);
                incrementStatsValue('hitValue');
                return Promise.resolve(entry.data);
            } else {
                // expired
                if (opts.staleWhileRevalidate) {
                    if (pendingPromises[key]) {
                        log(`Stale cache hit for '${key}', but already revalidating`);
                    } else {
                        log(`Stale cache hit for '${key}', revalidating`);
                        execute().catch(err => {
                            log(`Failed to do stale revalidation for '${key}' in background: ${err}`);
                        });
                    }
                    return Promise.resolve(entry.data);
                } else {
                    cache.delete(key);
                    if (cache.size === 0) {
                        stopCleanupJob();
                    }
                }
            }
        }
        incrementStatsValue('miss');

        log(`Cache miss for '${key}', fetching...`);

        function execute(): Promise<T> {
            const promise = fn(...args);
            pendingPromises[key] = promise;

            promise
                .then(response => {
                    if (opts.ttl > 0) {
                        log(`Storing result '${key}'`);
                        cache.set(key, {
                            time: getTime(),
                            data: response
                        });
                        incrementStatsValue('put');
                        startCleanupJob();
                    }
                })
                .catch(() => {
                    /* no-op */
                })
                .then(() => {
                    log(`Removing pending promise '${key}'`);
                    delete pendingPromises[key];
                });
            return promise;
        }
        return execute();
    };

    function startCleanupJob(): void {
        if (!cleanupInterval && !opts.staleWhileRevalidate) {
            log(`Starting cleanup job every ${opts.cleanupInterval} ms`);
            cleanupInterval = setInterval(cleanup, opts.cleanupInterval);
        }
    }

    function stopCleanupJob(): void {
        if (cleanupInterval) {
            log(`Stopping cleanup job`);
            clearInterval(cleanupInterval);
            cleanupInterval = undefined;
        }
    }

    function isExpired(entry: CacheEntry<T>): boolean {
        const age = getTime() - entry.time;
        return age > opts.ttl;
    }

    function cleanup(): void {
        const removeableKeys: string[] = [];
        for (const [key, value] of cache.entries()) {
            if (isExpired(value)) {
                removeableKeys.push(key);
            }
        }
        if (removeableKeys.length > 0) {
            log(`Expired keys: ${removeableKeys}`);
            removeableKeys.forEach(key => {
                cache.delete(key);
            });
        }
        if (cache.size === 0) {
            stopCleanupJob();
        }
    }

    function incrementStatsValue<K extends keyof CacheStats>(key: K): void {
        stats[key] = stats[key] + 1;
        opts.stats(Object.assign({}, stats));
    }

    function log(...args: any[]): void {
        /* istanbul ignore if  */
        if (opts.debug) {
            console.log(`[cache] ${opts.displayName}`, ...args);
        }
    }
}

export const getTime = () => {
    return new Date().getTime();
};
