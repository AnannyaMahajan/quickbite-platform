import express from 'express';
import { getAdminAnalytics, getRestaurantAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/admin', authorize('ADMIN'), getAdminAnalytics);
router.get('/restaurant', authorize('RESTAURANT_OWNER'), getRestaurantAnalytics);

export default router;
