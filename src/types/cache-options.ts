export interface CacheOptions {
    displayName: string;
    ttl: number;
    staleWhileRevalidate: boolean;
    key(...args: any[]): string;
}

export interface CacheOptions0 extends CacheOptions {
    key(): string;
}

export interface CacheOptions1<A> extends CacheOptions {
    key(a: A): string;
}

export interface CacheOptions2<A, B> extends CacheOptions {
    key(a: A, b: B): string;
}

export interface CacheOptions3<A, B, C> extends CacheOptions {
    key(a: A, b: B, c: C): string;
}

export interface CacheOptions4<A, B, C, D> extends CacheOptions {
    key(a: A, b: B, c: C, d: D): string;
}
