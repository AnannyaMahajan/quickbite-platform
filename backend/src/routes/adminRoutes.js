import express from 'express';
import {
  getAllUsers,
  toggleUserSuspension,
  getAllRestaurants,
  approveOrRejectRestaurant,
  getAllOrders
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/users', getAllUsers);
router.patch('/users/:id/suspend', toggleUserSuspension);
router.get('/restaurants', getAllRestaurants);
router.patch('/restaurants/:id/approve', approveOrRejectRestaurant);
router.get('/orders', getAllOrders);

export default router;
