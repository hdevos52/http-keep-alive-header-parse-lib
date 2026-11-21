# http-keep-alive-header-parse-lib

Parses and normalizes the `Connection` and `Keep-Alive` headers into a boolean keep-alive flag plus `timeout` and `max` request counts.

```js
import { parseKeepAlive } from 'http-keep-alive-header-parse-lib';

const result = parseKeepAlive('keep-alive, Upgrade', 'timeout=5, max=1000');
// { keepAlive: true, timeout: 5, max: 1000 }
```

The library also exports the two lower-level helpers:

```js
import { parseConnectionHeader, parseKeepAliveHeader } from 'http-keep-alive-header-parse-lib';

parseConnectionHeader('Keep-Alive, Upgrade'); // Set { 'keep-alive', 'upgrade' }
parseKeepAliveHeader('timeout=5, max=1000');   // { timeout: 5, max: 1000 }
```

## Why this exists

HTTP/1.1 keep-alive parameters are a comma-separated list of `name=value` pairs, and the `Connection` header is a comma-separated list of tokens. Both are case-insensitive and both tolerate whitespace and empty entries. Applications that want to honour `timeout` and `max` end up re-implementing the same lenient parser, usually with subtle differences around malformed input. This library makes one decision explicit: a malformed or missing value is `null`, never `0`. That distinction matters because `max=0` is a real (if unusual) instruction to close after this request, while `max=abc` is simply not a usable value.

## The awkward edge

The `Connection` header can contain the token `keep-alive` even when no `Keep-Alive` parameters are present, and conversely a server can send `Keep-Alive` parameters without listing the token in `Connection`. This library reports the flag from `Connection` and the parameters from `Keep-Alive` independently, so you can decide what to do with that mismatch. It does not infer keep-alive from the presence of parameters alone.
