import { CacheEntry, cachifyPromise } from './cache-promise';
import * as stub from './cache-promise';
import { deferred } from './test-util/deferred';
import { expectRejection } from './test-util/expect-rejection';
import { tick } from './test-util/tick';
import { ItemStorage } from './types/item-storage';
import { CacheStats } from './types/stats';

const debug = !!process.env.DEBUG;

describe('cache-promise', () => {
    beforeEach(() => {
        mockSetInterval();
    });
    it('returns existing resolved value', async () => {
        const square = jest.fn((x: number) => Promise.resolve(x * x));
        const stats = jest.fn<void, [CacheStats]>();
        const squareCached = cachifyPromise(square, {
            cacheKeyFn: item => `${item}`,
            debug,
            displayName: 'fn1',
            statsFn: stats
        });

        expect(await squareCached(2)).toBe(4);
        expect(square).toHaveBeenCalledTimes(1);
        expect(square).toHaveBeenCalledWith(2);

        await tick();

        expect(await squareCached(2)).toBe(4);
        expect(square).toHaveBeenCalledTimes(1);

        expect(await squareCached(3)).toBe(9);
        expect(square).toHaveBeenCalledTimes(2);
        expect(square).toHaveBeenCalledWith(3);

        expect(stats).toHaveBeenLastCalledWith({
            hitPromise: 0,
            hitValue: 1,
            miss: 2,
            put: 2
        });
    });

    it('returns existing resolved value for multi-arg functions', async () => {
        const add = jest.fn((x: number, y: number) => Promise.resolve(x + y));
        const stats = jest.fn<void, [CacheStats]>();
        const addCached = cachifyPromise(add, {
            debug,
            displayName: 'fn1',
            statsFn: stats
        });

        expect(await addCached(2, 3)).toBe(5);
        expect(add).toHaveBeenCalledTimes(1);
        expect(add).toHaveBeenCalledWith(2, 3);

        await tick();

        expect(await addCached(2, 3)).toBe(5);
        expect(add).toHaveBeenCalledTimes(1);

        expect(await addCached(2, 5)).toBe(7);
        expect(add).toHaveBeenCalledTimes(2);
        expect(add).toHaveBeenCalledWith(2, 5);

        expect(stats).toHaveBeenLastCalledWith({
            hitPromise: 0,
            hitValue: 1,
            miss: 2,
            put: 2
        });
    });

    it('does not cache resolved values with ttl = 0', async () => {
        const stats = jest.fn<void, [CacheStats]>();
        const myCache: ItemStorage<number> = {
            delete: jest.fn(),
            get: jest.fn(),
            has: jest.fn(),
            set: jest.fn(),
            entries: jest.fn(),
            size: 0
        };

        const square = jest.fn((x: number) => Promise.resolve(x * x));
        const squareCached = cachifyPromise(square, {
            ttl: 0,
            cacheMap: myCache,
            debug,
            displayName: 'fn2',
            statsFn: stats
        });

        expect(await squareCached(2)).toBe(4);
        expect(myCache.set).not.toHaveBeenCalled();

        expect(stats).toHaveBeenLastCalledWith({
            hitPromise: 0,
            hitValue: 0,
            miss: 1,
            put: 0
        });
    });

    it('expires values', async () => {
        const stats = jest.fn<void, [CacheStats]>();

        let now = new Date().getTime();
        jest.spyOn(stub, 'getTime').mockImplementation(() => now);

        const square = jest.fn((x: number) => Promise.resolve(x * x));
        const squareCached = cachifyPromise(square, {
            ttl: 1000,
            debug,
            displayName: 'fn3',
            statsFn: stats
        });

        expect(await squareCached(2)).toBe(4);
        expect(square).toHaveBeenCalledTimes(1);
        expect(square).toHaveBeenCalledWith(2);

        now += 1001;

        await tick();

        expect(await squareCached(2)).toBe(4);

        expect(square).toHaveBeenCalledTimes(2);

        expect(stats).toHaveBeenLastCalledWith({
            hitPromise: 0,
            hitValue: 0,
            miss: 2,
            put: 2
        });
    });

    it('returns pending promise', async () => {
        const stats = jest.fn<void, [CacheStats]>();

        const { promise, resolve } = deferred<number>();
        const square = jest.fn((_: number) => promise);

        const squareCached = cachifyPromise(square, {
            debug,
            displayName: 'fn4',
            statsFn: stats
        });

        // Call two times with same argument
        const cachedPromise1 = squareCached(2);
        const cachedPromise2 = squareCached(2);

        // Both should return same promise
        expect(cachedPromise1).toBe(cachedPromise2);

        // Underlying function should have been called just once
        expect(square).toHaveBeenCalledTimes(1);

        // When the underlying promise resolves...
        resolve(4);

        // ... both promises should render the same value
        expect(await cachedPromise1).toBe(4);
        expect(await cachedPromise2).toBe(4);

        expect(stats).toHaveBeenLastCalledWith({
            hitPromise: 1,
            hitValue: 0,
            miss: 1,
            put: 1
        });
    });

    it('returns pending promise that has been rejected', async () => {
        const stats = jest.fn<void, [CacheStats]>();

        const { promise, reject } = deferred<number>();
        const square = jest.fn((_: number) => promise);

        const squareCached = cachifyPromise(square, {
            debug,
            displayName: 'fn5',
            statsFn: stats
        });

        const cachedPromise1 = squareCached(2);
        const cachedPromise2 = squareCached(2);

        expect(square).toHaveBeenCalledTimes(1);

        reject(new Error('fail!'));

        expect(square).toHaveBeenCalledTimes(1);

        await expectRejection(cachedPromise1, 'fail!');
        await expectRejection(cachedPromise2, 'fail!');

        expect(stats).toHaveBeenLastCalledWith({
            hitPromise: 1,
            hitValue: 0,
            miss: 1,
            put: 0
        });
    });

    it('performs revalidation while stale', async () => {
        const stats = jest.fn<void, [CacheStats]>();

        const deferreds = [deferred<number>(), deferred<number>()];
        let invocation = 0;

        let now = new Date().getTime();
        jest.spyOn(stub, 'getTime').mockImplementation(() => now);

        const square = jest.fn(_ => deferreds[invocation++].promise);
        const squareCached = cachifyPromise(square, {
            ttl: 10,
            staleWhileRevalidate: true,
            debug,
            displayName: 'fn6',
            statsFn: stats
        });

        // Invoke first time and resolve it
        const promise1 = squareCached(2);
        deferreds[0].resolve(4);
        expect(await promise1).toBe(4);

        // Move past the TTL
        now += 11;
        await tick();

        // Hitting expired item, triggering revalidation
        const promise2 = squareCached(2);
        // Expect stale data to be returned while revalidating
        expect(await promise2).toBe(4);
        expect(square).toHaveBeenCalledTimes(2);

        // Once revalidation completes, should resolve with the new value
        deferreds[1].resolve(5);
        await tick();
        expect(await squareCached(2)).toBe(5);

        expect(stats).toHaveBeenLastCalledWith({
            hitPromise: 0,
            hitValue: 1,
            miss: 1,
            put: 2
        });
    });

    it('can use a custom key generator', async () => {
        const stats = jest.fn<void, [CacheStats]>();
        const getName = jest.fn((user: User) => Promise.resolve(user.name));

        const cacheGetName = cachifyPromise(getName, {
            cacheKeyFn: u => `${u.id}`,
            debug,
            displayName: 'fn7',
            statsFn: stats
        });

        expect(
            await cacheGetName(({
                id: 1,
                name: 'John'
            } as unknown) as User)
        ).toBe('John');

        expect(getName).toHaveBeenCalledTimes(1);
        await tick();

        expect(
            await cacheGetName(({
                id: 1,
                name: 'John II'
            } as unknown) as User)
        ).toBe('John');

        expect(getName).toHaveBeenCalledTimes(1);

        expect(
            await cacheGetName(({
                id: 2,
                name: 'John III'
            } as unknown) as User)
        ).toBe('John III');

        expect(getName).toHaveBeenCalledTimes(2);

        expect(stats).toHaveBeenLastCalledWith({
            hitPromise: 0,
            hitValue: 1,
            miss: 2,
            put: 2
        });
    });

    it('can use a custom cache', async () => {
        const stats = jest.fn<void, [CacheStats]>();

        const now = new Date().getTime();
        jest.spyOn(stub, 'getTime').mockImplementation(() => now);

        const myCache: ItemStorage<string> = {
            delete: jest.fn(),
            get: jest.fn(),
            has: jest.fn(),
            set: jest.fn(),
            entries: jest.fn(),
            size: 0
        };
        const getName = jest.fn((user: User) => Promise.resolve(user.name));

        const cacheGetName = cachifyPromise(getName, {
            cacheMap: myCache,
            cacheKeyFn: user => `${user.id}`,
            debug,
            displayName: 'fn8',
            statsFn: stats
        });

        expect(
            await cacheGetName({
                id: 1,
                name: 'John'
            })
        ).toEqual('John');

        expect(myCache.has).toHaveBeenCalledWith('1');
        expect(myCache.set).toHaveBeenCalledWith('1', {
            time: now,
            data: 'John'
        });

        expect(stats).toHaveBeenLastCalledWith({
            hitPromise: 0,
            hitValue: 0,
            miss: 1,
            put: 1
        });
    });

    it('can delete items from cache (for no-arg function)', async () => {
        const load = () => Promise.resolve('loaded');
        const cacheMap = new Map<string, CacheEntry<string>>();

        const cachedLoad = cachifyPromise(load, {
            cacheMap
        });

        await expect(cachedLoad()).resolves.toBe('loaded');
        await expect(cachedLoad()).resolves.toBe('loaded');

        expect(cacheMap.size).toBe(1);

        expect(cachedLoad.delete()).toBe(true);
        expect(cachedLoad.delete()).toBe(false);

        expect(cacheMap.size).toBe(0);
    });

    it('can delete items from cache', async () => {
        const square = (x: number) => Promise.resolve(x * x);
        const cacheMap = new Map<string, CacheEntry<number>>();

        const cachedSquare = cachifyPromise(square, {
            cacheMap
        });

        await expect(cachedSquare(2)).resolves.toBe(4);
        await expect(cachedSquare(3)).resolves.toBe(9);
        await expect(cachedSquare(4)).resolves.toBe(16);

        expect(cacheMap.size).toBe(3);

        expect(cachedSquare.delete(3)).toBe(true);
        expect(cachedSquare.delete(3)).toBe(false);

        expect(cacheMap.size).toBe(2);
    });

    it('runs a cleanup job', async () => {
        jest.useFakeTimers();
        const stats = jest.fn<void, [CacheStats]>();

        let now = new Date().getTime();
        jest.spyOn(stub, 'getTime').mockImplementation(() => now);

        const square = (x: number) => Promise.resolve(x * x);
        const cache = new Map<string, CacheEntry<number>>();
        const cachedSquare = cachifyPromise(square, {
            ttl: 3600 * 1000,
            cleanupInterval: 5000,
            cacheMap: cache,
            statsFn: stats
        });

        await cachedSquare(2);
        expect(cache.size).toBe(1);

        now += 3600 * 1000 + 1;
        jest.runAllTimers();

        expect(cache.size).toBe(0);

        expect(stats).toHaveBeenLastCalledWith({
            hitPromise: 0,
            hitValue: 0,
            miss: 1,
            put: 1
        });
    });
});

interface User {
    id: number;
    name: string;
}

function mockSetInterval(): void {
    jest.spyOn(global, 'setInterval').mockImplementation((fn: TimerHandler) => {
        if (typeof fn === 'function') {
            fn();
        }
        return 1;
    });
    jest.spyOn(global, 'clearInterval').mockImplementation(() => {
        // no-op
    });
}
