import { createRateLimiter } from '../utils/rateLimiter.js';

// Express middleware: answers 429 once a client (by IP address) goes over the limit
export function rateLimit({ limit, windowMs, message = 'Too many requests, please slow down' }) {
  const limiter = createRateLimiter({ limit, windowMs });
  // Clean up expired windows now and then; unref() so this timer never keeps the process alive
  setInterval(() => limiter.prune(), windowMs).unref();

  return (req, res, next) => {
    const result = limiter.hit(req.ip);
    res.set('X-RateLimit-Remaining', String(result.remaining));
    if (!result.allowed) {
      res.set('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
      return res.status(429).json({ message });
    }
    return next();
  };
}
