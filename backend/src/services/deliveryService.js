import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { emitSocketEvent } from './socketService.js';

export const assignDeliveryPartner = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) return null;

  // Find all delivery partners who have ALREADY rejected this order
  const existingAssignments = await DeliveryAssignment.find({ orderId });
  const excludedPartnerIds = existingAssignments.map(a => a.partnerId.toString());

  // Query eligible available delivery partners
  const candidatePartners = await User.find({
    role: 'DELIVERY_PARTNER',
    isAvailable: true,
    isApproved: true,
    isSuspended: false,
    _id: { $nin: excludedPartnerIds }
  }).sort({ currentActiveDeliveries: 1, rating: -1 });

  if (candidatePartners.length === 0) {
    console.log(`⚠️ No available delivery partner found for Order #${order.orderNumber}`);
    
    // Alert Admin
    emitSocketEvent('admin:alert', {
      type: 'NO_DELIVERY_PARTNER_AVAILABLE',
      severity: 'HIGH',
      message: `Order #${order.orderNumber} requires delivery assignment but no eligible partners are available.`,
      orderId: order._id
    }, ['role:admin']);

    return null;
  }

  const selectedPartner = candidatePartners[0];

  // Create Assignment Record
  const assignment = await DeliveryAssignment.create({
    orderId: order._id,
    partnerId: selectedPartner._id,
    status: 'ASSIGNED',
    reassignedCount: existingAssignments.length
  });

  // Update order assigned partner
  order.assignedDeliveryPartnerId = selectedPartner._id;
  order.status = 'DELIVERY_ASSIGNED';
  await order.save();

  // Increment active deliveries
  selectedPartner.currentActiveDeliveries += 1;
  await selectedPartner.save();

  // Notify Delivery Partner via Socket.IO
  emitSocketEvent('delivery:assigned', {
    assignmentId: assignment._id,
    orderId: order._id,
    orderNumber: order.orderNumber,
    pickupAddress: order.restaurantId,
    deliveryAddress: order.deliveryAddress,
    grandTotal: order.grandTotal,
    reassigned: existingAssignments.length > 0
  }, [`user:${selectedPartner._id}`]);

  console.log(`✅ Order #${order.orderNumber} assigned to Delivery Partner: ${selectedPartner.name} (Attempt #${existingAssignments.length + 1})`);
  return assignment;
};

export const handlePartnerRejection = async (assignmentId, partnerId, reason = 'Busy') => {
  const assignment = await DeliveryAssignment.findById(assignmentId);
  if (!assignment) {
    throw { statusCode: 404, message: 'Delivery assignment not found' };
  }

  // Update assignment status
  assignment.status = 'REJECTED';
  assignment.rejectionReason = reason;
  assignment.respondedAt = new Date();
  await assignment.save();

  // Decrement active count for partner
  await User.findByIdAndUpdate(partnerId, { $inc: { currentActiveDeliveries: -1 } });

  console.log(`🚨 Delivery Partner ${partnerId} REJECTED assignment for Order ${assignment.orderId}. Triggering automated reassignment...`);

  // Emit Rejection event to Admin
  emitSocketEvent('delivery:rejected', {
    orderId: assignment.orderId,
    partnerId,
    reason,
    timestamp: new Date()
  }, ['role:admin']);

  // AUTOMATED REASSIGNMENT WORKFLOW
  const newAssignment = await assignDeliveryPartner(assignment.orderId);
  return { rejectedAssignment: assignment, newAssignment };
};
