import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

messageSchema.index({ tripId: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
