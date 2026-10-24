import { verifyToken } from '../utils/token.js';

// Protects REST routes. Expects "Authorization: Bearer <jwt>".
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    req.userId = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
