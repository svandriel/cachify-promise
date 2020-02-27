export type PromiseReturningFunction0<T> = () => Promise<T>;
export type PromiseReturningFunction1<A, T> = (a: A) => Promise<T>;
export type PromiseReturningFunction2<A, B, T> = (a: A, b: B) => Promise<T>;
export type PromiseReturningFunction3<A, B, C, T> = (a: A, b: B, c: C) => Promise<T>;

export type PromiseReturningFunction<T> = (...args: any[]) => Promise<T>;
