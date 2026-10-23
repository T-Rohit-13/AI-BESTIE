import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Character } from '../../types/interactive';
import { MessageCircle, Edit3, Sparkles } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  onEdit: (character: Character) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onEdit }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/chat/${character.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(character);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative inaro-card inaro-card-hover p-6 flex flex-col justify-between cursor-pointer overflow-hidden"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Chat with ${character.name}, ${character.personalityPreset}`}
    >
      {/* Top subtle highlight */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-purple-100/50 rounded-full blur-2xl group-hover:bg-purple-200/50 transition pointer-events-none" />

      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Avatar Initial Badge */}
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
              character.avatarColor || 'from-indigo-600 to-purple-600'
            } flex items-center justify-center text-2xl font-bold text-white shadow-md shadow-purple-500/15 group-hover:scale-105 transition-transform duration-300`}
          >
            {character.avatarInitial || character.name.charAt(0).toUpperCase()}
          </div>

          {/* Edit shortcut button */}
          <button
            onClick={handleEditClick}
            className="p-2 rounded-xl text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition border border-transparent hover:border-purple-200"
            title="Edit companion profile"
            aria-label={`Edit ${character.name}`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Character Name & Preset Label */}
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors tracking-wide">
            {character.name}
          </h3>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Companion Ready" />
        </div>

        <div className="inline-block px-2.5 py-0.5 mt-1.5 rounded-full text-[11px] font-semibold bg-purple-50 border border-purple-200/70 text-purple-700">
          {character.personalityPreset}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
          {character.personalityDescription || 'A dedicated companion ready to chat.'}
        </p>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-purple-100/70 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-purple-700 transition-colors">
        <span className="flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" /> Start Conversation
        </span>
        <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-purple-600 transition-all font-bold">
          →
        </span>
      </div>
    </div>
  );
};
