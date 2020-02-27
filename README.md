# cachify-promise

Deduplicates and caches promise-returning functions

```javascript
const { cachifyPromise } = require('cachify-promise');

const cachedFetch = cachifyPromise(fetch);

await Promise.all([cachedFetch('/api/users/1'), cachedFetch('/api/users/1'), cachedFetch('/api/users/1'), cachedFetch('/api/users/42')]); // Results in only 2 calls

const user = await cachedFetch('/api/users/42'); // From cache
```

## Installation

```
npm install cachify-promise
```

## Features

-   Promise deduplication
-   Cache resolved values
-   Fully Typescript-ready
-   Supports stale-while-revalidate caching policy
-   Customizable (time-to-live, custom cache storage, key generation)

## Usage

```javascript
const cachedFn = cachifyPromise(fn, options);
```

-   `fn`: A function returning a promise
-   `options`
    -   `ttl`: Time-to-live in _milliseconds_ (defaults to `Number.MAX_VALUE`). Set to `0` to disable caching of resolved values.
    -   `staleWhileRevalidate`: Enable 'stale-while-revalidate' policy (defaults to `false`)
    -   `cache`: Cache instance, must implement `has`, `get`, `set`, `delete`. Defaults to `new Map()`.
    -   `key`: Function for generating cache keys, must return strings.
-   Returns a function with the same signature as `fn`

### Full example

```javascript
const { cachifyPromise } = require('cachify-promise');

const cachedFetch = cachifyPromise(fetch, {
    ttl: 3600 * 1000, // one hour
    key: (url, options) => `${options?.method} ${url}`,
    cache: new Map(),
    staleWhileRevalidate: true
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

You can customize the time-to-live using the `ttl` option (see Usage).
To disable caching of resolved values altogether, set `ttl` to `0`.

The cache key is determined by running `JSON.stringify` over the argument array passed to the function. You can provide your own key-generating function with the `key` option (see Usage).

## Stale while revalidate

Sometimes, it is acceptable to return a stale ('old') value when a cache item is past it's time-to-live. In the meantime, a fresh value is being fetched in the background.

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
