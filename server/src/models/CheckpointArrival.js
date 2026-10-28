import mongoose from 'mongoose';

const checkpointArrivalSchema = new mongoose.Schema(
  {
    checkpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checkpoint', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    arrivedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

checkpointArrivalSchema.index({ checkpointId: 1, userId: 1 }, { unique: true });
checkpointArrivalSchema.index({ tripId: 1, arrivedAt: -1 });

export const CheckpointArrival = mongoose.model('CheckpointArrival', checkpointArrivalSchema);
