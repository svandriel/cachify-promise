import { ItemStorage } from './item-storage';

export interface CacheOptions<T> {
    displayName: string;
    ttl: number;
    staleWhileRevalidate: boolean;
    cache: ItemStorage<T>;
    key(...args: any[]): string;
}

export interface CacheOptions0<T> extends CacheOptions<T> {
    key(): string;
}

export interface CacheOptions1<A, T> extends CacheOptions<T> {
    key(a: A): string;
}

export interface CacheOptions2<A, B, T> extends CacheOptions<T> {
    key(a: A, b: B): string;
}

export interface CacheOptions3<A, B, C, T> extends CacheOptions<T> {
    key(a: A, b: B, c: C): string;
}
