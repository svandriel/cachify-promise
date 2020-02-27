import { cachePromise } from './cache-promise';
import * as stub from './cache-promise';
import { deferred } from './test-util/deferred';
import { delay } from './test-util/delay';

describe('cache-promise', () => {
    it('returns existing resolved value', async () => {
        const square = jest.fn((x: number) => Promise.resolve(x * x));
        const squareCached = cachePromise(square);

        expect(await squareCached(2)).toBe(4);
        expect(square).toHaveBeenCalledTimes(1);
        expect(square).toHaveBeenCalledWith(2);

        expect(await squareCached(3)).toBe(9);
        expect(await squareCached(2)).toBe(4);

        expect(square).toHaveBeenCalledTimes(2);
        expect(square).toHaveBeenCalledWith(3);
    });

    it.only('expires values', async () => {
        let now = new Date().getTime();
        spyOn(stub, 'getTime').and.callFake(() => now);
        const square = jest.fn((x: number) => Promise.resolve(x * x));
        const squareCached = cachePromise(square, {
            ttl: 1000
        });

        expect(await squareCached(2)).toBe(4);
        expect(square).toHaveBeenCalledTimes(1);
        expect(square).toHaveBeenCalledWith(2);

        now += 1001;

        await delay(1);

        expect(await squareCached(2)).toBe(4);

        expect(square).toHaveBeenCalledTimes(2);
    });

    it('returns pending promise', async () => {
        const { promise, resolve } = deferred<number>();
        const square = jest.fn((_x: number) => promise);

        const squareCached = cachePromise(square);

        const cachedPromise1 = squareCached(2);
        const cachedPromise2 = squareCached(2);

        expect(square).toHaveBeenCalledTimes(1);

        resolve(4);

        expect(square).toHaveBeenCalledTimes(1);

        expect(await cachedPromise1).toBe(4);
        expect(await cachedPromise2).toBe(4);
    });

    it('returns pending promise that has been rejected', async () => {
        const { promise, reject } = deferred<number>();
        const square = jest.fn((_: number) => promise);

        const squareCached = cachePromise(square);

        const cachedPromise1 = squareCached(2);
        const cachedPromise2 = squareCached(2);

        expect(square).toHaveBeenCalledTimes(1);

        reject('fail');

        expect(square).toHaveBeenCalledTimes(1);

        try {
            await cachedPromise1;
            fail('expected error (1)');
        } catch (err) {
            expect(err).toBe('fail');
        }
        try {
            await cachedPromise2;
            fail('expected error (2)');
        } catch (err) {
            expect(err).toBe('fail');
        }
    });
});
