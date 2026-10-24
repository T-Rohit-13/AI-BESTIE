import mongoose from 'mongoose';

const CharacterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatarId: {
      type: String,
      required: true,
      default: 'inaro_default_avatar',
    },
    personaPrompt: {
      type: String,
      required: true,
    },
    voiceId: {
      type: String,
      default: 'en-US-JennyNeural',
    },
    language: {
      type: String,
      enum: ['en', 'ta', 'bilingual'],
      default: 'bilingual',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Character || mongoose.model('Character', CharacterSchema);
