import express from 'express';
import {
  getRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  placeOrder,
  cancelOrder,
  getCustomerOrders,
  getOrderById,
  rateOrder
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Public restaurant browsing
router.get('/restaurants', getRestaurants);
router.get('/restaurants/:id', getRestaurantById);
router.get('/restaurants/:id/menu', getRestaurantMenu);

// Customer protected routes
router.use(authenticate, authorize('CUSTOMER'));
router.post('/orders', placeOrder);
router.get('/orders', getCustomerOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/cancel', cancelOrder);
router.post('/ratings', rateOrder);

export default router;
