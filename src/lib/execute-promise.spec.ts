import { CacheOptions } from '../cache-promise';
import { CacheState } from '../types/cache-state';
import { startCleanupJob } from './cleanup';
import { executePromise } from './execute-promise';
import { incrementStatsValue } from './increment-stats-value';

const currentTime = new Date('2023-01-01T00:00:00.000Z').getTime();

interface User {
    name: string;
    age: number;
}

jest.mock('../cache-promise', () => ({
    getTime: jest.fn(() => currentTime)
}));

jest.mock('./cleanup', () => ({
    startCleanupJob: jest.fn()
}));

jest.mock('./increment-stats-value', () => ({
    incrementStatsValue: jest.fn()
}));

describe('execute-promise', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('removes the promise from the cache when it resolves', async () => {
        const state: CacheState<User> = {
            cacheMap: new Map(),
            promiseCacheMap: {},
            stats: {
                hitValue: 0,
                hitPromise: 0,
                miss: 0,
                put: 0
            }
        };
        const opts: CacheOptions<User> = {
            displayName: 'my cache',
            cacheMap: state.cacheMap,
            ttl: 1000,
            cacheKeyFn: (...args) => JSON.stringify(args),
            cleanupInterval: 1000,
            debug: false,
            staleWhileRevalidate: false,
            statsFn: () => void 0
        };

        const user: User = { name: 'John', age: 42 };

        const fn = jest.fn(() => Promise.resolve(user));

        const resultPromise = executePromise(state, opts, fn, 'key', []);

        expect(fn).toHaveBeenCalledTimes(1);
        expect(state.promiseCacheMap).toEqual({
            key: resultPromise
        });

        const result = await resultPromise;

        expect(result).toBe(user);

        expect(state.cacheMap.size).toBe(1);
        expect(state.cacheMap.get('key')).toEqual({
            time: expect.any(Number),
            data: user
        });

        expect(startCleanupJob).toHaveBeenCalledTimes(1);
        expect(startCleanupJob).toHaveBeenCalledWith(state, opts);
        expect(incrementStatsValue).toHaveBeenCalledTimes(1);
    });
});
