export type PromiseReturningFunction0<T> = () => Promise<T>;
export type PromiseReturningFunction1<A, T> = (a: A) => Promise<T>;
export type PromiseReturningFunction2<A, B, T> = (a: A, b: B) => Promise<T>;
export type PromiseReturningFunction3<A, B, C, T> = (a: A, b: B, c: C) => Promise<T>;

export type PromiseReturningFunction<T> = (...args: any[]) => Promise<T>;

export interface PromiseReturningFunctionWithDelete0<T> {
    (): Promise<T>;
    delete(): boolean;
}
export interface PromiseReturningFunctionWithDelete1<A, T> {
    (a: A): Promise<T>;
    delete(a: A): boolean;
}
export interface PromiseReturningFunctionWithDelete2<A, B, T> {
    (a: A, b: B): Promise<T>;
    delete(a: A, b: B): boolean;
}
export interface PromiseReturningFunctionWithDelete3<A, B, C, T> {
    (a: A, b: B, c: C): Promise<T>;
    delete(a: A, b: B, c: C): boolean;
}

export interface PromiseReturningFunctionWithDelete<T> {
    (...args: any[]): Promise<T>;
    delete(...args: any[]): boolean;
}
