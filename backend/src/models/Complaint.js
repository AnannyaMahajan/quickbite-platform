import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['LATE_DELIVERY', 'WRONG_ITEM', 'QUALITY_ISSUE', 'DAMAGED_FOOD', 'PAYMENT_DISPUTE', 'OTHER'],
    default: 'QUALITY_ISSUE' 
  },
  status: {
    type: String,
    enum: ['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'REJECTED'],
    default: 'OPEN'
  },
  resolutionNotes: { type: String, default: '' },
  refundAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
}, { timestamps: true });

export const Complaint = mongoose.model('Complaint', complaintSchema);
