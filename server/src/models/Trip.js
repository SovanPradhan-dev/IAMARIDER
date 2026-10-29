import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true, validate: (v) => v.length === 2 },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    tripCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startLocation: { type: pointSchema },
    destination: { type: pointSchema },
    plannedDepartureAt: { type: Date },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    maxMembers: { type: Number, min: 2, default: 10 },
    memberCount: { type: Number, min: 1 },
    privacy: { type: String, enum: ['public', 'private'], default: 'private' },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

tripSchema.index({ status: 1, createdAt: -1 });
tripSchema.index({ leaderId: 1 });

tripSchema.methods.isLeader = function (userId) {
  return this.leaderId.toString() === userId.toString();
};

tripSchema.methods.isActive = function () {
  return this.status === 'active';
};

export const Trip = mongoose.model('Trip', tripSchema);
