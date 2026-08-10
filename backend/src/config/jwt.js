import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'quickbite_super_secret_jwt_key_2026_vesa_project_2';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
