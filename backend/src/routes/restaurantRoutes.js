import express from 'express';
import {
  getRestaurantProfile,
  registerOrUpdateRestaurant,
  toggleRestaurantStatus,
  getRestaurantOrders,
  updateOrderStatus,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability
} from '../controllers/restaurantController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticate, authorize('RESTAURANT_OWNER'));

router.get('/profile', getRestaurantProfile);
router.post('/profile', registerOrUpdateRestaurant);
router.patch('/status', toggleRestaurantStatus);
router.get('/orders', getRestaurantOrders);
router.patch('/orders/:id/status', updateOrderStatus);

// Menu management
router.post('/menu/items', addMenuItem);
router.patch('/menu/items/:id', updateMenuItem);
router.delete('/menu/items/:id', deleteMenuItem);
router.patch('/menu/items/:id/availability', toggleMenuItemAvailability);

export default router;
