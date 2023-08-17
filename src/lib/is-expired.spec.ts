import { CacheEntry, CacheOptions, getTime } from '../cache-promise';
import { isExpired } from './is-expired';

const currentTime = new Date('2023-01-01T00:00:00.000Z').getTime();

jest.mock('../cache-promise', () => ({
    getTime: jest.fn(() => currentTime)
}));

describe('is-expired', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns true if a cache entry has expired', () => {
        // Arrange
        const opts = { ttl: 1000 } as CacheOptions<unknown>;
        const entry = { time: currentTime - 500 } as CacheEntry<unknown>;
        // Act
        const result = isExpired(opts, entry);
        // Assert
        expect(result).toBe(false);

        expect(getTime).toHaveBeenCalledTimes(1);
    });

    it('returns false if the cache entry has expired', () => {
        // Arrange
        const opts = { ttl: 1000 } as CacheOptions<unknown>;
        const entry = { time: currentTime - 1200 } as CacheEntry<unknown>;
        // Act
        const result = isExpired(opts, entry);
        // Assert
        expect(result).toBe(true);

        expect(getTime).toHaveBeenCalledTimes(1);
    });

    it('returns true if the cache entry time is in the future', () => {
        // Arrange
        const opts = { ttl: 1000 } as CacheOptions<unknown>;
        const entry = { time: currentTime + 500 } as CacheEntry<unknown>;
        // Act
        const result = isExpired(opts, entry);
        // Assert
        expect(result).toBe(false);

        expect(getTime).toHaveBeenCalledTimes(1);
    });
});
