import express from 'express';
import {
  createComplaint,
  getCustomerComplaints,
  getAllComplaintsAdmin,
  resolveComplaintAdmin
} from '../controllers/complaintController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('CUSTOMER'), createComplaint);
router.get('/customer', authorize('CUSTOMER'), getCustomerComplaints);
router.get('/admin', authorize('ADMIN'), getAllComplaintsAdmin);
router.patch('/:id/resolve', authorize('ADMIN'), resolveComplaintAdmin);

export default router;
