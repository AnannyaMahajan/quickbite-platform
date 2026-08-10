import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  quantity: { type: Number, default: 50, min: 0 }, // Stock level for inventory control
  rating: { type: Number, default: 4.6 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
