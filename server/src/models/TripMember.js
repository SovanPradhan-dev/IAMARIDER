import mongoose from 'mongoose';

const tripMemberSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['leader', 'rider'], default: 'rider' },
    status: {
      type: String,
      enum: ['joined', 'left', 'removed'],
      default: 'joined',
    },
    joinedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date },
  },
  { timestamps: true }
);

tripMemberSchema.index({ tripId: 1, userId: 1 }, { unique: true });
tripMemberSchema.index({ tripId: 1, status: 1 });
tripMemberSchema.index({ userId: 1, status: 1 });

export const TripMember = mongoose.model('TripMember', tripMemberSchema);
