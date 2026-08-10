import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' }, // Home, Work, Other
  street: { type: String, required: true },
  city: { type: String, required: true },
  zipCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN'], 
    required: true 
  },
  phone: { type: String, default: '' },
  addresses: [addressSchema],
  isAvailable: { type: Boolean, default: true }, // For delivery partners / restaurant owners
  isApproved: { type: Boolean, default: true }, // Delivery partners & owners approval status
  isSuspended: { type: Boolean, default: false }, // Admin suspend functionality
  currentActiveDeliveries: { type: Number, default: 0 },
  totalDeliveriesCompleted: { type: Number, default: 0 },
  rating: { type: Number, default: 4.8 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
