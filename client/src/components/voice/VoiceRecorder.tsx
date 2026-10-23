import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (blob: Blob, durationSeconds: number) => void;
  isSending?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, isSending = false }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up streams and timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTimer = (sec: number): string => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setErrorMessage(null);

    // Unsupported browser check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Audio recording is not supported on this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Choose supported mimeType
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')) {
          mimeType = 'audio/ogg; codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access denied. Please grant permission in your browser settings.');
      } else {
        setErrorMessage('Unable to access your microphone. Please check your audio device.');
      }
    }
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const finishAndSend = () => {
    if (!mediaRecorderRef.current || audioChunksRef.current.length === 0 && recordSeconds === 0) {
      cancelRecording();
      return;
    }

    const duration = recordSeconds;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const recorder = mediaRecorderRef.current;
    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      if (audioBlob.size > 0) {
        onSendVoice(audioBlob, duration || 1);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordSeconds(0);
    };

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  if (!isRecording) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={startRecording}
          disabled={isSending}
          className="p-3 rounded-full text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          title="Record voice message"
          aria-label="Record voice message"
        >
          <Mic className="w-5 h-5 text-purple-600" />
        </button>

        {errorMessage && (
          <div
            className="absolute bottom-14 right-0 w-72 p-3 bg-white border border-rose-300 rounded-2xl shadow-xl text-xs text-rose-600 flex items-start gap-2 animate-fade-in z-30"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <p>{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="mt-1 text-[11px] underline text-rose-600 hover:text-rose-800 font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-rose-200 shadow-md animate-fade-in flex-1">
      {/* Pulsing Red Dot & Timer */}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-rose-500 recording-active" />
        <span className="text-sm font-semibold tracking-wider text-rose-600 font-mono">
          {formatTimer(recordSeconds)}
        </span>
      </div>

      <div className="flex-1 text-xs text-slate-500 truncate">
        Recording audio... Speak naturally.
      </div>

      {/* Cancel button */}
      <button
        type="button"
        onClick={cancelRecording}
        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
        title="Cancel voice recording"
        aria-label="Cancel voice recording"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Send button */}
      <button
        type="button"
        onClick={finishAndSend}
        disabled={recordSeconds < 1}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition cursor-pointer"
        title="Send voice note"
        aria-label="Send recorded voice note"
      >
        <Send className="w-3.5 h-3.5" />
        <span>Send</span>
      </button>
    </div>
  );
};
