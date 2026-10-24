import mongoose from 'mongoose';

const MessageSubSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    audioUrl: {
      type: String,
      default: null,
    },
    emotionTag: {
      type: String,
      enum: ['calm', 'happy', 'sad', 'anxious', 'angry', 'neutral'],
      default: 'calm',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    characterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true,
    },
    sessionTitle: {
      type: String,
      default: 'Daily Check-in',
    },
    messages: [MessageSubSchema],
    summary: {
      type: String,
      default: '',
    },
    retentionExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day retention
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
