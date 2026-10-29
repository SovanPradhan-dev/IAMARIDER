import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 30 },
    relationship: { type: String, trim: true, maxlength: 50 },
  },
  { _id: false }
);

const notificationPreferencesSchema = new mongoose.Schema(
  {
    tripUpdates: { type: Boolean, default: true },
    checkpointArrivals: { type: Boolean, default: true },
    safetyAlerts: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, trim: true },
    emergencyContact: { type: emergencyContactSchema, default: undefined },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);
