import { CacheEntry } from './types/cache-entry';
import { CacheOptions, CacheOptions0, CacheOptions1, CacheOptions2, CacheOptions3 } from './types/cache-options';
import {
    PromiseReturningFunction,
    PromiseReturningFunction0,
    PromiseReturningFunction1,
    PromiseReturningFunction2,
    PromiseReturningFunction3
} from './types/promise-returning-function';

export * from './types/promise-returning-function';
export * from './types/cache-options';
export * from './types/cache-entry';

const DEFAULT_TTL = Number.MAX_VALUE;
const ENABLE_LOG = false;

function getDefaultCacheOptions<T>(): CacheOptions<T> {
    return {
        displayName: '<fn>',
        ttl: DEFAULT_TTL,
        staleWhileRevalidate: false,
        key: JSON.stringify,
        cache: new Map<string, CacheEntry<T>>()
    };
}

function log(...args: any[]): void {
    if (ENABLE_LOG) {
        console.log(...args);
    }
}

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

    return (...args: any[]) => {
        const key = opts.key(...args);

        if (pendingPromises[key] && !(opts.staleWhileRevalidate && cache.has(key))) {
            log(`cache ${opts.displayName}: ${key} promise cache hit`);
            return pendingPromises[key];
        }

        if (cache.has(key)) {
            const entry = cache.get(key) as CacheEntry<T>;
            const age = getTime() - entry.time;
            if (age <= opts.ttl) {
                log(`cache ${opts.displayName}: ${key} cache hit - age: ${age}, expiration: ${opts.ttl}`);
                return Promise.resolve(entry.data);
            } else {
                // expired
                if (opts.staleWhileRevalidate) {
                    if (pendingPromises[key]) {
                        log(
                            `cache ${opts.displayName}: ${key} stale cache hit, but already revalidating - age: ${age}, ttl: ${opts.ttl}`
                        );
                    } else {
                        log(
                            `cache ${opts.displayName}: ${key} stale cache hit, revalidating - age: ${age}, ttl: ${opts.ttl}`
                        );
                        execute().catch(err => {
                            log(
                                `cache ${opts.displayName}: ${key} failed to do stale revalidation in background: ${err}`
                            );
                        });
                    }
                    return Promise.resolve(entry.data);
                } else {
                    cache.delete(key);
                }
            }
        }

        log(`cache ${opts.displayName}: ${key} cache miss, fetching...`);

        function execute(): Promise<T> {
            const promise = fn(...args);
            pendingPromises[key] = promise;
            promise
                .then(response => {
                    if (opts.ttl > 0) {
                        log(`cache ${opts.displayName}: ${key} storing result`);
                        cache.set(key, {
                            time: getTime(),
                            data: response
                        });
                    }
                })
                .catch(() => {
                    /* no-op */
                })
                .then(() => {
                    log(`cache ${opts.displayName}: ${key} removing pending promise`);
                    delete pendingPromises[key];
                });
            return promise;
        }
        return execute();
    };
}

export const getTime = () => {
    return new Date().getTime();
};
