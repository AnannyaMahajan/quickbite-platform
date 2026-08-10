import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { generateToken } from '../config/jwt.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const validRoles = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role,
      phone: phone || '',
      addresses: address ? [{ ...address, isDefault: true }] : []
    });

    // Generate JWT token
    const token = generateToken({ id: user._id, role: user.role, name: user.name });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account has been suspended by administrator.' });
    }

    let restaurantId = null;
    if (user.role === 'RESTAURANT_OWNER') {
      const restaurant = await Restaurant.findOne({ ownerId: user._id });
      if (restaurant) {
        restaurantId = restaurant._id;
      }
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
      name: user.name,
      restaurantId
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses,
        restaurantId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    let restaurantId = null;
    if (req.user.role === 'RESTAURANT_OWNER') {
      const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
      if (restaurant) {
        restaurantId = restaurant._id;
      }
    }

    res.status(200).json({
      success: true,
      user: {
        ...req.user.toObject(),
        restaurantId
      }
    });
  } catch (error) {
    next(error);
  }
};
