import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true, validate: (v) => v.length === 2 },
  },
  { _id: false }
);

const liveLocationSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: pointSchema, required: true },
    accuracyMeters: { type: Number, min: 0 },
    speedMps: { type: Number, min: 0 },
    headingDegrees: { type: Number, min: 0, max: 360 },
    recordedAt: { type: Date },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

liveLocationSchema.index({ tripId: 1, userId: 1 }, { unique: true });
liveLocationSchema.index({ location: '2dsphere' });
liveLocationSchema.index({ updatedAt: 1 });

export const LiveLocation = mongoose.model('LiveLocation', liveLocationSchema);
