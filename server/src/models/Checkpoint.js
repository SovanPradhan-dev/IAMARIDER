import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true, validate: (v) => v.length === 2 },
  },
  { _id: false }
);

const checkpointSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    location: { type: pointSchema, required: true },
    sequence: { type: Number, required: true },
    plannedArrivalAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

checkpointSchema.index({ tripId: 1, sequence: 1 });
checkpointSchema.index({ tripId: 1, createdAt: -1 });

export const Checkpoint = mongoose.model('Checkpoint', checkpointSchema);
