import { getTime } from '../cache-promise';
import { CacheOptions } from '../types/cache-options';
import { CacheState } from '../types/cache-state';
import { PromiseReturningFunction } from '../types/promise-returning-function';
import { startCleanupJob } from './cleanup';
import { incrementStatsValue } from './increment-stats-value';
import { log } from './log';

export function executePromise<T>(
    state: CacheState<T>,
    opts: CacheOptions<T>,
    fn: PromiseReturningFunction<T>,
    key: string,
    args: any[]
): Promise<T> {
    const promise = fn(...args);
    state.promiseCacheMap[key] = promise;

    trackPromiseExecution(state, opts, promise, key);
    return promise;
}

function trackPromiseExecution<T>(state: CacheState<T>, opts: CacheOptions<T>, promise: Promise<T>, key: string): void {
    promise
        .then(response => {
            if (opts.ttl > 0) {
                log(opts, `Storing result '${key}'`);
                state.cacheMap.set(key, {
                    time: getTime(),
                    data: response
                });
                incrementStatsValue(state, opts, 'put');
                startCleanupJob(state, opts);
            }
        })
        .catch(() => {
            /* no-op */
        })
        .then(() => {
            log(opts, `Removing pending promise for '${key}'`);
            delete state.promiseCacheMap[key];
        });
}
