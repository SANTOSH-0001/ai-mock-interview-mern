import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Check the Authorization Header first (matches your frontend apiRequest)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // 2. Fall back to checking cookies if headers are missing
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Use payload.id or payload.userId depending on how you signed the token during login
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const targetId = payload.userId || payload.id;

    const user = await User.findById(targetId).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
}