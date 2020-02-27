import { CacheEntry } from './cache-entry';

export interface ItemStorage<T> {
    get(key: string): CacheEntry<T> | undefined;
    set(key: string, value: CacheEntry<T>): this;
    has(key: string): boolean;
    delete(key: string): boolean;
}
