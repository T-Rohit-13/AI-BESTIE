import React, { useState } from 'react';
import { useCharacters } from '../../context/CharactersContext';
import { useDailyEntry } from '../../context/DailyEntryContext';
import { Character, CharacterFormData } from '../../types/interactive';
import { CharacterCard } from './CharacterCard';
import { CharacterFormModal } from './CharacterFormModal';
import { Link } from 'react-router-dom';
import { Plus, Search, Sparkles, Lock, ShieldCheck, ArrowRight, Smile, PhoneCall } from 'lucide-react';

export const CharactersList: React.FC = () => {
  const { characters, isLoading, createCharacter, updateCharacter } = useCharacters();
  const { openCheckInModal } = useDailyEntry();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleOpenCreate = () => {
    setEditingCharacter(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (character: Character) => {
    setEditingCharacter(character);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: CharacterFormData) => {
    if (editingCharacter) {
      await updateCharacter(editingCharacter.id, data);
    } else {
      await createCharacter(data);
    }
  };

  const filteredCharacters = characters.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.personalityPreset.toLowerCase().includes(q) ||
      (c.personalityDescription && c.personalityDescription.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* ========================================================
          HERO BANNER ("Your space. Your pace.")
         ======================================================== */}
      <div className="inaro-card p-6 sm:p-10 relative overflow-hidden bg-white/95">
        <div className="max-w-2xl mx-auto text-center">
          {/* Top pill badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200/60 uppercase tracking-wider">
              🌱 MINDFUL DAILY WELLNESS
            </span>
          </div>

          {/* Big Bold Typography */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
            Your space. <span className="text-gradient-blue-purple">Your pace.</span>
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-lg mx-auto mb-6">
            A little space to talk, reflect, and be yourself. Choose or create a companion to express your thoughts freely without judgment.
          </p>

          {/* Action Buttons: Create and Daily Check-In */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-6">
            <button
              onClick={handleOpenCreate}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition cursor-pointer"
            >
              <span>Create Character</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={openCheckInModal}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-white hover:bg-purple-50/80 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-200/90 shadow-2xs hover:border-purple-300 transition cursor-pointer"
            >
              <Smile className="w-4 h-4 text-purple-600" />
              <span>Daily Check-In</span>
            </button>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-600 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/70 shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-500" /> Encrypted Journaling
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/70 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Tamil & English Chat
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/70 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Verified Crisis Helplines
            </span>
          </div>

          {/* Trust points footer */}
          <div className="pt-4 border-t border-purple-100/70 flex items-center justify-center text-[11px] font-medium text-slate-400 gap-2 sm:gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-slate-500">✓ Zero Ads</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">✓ No Medical Claims</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">✓ 100% Safe</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          COMPANIONS SELECTION SECTION
         ======================================================== */}
      <div className="pt-4">
        {/* Search and Count Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Choose a Companion
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a personality to start a private WhatsApp-style conversation
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companions..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-purple-200/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition shadow-2xs"
                aria-label="Search companion characters"
              />
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition cursor-pointer shrink-0"
              aria-label="Create companion"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 inaro-card animate-pulse space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-100" />
                <div className="h-5 bg-purple-100 rounded w-1/2" />
                <div className="h-4 bg-purple-50 rounded w-1/3" />
                <div className="h-12 bg-purple-50 rounded" />
              </div>
            ))}
          </div>
        ) : filteredCharacters.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 inaro-card">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No companions found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              {searchQuery
                ? `No companions matched "${searchQuery}". Try a different search.`
                : 'You have not added any characters yet. Create your first companion to begin chatting!'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Companion
            </button>
          </div>
        ) : (
          /* Character Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <CharacterFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialCharacter={editingCharacter}
      />

      {/* Small Floating Helpline Icon in Bottom Corner */}
      <aside className="fixed bottom-6 right-6 z-40">
        <Link
          to="/support"
          className="relative flex items-center justify-center w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/35 hover:scale-110 active:scale-95 transition-all cursor-pointer group"
          title="24/7 Crisis Helpline & Support"
          aria-label="Open 24/7 Crisis Helpline directory"
        >
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-400 animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-300 border-2 border-white" />
          <PhoneCall className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="sr-only">Helpline</span>
        </Link>
      </aside>
    </div>
  );
};
