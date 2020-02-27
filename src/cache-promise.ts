import { CacheEntry } from './types/cache-entry';
import { CacheOptions } from './types/cache-options';
import {
    PromiseReturningFunction,
    PromiseReturningFunction0,
    PromiseReturningFunction1,
    PromiseReturningFunction2,
    PromiseReturningFunction3
} from './types/promise-returning-function';

export * from './types/promise-returning-function';
export * from './types/cache-options';

const DEFAULT_TTL = Number.MAX_VALUE;
const ENABLE_LOG = false;

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
    displayName: '<fn>',
    ttl: DEFAULT_TTL,
    staleWhileRevalidate: false
};

function log(...args: any[]): void {
    if (ENABLE_LOG) {
        console.log(...args);
    }
}

export function cachePromise<T>(
    req: PromiseReturningFunction0<T>,
    cacheOptions?: Partial<CacheOptions>
): PromiseReturningFunction0<T>;
export function cachePromise<A, T>(
    req: PromiseReturningFunction1<A, T>,
    cacheOptions?: Partial<CacheOptions>
): PromiseReturningFunction1<A, T>;
export function cachePromise<A, B, T>(
    req: PromiseReturningFunction2<A, B, T>,
    cacheOptions?: Partial<CacheOptions>
): PromiseReturningFunction2<A, B, T>;
export function cachePromise<A, B, C, T>(
    req: PromiseReturningFunction3<A, B, C, T>,
    cacheOptions?: Partial<CacheOptions>
): PromiseReturningFunction3<A, B, C, T>;

export function cachePromise<T>(
    req: PromiseReturningFunction<T>,
    cacheOptions?: Partial<CacheOptions>
): PromiseReturningFunction<T> {
    const opts = Object.assign({}, DEFAULT_CACHE_OPTIONS, cacheOptions);
    const cache: Record<string, CacheEntry<T>> = {};
    const pendingPromises: Record<string, Promise<T>> = {};

    return (...args: any[]) => {
        const key = JSON.stringify(args || {});

        if (pendingPromises[key] && !(opts.staleWhileRevalidate && cache[key])) {
            log(`cache ${opts.displayName}: ${key} promise cache hit`);
            return pendingPromises[key];
        }

        if (cache[key]) {
            const entry = cache[key];
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
                        doRequest().catch(err => {
                            console.error(
                                `cache ${opts.displayName}: ${key} failed to do stale revalidation in background: ${err}`
                            );
                        });
                    }
                    return Promise.resolve(entry.data);
                } else {
                    delete cache[key];
                }
            }
        }
        log(`cache ${opts.displayName}: ${key} cache miss, fetching...`);

        function doRequest(): Promise<T> {
            const actualRequest = req(...args);
            pendingPromises[key] = actualRequest;
            actualRequest
                .then(response => {
                    log(`cache ${opts.displayName}: ${key} storing result`);
                    cache[key] = {
                        time: getTime(),
                        data: response
                    };
                })
                .catch(() => {
                    /* no-op */
                })
                .then(() => {
                    log(`cache ${opts.displayName}: ${key} removing pending promise`);
                    delete pendingPromises[key];
                });
            return actualRequest;
        }
        return doRequest();
    };
}

export const getTime = () => {
    return new Date().getTime();
};
