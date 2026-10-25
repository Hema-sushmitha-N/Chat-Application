import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { validateRegister } from '../utils/validators.js';

export async function register(req, res, next) {
  try {
    const errors = validateRegister(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const username = req.body.username.trim();
    const email = req.body.email.trim().toLowerCase();

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username';
      return res.status(409).json({ message: `${field} is already registered` });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ username, email, passwordHash });

    return res.status(201).json({ token: signToken(user._id), user: user.toPublic() });
  } catch (err) {
    return next(err);
  }
}
