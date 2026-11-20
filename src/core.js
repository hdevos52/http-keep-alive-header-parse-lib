const CONNECTION_TOKEN_RE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/**
 * Parse a Connection header value into a lowercase set of tokens.
 *
 * The Connection header is a comma-separated list of hop-by-hop tokens.
 * Tokens are case-insensitive per RFC 7230; we normalize to lowercase so
 * callers can do simple membership checks. Empty entries are ignored because
 * some proxies emit trailing commas.
 *
 * @param {string | null | undefined} value
 * @returns {Set<string>}
 */
export function parseConnectionHeader(value) {
  const tokens = new Set();
  if (typeof value !== 'string') {
    return tokens;
  }
  for (const raw of value.split(',')) {
    const token = raw.trim().toLowerCase();
    if (token === '') {
      continue;
    }
    if (CONNECTION_TOKEN_RE.test(token)) {
      tokens.add(token);
    }
  }
  return tokens;
}

/**
 * Parse a Keep-Alive header value into { timeout, max }.
 *
 * The Keep-Alive header is a comma-separated list of `name=value` pairs.
 * Unknown parameters are ignored. `timeout` is expressed in seconds and
 * `max` is a request count; both are non-negative integers. Values that fail
 * to parse as an integer are treated as absent rather than as zero, because
 * a malformed value is not the same as an explicit zero.
 *
 * @param {string | null | undefined} value
 * @returns {{ timeout: number | null, max: number | null }}
 */
export function parseKeepAliveHeader(value) {
  const result = { timeout: null, max: null };
  if (typeof value !== 'string') {
    return result;
  }
  for (const raw of value.split(',')) {
    const part = raw.trim();
    if (part === '') {
      continue;
    }
    const eq = part.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const name = part.slice(0, eq).trim().toLowerCase();
    const rawValue = part.slice(eq + 1).trim();
    if (rawValue === '') {
      continue;
    }
    const parsed = parseNonNegativeInteger(rawValue);
    if (parsed === null) {
      continue;
    }
    if (name === 'timeout') {
      result.timeout = parsed;
    } else if (name === 'max') {
      result.max = parsed;
    }
  }
  return result;
}

/**
 * Parse both headers together into a normalized keep-alive description.
 *
 * The `keepAlive` flag is true when the Connection header contains the
 * `keep-alive` token. The timeout and max values are taken from the
 * Keep-Alive header regardless of the flag, because some servers send the
 * parameters without repeating the token.
 *
 * @param {string | null | undefined} connection
 * @param {string | null | undefined} keepAlive
 * @returns {{ keepAlive: boolean, timeout: number | null, max: number | null }}
 */
export function parseKeepAlive(connection, keepAlive) {
  const tokens = parseConnectionHeader(connection);
  const params = parseKeepAliveHeader(keepAlive);
  return {
    keepAlive: tokens.has('keep-alive'),
    timeout: params.timeout,
    max: params.max,
  };
}

function parseNonNegativeInteger(text) {
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value)) {
    return null;
  }
  return value;
}
