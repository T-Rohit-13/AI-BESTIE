import mongoose from 'mongoose';

const HelplineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Crisis Support',
    },
    operatingHours: {
      type: String,
      default: '24/7',
    },
    language: {
      type: [String],
      default: ['English', 'Tamil', 'Hindi'],
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Helpline || mongoose.model('Helpline', HelplineSchema);
