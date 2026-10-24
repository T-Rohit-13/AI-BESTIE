import mongoose from 'mongoose';

const DailyTrackerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date().setHours(0, 0, 0, 0),
    },
    moodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    sleepHours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    sleepQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      default: 'good',
    },
    notes: {
      type: String,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

DailyTrackerSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyTracker || mongoose.model('DailyTracker', DailyTrackerSchema);
