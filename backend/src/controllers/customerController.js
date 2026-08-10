import { Restaurant } from '../models/Restaurant.js';
import { MenuCategory } from '../models/MenuCategory.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { Rating } from '../models/Rating.js';
import { reserveInventoryAtomic, restoreInventory } from '../services/inventoryService.js';
import { transitionOrderState } from '../services/orderStateMachine.js';
import { assignDeliveryPartner } from '../services/deliveryService.js';
import { emitSocketEvent } from '../services/socketService.js';

export const getRestaurants = async (req, res, next) => {
  try {
    const { search, cuisine, status } = req.query;
    const filter = { isApproved: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cuisines: { $regex: search, $options: 'i' } }
      ];
    }

    if (cuisine && cuisine !== 'ALL') {
      filter.cuisines = { $in: [cuisine] };
    }

    if (status) {
      filter.status = status;
    }

    const restaurants = await Restaurant.find(filter).sort({ rating: -1 });
    res.status(200).json({ success: true, count: restaurants.length, restaurants });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.status(200).json({ success: true, restaurant });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantMenu = async (req, res, next) => {
  try {
    const categories = await MenuCategory.find({ restaurantId: req.params.id }).sort({ displayOrder: 1 });
    const items = await MenuItem.find({ restaurantId: req.params.id }).sort({ isAvailable: -1, name: 1 });

    res.status(200).json({
      success: true,
      categories,
      items
    });
  } catch (error) {
    next(error);
  }
};

export const placeOrder = async (req, res, next) => {
  try {
    const { restaurantId, items, deliveryAddress } = req.body;

    if (!restaurantId || !items || !items.length || !deliveryAddress) {
      return res.status(400).json({ success: false, message: 'Please specify restaurantId, cart items, and delivery address.' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    if (restaurant.status === 'TEMPORARILY_UNAVAILABLE' || restaurant.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: `Order placement blocked. '${restaurant.name}' is currently ${restaurant.status}.`
      });
    }

    // 1. ATOMIC CONCURRENCY STOCK CHECK & DECREMENT
    // Prevents race conditions when two customers order last stock simultaneously (Test Case 3)
    await reserveInventoryAtomic(items);

    // Calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const dbItem = await MenuItem.findById(item.menuItemId);
      const subtotal = dbItem.price * item.quantity;
      totalAmount += subtotal;
      orderItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: item.quantity,
        subtotal
      });
    }

    const deliveryFee = 40;
    const tax = Math.round(totalAmount * 0.05);
    const grandTotal = totalAmount + deliveryFee + tax;
    const orderNumber = `QB-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await Order.create({
      orderNumber,
      customerId: req.user._id,
      restaurantId,
      items: orderItems,
      totalAmount,
      deliveryFee,
      tax,
      grandTotal,
      deliveryAddress,
      status: 'PLACED',
      placedAt: new Date()
    });

    // Real-Time Socket Event to Restaurant Owner & Admin
    emitSocketEvent('order:created', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      restaurantId,
      customerName: req.user.name,
      grandTotal,
      itemCount: orderItems.length,
      placedAt: order.placedAt
    }, [`restaurant:${restaurantId}`, 'role:admin']);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Enforces customer cancellation rule (ONLY permitted before preparation begins)
    const updatedOrder = await transitionOrderState(id, 'CANCELLED', req.user, reason || 'Customer requested cancellation');

    // Restore inventory
    await restoreInventory(updatedOrder.items);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and stock restored.',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate('restaurantId', 'name image rating')
      .populate('assignedDeliveryPartnerId', 'name phone rating')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name address phone image rating')
      .populate('assignedDeliveryPartnerId', 'name phone rating');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const rateOrder = async (req, res, next) => {
  try {
    const { orderId, restaurantRating, restaurantReview, deliveryRating, deliveryReview } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (!['DELIVERED', 'COMPLETED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be rated.' });
    }

    const existingRating = await Rating.findOne({ orderId });
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'You have already rated this order.' });
    }

    const rating = await Rating.create({
      orderId,
      customerId: req.user._id,
      restaurantId: order.restaurantId,
      deliveryPartnerId: order.assignedDeliveryPartnerId,
      restaurantRating,
      restaurantReview,
      deliveryRating,
      deliveryReview
    });

    res.status(201).json({ success: true, message: 'Rating submitted successfully', rating });
  } catch (error) {
    next(error);
  }
};
