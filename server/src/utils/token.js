import jwt from 'jsonwebtoken';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Returns the user id, or throws if the token is missing, invalid or expired
export function verifyToken(token) {
  const payload = jwt.verify(token, secret());
  return payload.sub;
}
