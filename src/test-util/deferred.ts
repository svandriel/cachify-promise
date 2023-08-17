/* istanbul ignore file */
export function deferred<U>(): Deferred<U> {
    let doResolve: (val: U | PromiseLike<U>) => void;
    let doReject: (reason: unknown) => void;
    const promise = new Promise<U>((resolve, reject) => {
        doResolve = resolve;
        doReject = reject;
    });
    promise.catch(() => {
        /* no-op */
    });
    return {
        promise,
        resolve(val: U | PromiseLike<U>): void {
            doResolve(val);
        },
        reject(reason: unknown): void {
            doReject(reason);
        }
    };
}

interface Deferred<U> {
    promise: Promise<U>;
    resolve(val: U | PromiseLike<U> | undefined): void;
    reject(reason: unknown): void;
}
