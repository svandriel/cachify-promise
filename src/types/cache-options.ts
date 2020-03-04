import { ItemStorage } from './item-storage';
import { CacheStats } from './stats';

export interface CacheOptions<T> {
    displayName: string;
    ttl: number;
    staleWhileRevalidate: boolean;
    cacheMap: ItemStorage<T>;
    debug: boolean;
    cleanupInterval: number;
    cacheKeyFn(...args: any[]): string;
    statsFn(stats: CacheStats): void;
}

export interface CacheOptions0<T> extends CacheOptions<T> {
    cacheKeyFn(): string;
}

export interface CacheOptions1<A, T> extends CacheOptions<T> {
    cacheKeyFn(a: A): string;
}

export interface CacheOptions2<A, B, T> extends CacheOptions<T> {
    cacheKeyFn(a: A, b: B): string;
}

export interface CacheOptions3<A, B, C, T> extends CacheOptions<T> {
    cacheKeyFn(a: A, b: B, c: C): string;
}
