import mongoose, { Schema, Document } from 'mongoose';
import { User as IUser, UserProfile, Address } from '../types/identity';

const AddressSchema = new Schema<Address>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true }
});

const UserProfileSchema = new Schema<UserProfile>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date },
  address: { type: AddressSchema },
  phoneNumber: { type: String }
});

const UserSchema = new Schema<IUser & Document>({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profile: { type: UserProfileSchema, required: true },
  identityId: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser & Document>('User', UserSchema);