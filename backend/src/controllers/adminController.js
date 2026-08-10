import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { Order } from '../models/Order.js';
import { Complaint } from '../models/Complaint.js';
import { Rating } from '../models/Rating.js';
import { emitSocketEvent } from '../services/socketService.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role && role !== 'ALL') {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

export const toggleUserSuspension = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot suspend an Administrator account.' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' has been ${user.isSuspended ? 'SUSPENDED' : 'UNSUSPENDED'}.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRestaurants = async (req, res, next) => {
  try {
    const { status, isApproved } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

    const restaurants = await Restaurant.find(filter)
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: restaurants.length, restaurants });
  } catch (error) {
    next(error);
  }
};

export const approveOrRejectRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isApproved, status } = req.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    restaurant.isApproved = isApproved !== undefined ? isApproved : restaurant.isApproved;
    if (status) restaurant.status = status;
    await restaurant.save();

    // Socket alert to Owner
    emitSocketEvent('restaurant:approved', {
      restaurantId: restaurant._id,
      isApproved: restaurant.isApproved
    }, [`user:${restaurant.ownerId}`]);

    res.status(200).json({
      success: true,
      message: `Restaurant '${restaurant.name}' approval updated. Approved: ${restaurant.isApproved}`,
      restaurant
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, isFlaggedForFraud } = req.query;
    const filter = {};

    if (status && status !== 'ALL') filter.status = status;
    if (isFlaggedForFraud !== undefined) filter.isFlaggedForFraud = isFlaggedForFraud === 'true';

    const orders = await Order.find(filter)
      .populate('customerId', 'name email phone')
      .populate('restaurantId', 'name address')
      .populate('assignedDeliveryPartnerId', 'name phone rating')
      .sort({ createdAt: -1 })
      .limit(200); // Pagination cap for performance

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};
