import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacters } from '../../context/CharactersContext';
import { useChat } from '../../context/ChatContext';
import { CharacterFormData } from '../../types/interactive';
import { AudioBubblePlayer } from '../voice/AudioBubblePlayer';
import { VoiceRecorder } from '../voice/VoiceRecorder';
import { ClearChatDialog } from './ClearChatDialog';
import { CharacterFormModal } from './CharacterFormModal';
import {
  ArrowLeft,
  MoreVertical,
  Edit3,
  Send,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

export const ChatScreen: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();

  const { getCharacterById, updateCharacter } = useCharacters();
  const {
    getMessages,
    isResponding,
    sendMessage,
    sendVoiceMessage,
    retryMessage,
    clearScreen,
    initCharacterChat,
  } = useChat();

  const [textInput, setTextInput] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const character = characterId ? getCharacterById(characterId) : undefined;
  const messages = characterId ? getMessages(characterId) : [];
  const responding = characterId ? isResponding(characterId) : false;

  useEffect(() => {
    if (characterId && character) {
      initCharacterChat(characterId, character.name, character.personalityPreset);
    }
  }, [characterId, character, initCharacterChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, responding]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!characterId || !textInput.trim() || responding) return;
    const content = textInput.trim();
    setTextInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(characterId, content);
  };

  const handleVoiceSend = async (audioBlob: Blob, durationSeconds: number) => {
    if (!characterId) return;
    await sendVoiceMessage(characterId, audioBlob, durationSeconds);
  };

  const handleConfirmClear = async () => {
    if (characterId) {
      await clearScreen(characterId);
    }
    setIsClearDialogOpen(false);
    setIsMenuOpen(false);
  };

  const handleUpdateCharacter = async (data: CharacterFormData) => {
    if (characterId) {
      await updateCharacter(characterId, data);
    }
  };

  if (!character && characterId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Companion Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The requested character could not be found or may have been removed.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition"
        >
          Return to Companions
        </button>
      </div>
    );
  }

  const initialLetter = character?.avatarInitial || character?.name.charAt(0).toUpperCase() || 'C';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto inaro-card my-2 sm:my-4 shadow-xl relative overflow-hidden bg-[#faf8ff] border border-purple-200/80">
      {/* =========================================
          1. HEADER
         ========================================= */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/95 border-b border-purple-100 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition"
            title="Back to companion list"
            aria-label="Back to companions"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar initial badge */}
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${
              character?.avatarColor || 'from-indigo-600 to-purple-600'
            } flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-purple-100 shrink-0`}
          >
            {initialLetter}
          </div>

          {/* Name & Personality */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {character?.name}
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Companion Active" />
            </div>
            <p className="text-[11px] text-purple-600 font-semibold leading-tight">
              {character?.personalityPreset}
            </p>
          </div>
        </div>

        {/* Action icons & Menu */}
        <div className="flex items-center gap-1.5 relative">
          {/* Edit shortcut button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition"
            title="Edit companion profile"
            aria-label={`Edit ${character?.name}`}
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition"
              title="More options"
              aria-label="Chat options menu"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                className="absolute right-0 top-11 w-44 bg-white border border-purple-200/80 rounded-2xl shadow-xl py-1 z-30 animate-fade-in text-xs font-semibold"
                role="menu"
              >
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsClearDialogOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-amber-700 hover:bg-amber-50 transition flex items-center gap-2 cursor-pointer"
                  role="menuitem"
                >
                  Clear chat
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================
          2. MESSAGE AREA (WhatsApp-style)
         ========================================= */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(243, 238, 255, 0.8) 0%, transparent 80%)',
        }}
        aria-live="polite"
      >
        {/* Safe notice banner */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 border border-purple-200/60 text-[11px] font-medium text-slate-600 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Messages are private and never used to diagnose medical conditions.</span>
          </div>
        </div>

        {/* Empty state when cleared */}
        {messages.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            <p className="font-semibold text-slate-600 text-sm">Your screen is clear.</p>
            <p className="mt-1">Send a message or voice note to restart chatting with {character?.name}.</p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isError = msg.status === 'error';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`relative max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-tr-none shadow-indigo-500/10'
                    : 'bg-white text-slate-800 rounded-tl-none border border-purple-100/90 shadow-sm'
                }`}
              >
                {/* Voice Note or Text Content */}
                {msg.audioUrl ? (
                  <AudioBubblePlayer
                    audioUrl={msg.audioUrl}
                    duration={msg.audioDuration}
                    isUserMessage={isUser}
                    transcript={msg.transcript}
                  />
                ) : (
                  <p className="leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}

                {/* Bubble Footer: Timestamp & Delivery Status */}
                <div
                  className={`flex items-center justify-end gap-1.5 text-[10px] mt-1.5 ${
                    isUser ? 'text-purple-200' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isUser && (
                    <span>
                      {msg.status === 'sending' && '⏳'}
                      {msg.status === 'sent' && '✓✓'}
                      {msg.status === 'error' && '⚠️'}
                    </span>
                  )}
                </div>
              </div>

              {/* Retry action for failed messages */}
              {isError && (
                <div className="flex items-center gap-2 mt-1 text-xs text-rose-500">
                  <span>Message failed to send.</span>
                  <button
                    onClick={() => characterId && retryMessage(characterId, msg.id)}
                    className="inline-flex items-center gap-1 font-semibold underline hover:text-rose-700 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Retry
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {responding && (
          <div className="flex items-start gap-2 animate-fade-in" aria-label={`${character?.name} is typing`}>
            <div
              className={`w-7 h-7 rounded-full bg-gradient-to-br ${
                character?.avatarColor || 'from-indigo-600 to-purple-600'
              } flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs`}
            >
              {initialLetter}
            </div>
            <div className="px-4 py-2.5 rounded-2xl rounded-tl-none bg-white border border-purple-100 text-slate-500 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-500 ml-1.5 font-medium">{character?.name} is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* =========================================
          3. FOOTER (Text input + Send + Voice)
         ========================================= */}
      <footer className="p-3 sm:p-4 bg-white/95 border-t border-purple-100 z-20">
        <div className="flex items-end gap-2.5 max-w-3xl mx-auto">
          {/* Voice Recorder control */}
          <VoiceRecorder onSendVoice={handleVoiceSend} isSending={responding} />

          {/* Text Input area */}
          <div className="flex-1 bg-purple-50/50 border border-purple-200/70 rounded-2xl px-4 py-2 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 focus-within:bg-white transition flex items-center">
            <textarea
              ref={textareaRef}
              rows={1}
              value={textInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${character?.name}... (Enter to send, Shift+Enter for new line)`}
              disabled={responding}
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs sm:text-sm resize-none focus:outline-none max-h-32"
              aria-label={`Type message for ${character?.name}`}
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!textInput.trim() || responding}
            className="p-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
            title="Send message"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </footer>

      {/* Clear Chat Confirmation Dialog */}
      <ClearChatDialog
        isOpen={isClearDialogOpen}
        characterName={character?.name || 'this character'}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearDialogOpen(false)}
      />

      {/* Edit Character Modal */}
      {character && (
        <CharacterFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateCharacter}
          initialCharacter={character}
        />
      )}
    </div>
  );
};
