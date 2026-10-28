import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true, validate: (v) => v.length === 2 },
  },
  { _id: false }
);

const locationHistorySchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: pointSchema, required: true },
    recordedAt: { type: Date, required: true },
    accuracyMeters: { type: Number, min: 0 },
  },
  { timestamps: false }
);

locationHistorySchema.index({ tripId: 1, userId: 1, recordedAt: -1 });
locationHistorySchema.index({ tripId: 1, recordedAt: -1 });

export const LocationHistory = mongoose.model('LocationHistory', locationHistorySchema);
