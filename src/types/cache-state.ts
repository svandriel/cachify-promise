import { ItemStorage } from './item-storage';
import { CacheStats } from './stats';

export interface CacheState<T> {
    readonly cacheMap: ItemStorage<T>;
    readonly promiseCacheMap: Record<string, Promise<T> | undefined>;
    cleanupInterval?: number | NodeJS.Timeout;
    readonly stats: CacheStats;
}
