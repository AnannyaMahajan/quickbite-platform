import { Order } from '../models/Order.js';
import { Restaurant } from '../models/Restaurant.js';
import { User } from '../models/User.js';
import { Complaint } from '../models/Complaint.js';

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: { $in: ['DELIVERED', 'COMPLETED'] } });
    const cancelledOrders = await Order.countDocuments({ status: 'CANCELLED' });

    // GMV Calculation
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['DELIVERED', 'COMPLETED'] } } },
      { $group: { _id: null, totalGMV: { $sum: '$grandTotal' } } }
    ]);
    const totalGMV = revenueResult[0]?.totalGMV || 0;

    const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });
    const totalRestaurants = await Restaurant.countDocuments({ isApproved: true });
    const activeDeliveryPartners = await User.countDocuments({ role: 'DELIVERY_PARTNER', isAvailable: true });
    const openComplaints = await Complaint.countDocuments({ status: 'OPEN' });

    const cancellationRate = totalOrders > 0 ? +((cancelledOrders / totalOrders) * 100).toFixed(1) : 0;

    // Recent 7 Days Order Trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const orderTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$grandTotal' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        totalGMV,
        totalOrders,
        completedOrders,
        cancelledOrders,
        cancellationRate,
        totalCustomers,
        totalRestaurants,
        activeDeliveryPartners,
        openComplaints,
        orderTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantAnalytics = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const totalOrders = await Order.countDocuments({ restaurantId: restaurant._id });
    const completedOrders = await Order.countDocuments({ restaurantId: restaurant._id, status: { $in: ['DELIVERED', 'COMPLETED'] } });

    const revenueResult = await Order.aggregate([
      { $match: { restaurantId: restaurant._id, status: { $in: ['DELIVERED', 'COMPLETED'] } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]);

    const totalRevenue = revenueResult[0]?.revenue || 0;
    const avgOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;

    res.status(200).json({
      success: true,
      metrics: {
        totalOrders,
        completedOrders,
        totalRevenue,
        avgOrderValue,
        rating: restaurant.rating,
        totalRatings: restaurant.totalRatings
      }
    });
  } catch (error) {
    next(error);
  }
};
