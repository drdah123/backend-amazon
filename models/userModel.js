import mongoose from 'mongoose';

const userShecma = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, uniqe: true, required: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false, required: true },
    isBigAdmin: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userShecma);

export default User;
