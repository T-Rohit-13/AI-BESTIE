import mongoose from 'mongoose';

const DumpEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: ['text', 'voice'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    audioUrl: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    sentimentTag: {
      type: String,
      default: 'unspecified',
    },
    isEncrypted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DumpEntry || mongoose.model('DumpEntry', DumpEntrySchema);
