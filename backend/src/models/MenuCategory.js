import mongoose from 'mongoose';

const menuCategorySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

menuCategorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);
