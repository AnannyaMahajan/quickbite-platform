import { Order } from '../models/Order.js';
import { OrderStatusHistory } from '../models/OrderStatusHistory.js';
import { emitSocketEvent } from './socketService.js';

// Order Lifecycle State Machine Definition
export const ORDER_STATES = {
  PLACED: 'PLACED',
  RESTAURANT_ACCEPTED: 'RESTAURANT_ACCEPTED',
  RESTAURANT_REJECTED: 'RESTAURANT_REJECTED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  DELIVERY_ASSIGNED: 'DELIVERY_ASSIGNED',
  AT_RESTAURANT: 'AT_RESTAURANT',
  PICKED_UP: 'PICKED_UP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// Allowed State Transitions Matrix
const ALLOWED_TRANSITIONS = {
  PLACED: [ORDER_STATES.RESTAURANT_ACCEPTED, ORDER_STATES.RESTAURANT_REJECTED, ORDER_STATES.CANCELLED],
  RESTAURANT_ACCEPTED: [ORDER_STATES.PREPARING, ORDER_STATES.RESTAURANT_REJECTED],
  PREPARING: [ORDER_STATES.READY_FOR_PICKUP],
  READY_FOR_PICKUP: [ORDER_STATES.DELIVERY_ASSIGNED],
  DELIVERY_ASSIGNED: [ORDER_STATES.AT_RESTAURANT, ORDER_STATES.PICKED_UP, ORDER_STATES.DELIVERY_ASSIGNED], // Driver accept -> AT_RESTAURANT or PICKED_UP
  AT_RESTAURANT: [ORDER_STATES.PICKED_UP],
  PICKED_UP: [ORDER_STATES.OUT_FOR_DELIVERY],
  OUT_FOR_DELIVERY: [ORDER_STATES.DELIVERED],
  DELIVERED: [ORDER_STATES.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  RESTAURANT_REJECTED: []
};

// Role-based State Modification Authorization
const ROLE_STATE_PERMISSIONS = {
  CUSTOMER: [ORDER_STATES.CANCELLED, ORDER_STATES.COMPLETED],
  RESTAURANT_OWNER: [
    ORDER_STATES.RESTAURANT_ACCEPTED, 
    ORDER_STATES.RESTAURANT_REJECTED, 
    ORDER_STATES.PREPARING, 
    ORDER_STATES.READY_FOR_PICKUP
  ],
  DELIVERY_PARTNER: [
    ORDER_STATES.AT_RESTAURANT,
    ORDER_STATES.PICKED_UP, 
    ORDER_STATES.OUT_FOR_DELIVERY, 
    ORDER_STATES.DELIVERED
  ],
  ADMIN: Object.values(ORDER_STATES) // Admin can override any state for operational control
};

export const transitionOrderState = async (orderId, targetState, user, note = '') => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw { statusCode: 404, message: `Order #${orderId} not found` };
  }

  const currentState = order.status;

  // 1. Validation: Allowed Transition Check
  const validNextStates = ALLOWED_TRANSITIONS[currentState] || [];
  if (!validNextStates.includes(targetState)) {
    throw {
      statusCode: 400,
      message: `Invalid state transition. Cannot move order from status '${currentState}' to '${targetState}'. Allowed transitions: [${validNextStates.join(', ')}]`
    };
  }

  // 2. Validation: Customer Cancellation Rule Enforcement (CRITICAL BACKEND CONSTRAINT)
  if (targetState === ORDER_STATES.CANCELLED && user.role === 'CUSTOMER') {
    if (currentState !== ORDER_STATES.PLACED) {
      throw {
        statusCode: 400,
        message: `Cancellation rejected. Customers may only cancel orders before food preparation has started. Current order status: '${currentState}'.`
      };
    }
  }

  // 3. Validation: Role Authorization Check
  const allowedRolesForState = ROLE_STATE_PERMISSIONS[user.role] || [];
  if (!allowedRolesForState.includes(targetState)) {
    throw {
      statusCode: 403,
      message: `Role '${user.role}' is not authorized to transition order state to '${targetState}'.`
    };
  }

  // Execute transition
  order.status = targetState;
  if (targetState === ORDER_STATES.CANCELLED && note) {
    order.cancellationReason = note;
  }
  await order.save();

  // Audit Log Entry
  await OrderStatusHistory.create({
    orderId: order._id,
    status: targetState,
    updatedBy: user._id,
    note
  });

  // Emit Real-Time Socket Event
  emitSocketEvent('order:status_update', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: targetState,
    timestamp: new Date(),
    note
  }, [
    `user:${order.customerId}`,
    `restaurant:${order.restaurantId}`,
    'role:admin'
  ]);

  return order;
};
