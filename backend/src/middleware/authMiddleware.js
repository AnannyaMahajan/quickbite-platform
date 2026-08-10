import { verifyToken } from '../config/jwt.js';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User associated with this token no longer exists.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by platform administration.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'JWT token has expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid or malformed authentication token.' });
  }
};
