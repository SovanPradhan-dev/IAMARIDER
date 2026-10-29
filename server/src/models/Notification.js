import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    type: {
      type: String,
      enum: [
        'new_participant',
        'participant_left',
        'trip_started',
        'trip_completed',
        'trip_cancelled',
        'leadership_changed',
        'checkpoint_arrival',
        'emergency_alert',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
