import { Complaint } from '../models/Complaint.js';
import { Order } from '../models/Order.js';
import { emitSocketEvent } from '../services/socketService.js';

export const createComplaint = async (req, res, next) => {
  try {
    const { orderId, subject, description, category } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const ticketNumber = `TICKET-${Math.floor(1000 + Math.random() * 9000)}`;

    const complaint = await Complaint.create({
      ticketNumber,
      orderId,
      customerId: req.user._id,
      restaurantId: order.restaurantId,
      subject,
      description,
      category: category || 'QUALITY_ISSUE',
      status: 'OPEN'
    });

    // Alert Admin via Socket.IO
    emitSocketEvent('complaint:created', {
      ticketNumber,
      complaintId: complaint._id,
      customerName: req.user.name,
      subject
    }, ['role:admin']);

    res.status(201).json({ success: true, message: 'Complaint registered successfully', complaint });
  } catch (error) {
    next(error);
  }
};

export const getCustomerComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ customerId: req.user._id })
      .populate('orderId', 'orderNumber status grandTotal')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    next(error);
  }
};

export const getAllComplaintsAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'ALL') filter.status = status;

    const complaints = await Complaint.find(filter)
      .populate('customerId', 'name email phone')
      .populate('orderId', 'orderNumber grandTotal status')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    next(error);
  }
};

export const resolveComplaintAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes, refundAmount } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    complaint.status = status || 'RESOLVED';
    complaint.resolutionNotes = resolutionNotes || 'Ticket resolved by admin';
    if (refundAmount !== undefined) complaint.refundAmount = refundAmount;
    complaint.resolvedAt = new Date();
    await complaint.save();

    // Alert Customer
    emitSocketEvent('complaint:resolved', {
      ticketNumber: complaint.ticketNumber,
      status: complaint.status,
      resolutionNotes: complaint.resolutionNotes,
      refundAmount: complaint.refundAmount
    }, [`user:${complaint.customerId}`]);

    res.status(200).json({ success: true, message: 'Complaint ticket updated', complaint });
  } catch (error) {
    next(error);
  }
};
