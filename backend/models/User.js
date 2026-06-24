import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Instance method to verify passwords during login
userSchema.methods.comparePassword = async function comparePassword(password) {
  try {
    return await bcrypt.compare(password, this.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Static method used to hash passwords during registration
userSchema.statics.hashPassword = async function hashPassword(password) {
  try {
    // 12 rounds of salting strikes the ideal balance between security and performance
    return await bcrypt.hash(password, 12);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

export const User = mongoose.model('User', userSchema);