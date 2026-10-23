import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, FileText } from 'lucide-react';

interface AudioBubblePlayerProps {
  audioUrl?: string;
  duration?: number;
  isUserMessage: boolean;
  transcript?: string;
}

export const AudioBubblePlayer: React.FC<AudioBubblePlayerProps> = ({
  audioUrl,
  duration = 0,
  isUserMessage,
  transcript,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(duration || 0);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(true);
          setTimeout(() => setIsPlaying(false), 2000);
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audio) {
      audio.currentTime = targetTime;
    }
  };

  const formatTime = (timeInSec: number): string => {
    const min = Math.floor(timeInSec / 60);
    const sec = Math.floor(timeInSec % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2 max-w-sm">
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      {/* Audio Controller */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition shadow-sm cursor-pointer ${
            isUserMessage
              ? 'bg-white text-indigo-700 hover:bg-slate-100'
              : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-500/20'
          }`}
          aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
        </button>

        {/* Progress Bar & Wave visualizer */}
        <div className="flex-1 min-w-[130px]">
          <div className="flex items-center gap-1 mb-1.5 h-3">
            {[40, 75, 55, 90, 60, 30, 85, 45, 65, 80, 50, 70].map((h, i) => (
              <span
                key={i}
                className={`flex-1 rounded-full transition-all duration-300 ${
                  isPlaying
                    ? isUserMessage ? 'bg-white animate-pulse' : 'bg-purple-600 animate-pulse'
                    : isUserMessage ? 'bg-white/40' : 'bg-purple-200'
                }`}
                style={{ height: `${isPlaying ? Math.max(20, Math.round(h * Math.random())) : h}%` }}
              />
            ))}
          </div>

          <input
            type="range"
            min="0"
            max={totalDuration || 1}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${
              isUserMessage ? 'bg-white/20 accent-white' : 'bg-purple-100 accent-purple-600'
            }`}
            aria-label="Seek voice message position"
          />

          <div className={`flex justify-between text-[10px] mt-1 font-mono ${
            isUserMessage ? 'text-purple-100' : 'text-slate-500'
          }`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration || duration)}</span>
          </div>
        </div>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className={`pt-1.5 border-t ${isUserMessage ? 'border-white/20' : 'border-purple-100'}`}>
          <button
            type="button"
            onClick={() => setShowTranscript((prev) => !prev)}
            className="text-[11px] font-semibold flex items-center gap-1 opacity-80 hover:opacity-100 transition underline underline-offset-2 cursor-pointer"
          >
            <FileText className="w-3 h-3" />
            {showTranscript ? 'Hide Transcript' : 'View Transcript'}
          </button>
          {showTranscript && (
            <div className={`mt-1.5 p-2.5 rounded-xl text-xs leading-relaxed border animate-fade-in ${
              isUserMessage
                ? 'bg-black/20 text-white border-white/10'
                : 'bg-purple-50 text-slate-800 border-purple-200'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block mb-0.5 ${
                isUserMessage ? 'text-purple-200' : 'text-purple-700'
              }`}>
                Transcript
              </span>
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
