import { CacheOptions } from '../types/cache-options';

export function log<T>(opts: CacheOptions<T>, ...args: unknown[]): void {
    /* istanbul ignore if  */
    if (opts.debug) {
        console.log(`[cache] ${opts.displayName}`, ...args);
    }
}
