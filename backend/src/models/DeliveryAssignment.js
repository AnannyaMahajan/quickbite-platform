import mongoose from 'mongoose';

const deliveryAssignmentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['ASSIGNED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
    default: 'ASSIGNED'
  },
  rejectionReason: { type: String, default: '' },
  reassignedCount: { type: Number, default: 0 },
  assignedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
}, { timestamps: true });

deliveryAssignmentSchema.index({ orderId: 1, partnerId: 1 });

export const DeliveryAssignment = mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);
