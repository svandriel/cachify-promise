# cachify-promise

[![Build status](https://travis-ci.com/svandriel/cachify-promise.svg?branch=master)](https://travis-ci.com/svandriel/cachify-promise)

Smart caching for promises. Like memoization, but better.

```javascript
const { cachifyPromise } = require('cachify-promise');

const cachedFetch = cachifyPromise(fetch);

await Promise.all([
    cachedFetch('/api/users/1'),
    cachedFetch('/api/users/1'),
    cachedFetch('/api/users/1'),
    cachedFetch('/api/users/42')
]); // Results in only 2 calls

const user = await cachedFetch('/api/users/42'); // From cache
```

## Installation

```
npm install cachify-promise
```

## Features

-   Promise deduplication
-   Caches resolved values
-   Ignores failed promises (unlike most memoization functions)
-   Cache items is cleanable
-   Fully Typescript-ready
-   Supports stale-while-revalidate caching policy
-   Cleans expired items from the cache periodically
-   Customizable (time-to-live, custom cache storage, key generation)
-   No dependencies
-   Works in browsers (requires `Promise` and `Map` to be available or polyfilled)
-   Works in Node.js (10 or above)

## Usage

```javascript
const cachedFn = cachifyPromise(fn, options);
```

-   `fn`: A function returning a promise
-   `options`
    -   `ttl`: Time-to-live in _milliseconds_ (defaults to `Number.MAX_VALUE`). Set to `0` to disable caching of resolved values.
    -   `staleWhileRevalidate`: Enable 'stale-while-revalidate' policy (defaults to `false`)
    -   `cacheMap`: Cache instance, must implement `has`, `get`, `set`, `delete`. Defaults to `new Map()`.
    -   `cacheKeyFn`: Function for generating cache keys, must return strings.
    -   `cleanupInterval`: Time in _milliseconds_ that determines the interval at which a cleanup job is run. This job clears any expired cache items. Defaults to 10000 ms.
    -   `statsFn`: Callback function to receive stats. Will be called on each update with an object containing `hitPromise`, `hitValue`, `miss` and `put` values.
-   Returns a function with the same signature as `fn`.

### Full example

```javascript
const { cachifyPromise } = require('cachify-promise');

const cachedFetch = cachifyPromise(fetch, {
    ttl: 3600 * 1000, // one hour
    cacheKeyFn: (url, options) => `${options.method} ${url}`,
    cacheMap: new Map(),
    staleWhileRevalidate: true,
    statsFn: stats => console.log('Cache statistics:', stats)
});
```

## Deduplication

When performing expensive or time-consuming asynchronous tasks, it is often desirable to deduplicate calls while they are being done.

Imagine the `fetchUser` function will make a HTTP call to fetch information about a user.

Naively, the following code will result in 2 HTTP calls being made:

```javascript
// In UI component 1
const userPromise1 = fetchUser({ id: 1 });
// --> triggers HTTP call

// At the same time, in UI component 2
const userPromise2 = fetchUser({ id: 1 });
// --> triggers HTTP call
```

By wrapping the `fetchUser` function with `cachifyPromise`, only a single call will be made at the same time:

```javascript
const cachedFetchUser = cachifyPromise(fetchUser);

// In UI component 1
const userPromise1 = cachedFetchUser({ id: 1 });
// --> triggers HTTP call

// At the same time, in UI component 2
const userPromise2 = cachedFetchUser({ id: 1 });
// --> returns previous promise
```

## Response caching

By default, resolved values will be cached for for a long time (`Number.MAX_VALUE` milliseconds).

When a promise rejects, this will _not_ be stored.

You can customize the time-to-live using the `ttl` option (see Usage).
To disable caching of resolved values altogether, set `ttl` to `0`.

The cache key is determined by running `JSON.stringify` over the argument array passed to the function. You can provide your own key-generating function with the `cacheKeyFn` option (see Usage).

## Cleanup

When there are items in the cache, a periodic cleanup job is run to clean any expired items in the cache. The interval at which this job is run may be controlled with the `cleanupInterval` option.

**NOTE**: cleanup is not run when the `staleWhileRevalidate` policy is active

## Deleting items from the cache

You can delete entries from the cache by invoking the `.delete()` function. This function takes the same arguments as a regular invocation.

```javascript
const cachedFetchUser = cachifyPromise(fetchUser);

// Invoke and store in cache
await cachedFetchedUser({ id: 1 });

// Removes user 1 from the cache
cachedFetchedUser.delete({ id: 1 });
```

## Stale while revalidate

Sometimes, it is acceptable to return a stale ('old') value when a cache item is past its time-to-live. In the meantime, a fresh value is being fetched in the background.

```javascript
const cachedFetchUser = cachifyPromise(fetchUser, {
    staleWhileRevalidate: true,
    ttl: 10000
});

// In UI component
const userPromise1 = cachedFetchUser({ id: 1 });
// --> triggers HTTP call

// <HTTP call finishes>

await delay(10001);

const userPromise2 = cachedFetchUser({ id: 1 });
// --> resolves with cached user, AND triggers HTTP call in the background

// another 0.0001 seconds later
const userPromise3 = cachedFetchUser({ id: 1 });
// --> resolves with cached user, will NOT trigger HTTP call since one is already in progress

// <HTTP call finishes>

const userPromise4 = cachedFetchUser({ id: 1 });
// --> new user data!
```

## Statistics

When a `statsFn` function is provided (see Usage), that function will be invoked each time a cache interaction takes place. The object passed as a parameter to that function will contain:

-   `hitPromise`: Cache hits on pending promises
-   `hitValue`: Cache hits on stored values
-   `miss`: Cache misses
-   `put`: Cache puts

The number of cache accesses may be computed with:

```javascript
access = stat.hitPromise + stat.hitValue + stat.miss;
```

As such, the hit and miss ratios may be calculated with:

```javascript
hitRatio = (stat.hitPromise + stat.hitValue) / access;
missRatio = stat.miss / access;
```
