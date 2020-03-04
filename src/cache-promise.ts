import { getDefaultCacheOptions } from './defaults';
import { stopCleanupJob } from './lib/cleanup';
import { executePromise } from './lib/execute-promise';
import { incrementStatsValue } from './lib/increment-stats-value';
import { isExpired } from './lib/is-expired';
import { log } from './lib/log';
import { CacheEntry } from './types/cache-entry';
import { CacheOptions, CacheOptions0, CacheOptions1, CacheOptions2, CacheOptions3 } from './types/cache-options';
import { CacheState } from './types/cache-state';
import {
    PromiseReturningFunction,
    PromiseReturningFunction0,
    PromiseReturningFunction1,
    PromiseReturningFunction2,
    PromiseReturningFunction3
} from './types/promise-returning-function';

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

    const state: CacheState<T> = {
        cacheMap: opts.cacheMap,
        promiseCacheMap: {},
        stats: {
            hitValue: 0,
            hitPromise: 0,
            miss: 0,
            put: 0
        }
    };

    return (...args: any[]) => {
        const key = opts.cacheKeyFn(...args);

        if (state.promiseCacheMap[key] && !(opts.staleWhileRevalidate && state.cacheMap.has(key))) {
            log(opts, `Promise cache hit for '${key}'`);
            incrementStatsValue(state, opts, 'hitPromise');
            return state.promiseCacheMap[key];
        }

        if (state.cacheMap.has(key)) {
            const entry = state.cacheMap.get(key) as CacheEntry<T>;
            if (!isExpired(opts, entry)) {
                log(opts, `Cache hit for '${key}'`);
                incrementStatsValue(state, opts, 'hitValue');
                return Promise.resolve(entry.data);
            } else {
                // expired
                if (opts.staleWhileRevalidate) {
                    if (state.promiseCacheMap[key]) {
                        log(opts, `Stale cache hit for '${key}', but already revalidating`);
                    } else {
                        log(opts, `Stale cache hit for '${key}', revalidating`);
                        executePromise(state, opts, fn, key, args).catch(err => {
                            log(opts, `Failed to do stale revalidation for '${key}' in background: ${err}`);
                        });
                    }
                    return Promise.resolve(entry.data);
                } else {
                    state.cacheMap.delete(key);
                    if (state.cacheMap.size === 0) {
                        stopCleanupJob(state, opts);
                    }
                }
            }
        }
        incrementStatsValue(state, opts, 'miss');

        log(opts, `Cache miss for '${key}', fetching...`);

        return executePromise(state, opts, fn, key, args);
    };
}

export const getTime = () => {
    return new Date().getTime();
};
