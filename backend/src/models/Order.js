import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  deliveryFee: { type: Number, default: 40 },
  tax: { type: Number, default: 20 },
  grandTotal: { type: Number, required: true },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  status: {
    type: String,
    enum: [
      'PLACED',
      'RESTAURANT_ACCEPTED',
      'RESTAURANT_REJECTED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'DELIVERY_ASSIGNED',
      'AT_RESTAURANT',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED'
    ],
    default: 'PLACED'
  },
  cancellationReason: { type: String, default: '' },
  assignedDeliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  placedAt: { type: Date, default: Date.now },
  estimatedDeliveryTime: { type: Date },
  isFlaggedForFraud: { type: Boolean, default: false }, // Fraud risk indicator
  fraudReason: { type: String, default: '' }
}, { timestamps: true });

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ assignedDeliveryPartnerId: 1, status: 1 });

export const Order = mongoose.model('Order', orderSchema);
