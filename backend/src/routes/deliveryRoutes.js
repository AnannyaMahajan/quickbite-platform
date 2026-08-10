import express from 'express';
import {
  getAssignedDeliveries,
  acceptDelivery,
  rejectDelivery,
  updateDeliveryStatus,
  getDeliveryHistory,
  getEarnings,
  togglePartnerAvailability
} from '../controllers/deliveryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticate, authorize('DELIVERY_PARTNER'));

router.get('/assignments', getAssignedDeliveries);
router.post('/assignments/:id/accept', acceptDelivery);
router.post('/assignments/:id/reject', rejectDelivery);
router.patch('/orders/:orderId/status', updateDeliveryStatus);
router.get('/history', getDeliveryHistory);
router.get('/earnings', getEarnings);
router.patch('/availability', togglePartnerAvailability);

export default router;
