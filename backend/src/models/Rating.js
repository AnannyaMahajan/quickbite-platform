import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  restaurantRating: { type: Number, required: true, min: 1, max: 5 },
  restaurantReview: { type: String, default: '' },
  deliveryRating: { type: Number, min: 1, max: 5 },
  deliveryReview: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Rating = mongoose.model('Rating', ratingSchema);
