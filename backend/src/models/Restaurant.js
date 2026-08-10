import mongoose from 'mongoose';

const operatingHoursSchema = new mongoose.Schema({
  openTime: { type: String, default: '09:00' },
  closeTime: { type: String, default: '23:00' }
}, { _id: false });

const restaurantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  cuisines: [{ type: String, required: true }],
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  rating: { type: Number, default: 4.5 },
  totalRatings: { type: Number, default: 0 },
  image: { type: String, default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
  bannerImage: { type: String, default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80' },
  status: { 
    type: String, 
    enum: ['OPEN', 'CLOSED', 'TEMPORARILY_UNAVAILABLE'], 
    default: 'OPEN' 
  },
  isApproved: { type: Boolean, default: true },
  operatingHours: { type: operatingHoursSchema, default: () => ({}) },
  avgDeliveryTimeMinutes: { type: Number, default: 30 },
  costForTwo: { type: Number, default: 400 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

restaurantSchema.index({ name: 'text', cuisines: 'text' });

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
