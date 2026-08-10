import { Restaurant } from '../models/Restaurant.js';
import { MenuCategory } from '../models/MenuCategory.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { transitionOrderState } from '../services/orderStateMachine.js';
import { assignDeliveryPartner } from '../services/deliveryService.js';
import { emitSocketEvent } from '../services/socketService.js';

export const getRestaurantProfile = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found for this owner.' });
    }
    res.status(200).json({ success: true, restaurant });
  } catch (error) {
    next(error);
  }
};

export const registerOrUpdateRestaurant = async (req, res, next) => {
  try {
    const { name, description, cuisines, address, operatingHours, costForTwo } = req.body;
    let restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (restaurant) {
      restaurant.name = name || restaurant.name;
      restaurant.description = description || restaurant.description;
      if (cuisines) restaurant.cuisines = cuisines;
      if (address) restaurant.address = address;
      if (operatingHours) restaurant.operatingHours = operatingHours;
      if (costForTwo) restaurant.costForTwo = costForTwo;
      await restaurant.save();
    } else {
      restaurant = await Restaurant.create({
        ownerId: req.user._id,
        name,
        description,
        cuisines: cuisines || ['General'],
        address,
        operatingHours,
        costForTwo,
        isApproved: true
      });
    }

    res.status(200).json({ success: true, message: 'Restaurant profile updated successfully', restaurant });
  } catch (error) {
    next(error);
  }
};

export const toggleRestaurantStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['OPEN', 'CLOSED', 'TEMPORARILY_UNAVAILABLE'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
    }

    restaurant.status = status;
    await restaurant.save();

    // Real-Time Socket Broadcast to all connected clients
    emitSocketEvent('restaurant:status_changed', {
      restaurantId: restaurant._id,
      name: restaurant.name,
      status
    });

    res.status(200).json({ success: true, message: `Restaurant status updated to ${status}`, restaurant });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
    }

    const orders = await Order.find({ restaurantId: restaurant._id })
      .populate('customerId', 'name phone email')
      .populate('assignedDeliveryPartnerId', 'name phone rating')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const updatedOrder = await transitionOrderState(id, status, req.user, note);

    // If status updated to READY_FOR_PICKUP, trigger automated delivery assignment!
    if (status === 'READY_FOR_PICKUP') {
      assignDeliveryPartner(updatedOrder._id).catch(err => {
        console.error('Async Delivery Assignment Error:', err);
      });
    }

    res.status(200).json({ success: true, message: `Order status updated to ${status}`, order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

export const addMenuItem = async (req, res, next) => {
  try {
    const { categoryName, name, description, price, isVeg, isAvailable, quantity, image } = req.body;
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
    }

    let category = await MenuCategory.findOne({ restaurantId: restaurant._id, name: categoryName });
    if (!category) {
      category = await MenuCategory.create({ restaurantId: restaurant._id, name: categoryName || 'Chef Specials' });
    }

    const item = await MenuItem.create({
      restaurantId: restaurant._id,
      categoryId: category._id,
      name,
      description,
      price,
      isVeg: isVeg ?? true,
      isAvailable: isAvailable ?? true,
      quantity: quantity || 50,
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
    });

    res.status(201).json({ success: true, message: 'Menu item created', item });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.status(200).json({ success: true, message: 'Menu item updated', item });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await MenuItem.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
};

export const toggleMenuItemAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isAvailable, quantity } = req.body;

    const item = await MenuItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    item.isAvailable = isAvailable !== undefined ? isAvailable : !item.isAvailable;
    if (quantity !== undefined) item.quantity = quantity;
    await item.save();

    // Emit Real-Time Socket Broadcast to browsing customers
    emitSocketEvent('menu:availability_changed', {
      itemId: item._id,
      restaurantId: item.restaurantId,
      isAvailable: item.isAvailable,
      quantity: item.quantity
    }, [`restaurant:${item.restaurantId}`, 'role:customer']);

    res.status(200).json({ success: true, message: 'Menu item availability updated', item });
  } catch (error) {
    next(error);
  }
};
