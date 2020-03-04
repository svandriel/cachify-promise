import { ItemStorage } from './item-storage';
import { CacheStats } from './stats';

export interface CacheOptions<T> {
    readonly displayName: string;
    readonly ttl: number;
    readonly staleWhileRevalidate: boolean;
    readonly cacheMap: ItemStorage<T>;
    readonly debug: boolean;
    readonly cleanupInterval: number;
    readonly cacheKeyFn: (...args: any[]) => string;
    readonly statsFn: (stats: CacheStats) => void;
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
