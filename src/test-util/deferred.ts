/* istanbul ignore file */
export function deferred<U>(): Deferred<U> {
    let doResolve: (val: U | PromiseLike<U> | undefined) => void;
    let doReject: (reason: any) => void;
    const promise = new Promise<U>((resolve, reject) => {
        doResolve = resolve;
        doReject = reject;
    });
    promise.catch(() => {
        /* no-op */
    });
    return {
        promise,
        resolve(val: U | PromiseLike<U> | undefined): void {
            doResolve(val);
        },
        reject(reason: any): void {
            doReject(reason);
        }
    };
}

interface Deferred<U> {
    promise: Promise<U>;
    resolve(val: U | PromiseLike<U> | undefined): void;
    reject(reason: any): void;
}
