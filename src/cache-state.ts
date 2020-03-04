import { ItemStorage } from './types/item-storage';
import { CacheStats } from './types/stats';

export interface CacheState<T> {
    readonly cacheMap: ItemStorage<T>;
    readonly promiseCacheMap: Record<string, Promise<T>>;
    cleanupInterval?: any;
    readonly stats: CacheStats;
}
