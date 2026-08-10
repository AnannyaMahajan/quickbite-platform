import mongoose from 'mongoose';

const orderStatusHistorySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

orderStatusHistorySchema.index({ orderId: 1, timestamp: 1 });

export const OrderStatusHistory = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
