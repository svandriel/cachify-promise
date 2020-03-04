import { CacheOptions } from '../types/cache-options';
import { CacheState } from '../types/cache-state';
import { CacheStats } from '../types/stats';

export function incrementStatsValue<T, K extends keyof CacheStats>(
    state: CacheState<T>,
    opts: CacheOptions<T>,
    key: K
): void {
    state.stats[key] = state.stats[key] + 1;
    opts.statsFn(Object.assign({}, state.stats));
}
