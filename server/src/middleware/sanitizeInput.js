import { stripMongoOperators } from '../utils/sanitize.js';

// Runs on every request after the body is parsed: drops "$operator" and "dotted.path" keys
// from the JSON body and the query string.
export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = stripMongoOperators(req.body);
  if (req.query && typeof req.query === 'object') req.query = stripMongoOperators(req.query);
  next();
}
