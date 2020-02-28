import { CacheEntry, cachifyPromise } from './cache-promise';
import * as stub from './cache-promise';
import { deferred } from './test-util/deferred';
import { expectRejection } from './test-util/expect-rejection';
import { tick } from './test-util/tick';
import { ItemStorage } from './types/item-storage';

const debug = !!process.env.DEBUG;

describe('cache-promise', () => {
    it('returns existing resolved value', async () => {
        const square = jest.fn((x: number) => Promise.resolve(x * x));
        const squareCached = cachifyPromise(square, {
            key: item => `${item}`,
            debug,
            displayName: 'fn1'
        });

        expect(await squareCached(2)).toBe(4);
        expect(square).toHaveBeenCalledTimes(1);
        expect(square).toHaveBeenCalledWith(2);

        expect(await squareCached(2)).toBe(4);
        expect(square).toHaveBeenCalledTimes(1);

        expect(await squareCached(3)).toBe(9);
        expect(square).toHaveBeenCalledTimes(2);
        expect(square).toHaveBeenCalledWith(3);
    });

    it('does not cache resolved values with ttl = 0', async () => {
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
            cache: myCache,
            debug,
            displayName: 'fn2'
        });

        expect(await squareCached(2)).toBe(4);
        expect(myCache.set).not.toHaveBeenCalled();
    });

    it('expires values', async () => {
        let now = new Date().getTime();
        spyOn(stub, 'getTime').and.callFake(() => now);

        const square = jest.fn((x: number) => Promise.resolve(x * x));
        const squareCached = cachifyPromise(square, {
            ttl: 1000,
            debug,
            displayName: 'fn3'
        });

        expect(await squareCached(2)).toBe(4);
        expect(square).toHaveBeenCalledTimes(1);
        expect(square).toHaveBeenCalledWith(2);

        now += 1001;

        await tick();

        expect(await squareCached(2)).toBe(4);

        expect(square).toHaveBeenCalledTimes(2);
    });

    it('returns pending promise', async () => {
        const { promise, resolve } = deferred<number>();
        const square = jest.fn((_x: number) => promise);

        const squareCached = cachifyPromise(square, {
            debug,
            displayName: 'fn4'
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
    });

    it('returns pending promise that has been rejected', async () => {
        const { promise, reject } = deferred<number>();
        const square = jest.fn((_: number) => promise);

        const squareCached = cachifyPromise(square, {
            debug,
            displayName: 'fn5'
        });

        const cachedPromise1 = squareCached(2);
        const cachedPromise2 = squareCached(2);

        expect(square).toHaveBeenCalledTimes(1);

        reject(new Error('fail!'));

        expect(square).toHaveBeenCalledTimes(1);

        await expectRejection(cachedPromise1, 'fail!');
        await expectRejection(cachedPromise2, 'fail!');
    });

    it('performs revalidation while stale', async () => {
        const deferreds = [deferred<number>(), deferred<number>()];
        let invocation = 0;

        let now = new Date().getTime();
        spyOn(stub, 'getTime').and.callFake(() => now);

        const square = jest.fn(_ => deferreds[invocation++].promise);
        const squareCached = cachifyPromise(square, {
            ttl: 10,
            staleWhileRevalidate: true,
            debug,
            displayName: 'fn6'
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
    });

    it('can use a custom key generator', async () => {
        const getName = jest.fn((user: User) => Promise.resolve(user.name));

        const cacheGetName = cachifyPromise(getName, {
            key: u => `${u.id}`,
            debug,
            displayName: 'fn7'
        });

        expect(
            await cacheGetName(({
                id: 1,
                name: 'John'
            } as any) as User)
        ).toBe('John');

        expect(getName).toHaveBeenCalledTimes(1);

        expect(
            await cacheGetName(({
                id: 1,
                name: 'John II'
            } as any) as User)
        ).toBe('John');

        expect(getName).toHaveBeenCalledTimes(1);

        expect(
            await cacheGetName(({
                id: 2,
                name: 'John III'
            } as any) as User)
        ).toBe('John III');

        expect(getName).toHaveBeenCalledTimes(2);
    });

    it('can use a custom cache', async () => {
        const now = new Date().getTime();
        spyOn(stub, 'getTime').and.callFake(() => now);

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
            cache: myCache,
            key: user => `${user.id}`,
            debug,
            displayName: 'fn8'
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
    });

    it('runs a cleanup job', async () => {
        jest.useFakeTimers();
        let now = new Date().getTime();
        spyOn(stub, 'getTime').and.callFake(() => now);

        const square = (x: number) => Promise.resolve(x * x);
        const cache = new Map<string, CacheEntry<number>>();
        const cachedSquare = cachifyPromise(square, {
            ttl: 3600 * 1000,
            cleanupInterval: 5000,
            cache
        });

        await cachedSquare(2);
        expect(cache.size).toBe(1);

        now += 3600 * 1000 + 1;
        jest.runAllTimers();

        expect(cache.size).toBe(0);
    });
});

interface User {
    id: number;
    name: string;
}
