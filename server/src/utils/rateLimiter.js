// Fixed-window rate limiter kept in memory: at most `limit` hits per `windowMs` for each key
// (a key is an IP address or a user id). Dependency free, so it works for both HTTP and sockets.
export function createRateLimiter({ limit, windowMs, now = () => Date.now() }) {
  const windows = new Map(); // key -> { count, resetAt }

  // Counts one hit. Returns { allowed, remaining, retryAfterMs }.
  function hit(key) {
    const t = now();
    let w = windows.get(key);
    if (!w || t >= w.resetAt) {
      w = { count: 0, resetAt: t + windowMs };
      windows.set(key, w);
    }
    w.count += 1;
    const allowed = w.count <= limit;
    return {
      allowed,
      remaining: Math.max(limit - w.count, 0),
      retryAfterMs: allowed ? 0 : w.resetAt - t,
    };
  }

  // Forget windows that have ended, so the map does not grow forever
  function prune() {
    const t = now();
    for (const [key, w] of windows) {
      if (t >= w.resetAt) windows.delete(key);
    }
  }

  return { hit, prune, size: () => windows.size };
}
