import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { handlePartnerRejection } from '../services/deliveryService.js';
import { transitionOrderState } from '../services/orderStateMachine.js';

export const getAssignedDeliveries = async (req, res, next) => {
  try {
    const assignments = await DeliveryAssignment.find({
      partnerId: req.user._id,
      status: { $in: ['ASSIGNED', 'ACCEPTED'] }
    })
      .populate({
        path: 'orderId',
        populate: [
          { path: 'restaurantId', select: 'name address phone image' },
          { path: 'customerId', select: 'name phone email' }
        ]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: assignments.length, assignments });
  } catch (error) {
    next(error);
  }
};

export const acceptDelivery = async (req, res, next) => {
  try {
    const { id } = req.params; // assignmentId
    const assignment = await DeliveryAssignment.findOne({ _id: id, partnerId: req.user._id });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Delivery assignment not found' });
    }

    assignment.status = 'ACCEPTED';
    assignment.respondedAt = new Date();
    await assignment.save();

    res.status(200).json({ success: true, message: 'Delivery request accepted!', assignment });
  } catch (error) {
    next(error);
  }
};

export const rejectDelivery = async (req, res, next) => {
  try {
    const { id } = req.params; // assignmentId
    const { reason } = req.body;

    const result = await handlePartnerRejection(id, req.user._id, reason || 'Rider unavailable');

    res.status(200).json({
      success: true,
      message: 'Delivery request rejected. System has reassigned order to next available rider.',
      result
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    // Validate delivery partner assignment
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.assignedDeliveryPartnerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not the assigned delivery partner for this order.' });
    }

    const updatedOrder = await transitionOrderState(orderId, status, req.user, note);

    if (status === 'DELIVERED') {
      // Complete assignment and update rider stats
      await DeliveryAssignment.updateOne(
        { orderId, partnerId: req.user._id },
        { status: 'COMPLETED' }
      );
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { currentActiveDeliveries: -1, totalDeliveriesCompleted: 1 }
      });
    }

    res.status(200).json({ success: true, message: `Delivery status updated to ${status}`, order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryHistory = async (req, res, next) => {
  try {
    const assignments = await DeliveryAssignment.find({
      partnerId: req.user._id,
      status: 'COMPLETED'
    })
      .populate({
        path: 'orderId',
        populate: { path: 'restaurantId', select: 'name address' }
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: assignments.length, assignments });
  } catch (error) {
    next(error);
  }
};

export const getEarnings = async (req, res, next) => {
  try {
    const completedAssignments = await DeliveryAssignment.find({
      partnerId: req.user._id,
      status: 'COMPLETED'
    }).populate('orderId', 'deliveryFee grandTotal placedAt');

    const totalCompleted = completedAssignments.length;
    const perDeliveryRate = 45; // Base payout per trip
    const totalEarnings = totalCompleted * perDeliveryRate;

    res.status(200).json({
      success: true,
      totalCompleted,
      perDeliveryRate,
      totalEarnings,
      completedAssignments
    });
  } catch (error) {
    next(error);
  }
};

export const togglePartnerAvailability = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    const { isAvailable } = req.body;
    if (isAvailable !== undefined) {
      user.isAvailable = Boolean(isAvailable);
    } else {
      user.isAvailable = !user.isAvailable;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Partner availability updated to ${user.isAvailable ? 'AVAILABLE' : 'OFFLINE'}`,
      isAvailable: user.isAvailable
    });
  } catch (error) {
    next(error);
  }
};
