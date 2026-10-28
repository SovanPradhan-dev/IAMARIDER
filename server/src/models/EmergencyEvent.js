import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true, validate: (v) => v.length === 2 },
  },
  { _id: false }
);

const emergencyEventSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventType: {
      type: String,
      enum: ['sos', 'breakdown', 'medical', 'other'],
      required: true,
    },
    location: { type: pointSchema },
    status: {
      type: String,
      enum: ['active', 'resolved', 'cancelled'],
      default: 'active',
    },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: false }
);

emergencyEventSchema.index({ tripId: 1, createdAt: -1 });
emergencyEventSchema.index({ tripId: 1, status: 1 });

export const EmergencyEvent = mongoose.model('EmergencyEvent', emergencyEventSchema);
