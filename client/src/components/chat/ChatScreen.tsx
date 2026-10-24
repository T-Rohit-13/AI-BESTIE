import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacters } from '../../context/CharactersContext';
import { useChat } from '../../context/ChatContext';
import { Character, CharacterFormData } from '../../types/interactive';
import { CuteMascot } from '../avatar/CuteMascot';
import { CharacterFormModal } from './CharacterFormModal';
import { ArrowLeft, Edit3, MoreVertical, Sparkles, X } from 'lucide-react';

declare const THREE: any;

// Mood configurations with 3D parameters and color gradients
interface MoodSpec {
  a: string;
  b: string;
  l: string;
  brow: number;
  smile: number;
  eye: number;
  sp: number;
  pa: number;
  asym: number;
  label: string;
  toneEmoji: string;
}

const MOODS: Record<string, MoodSpec> = {
  neutral: {
    a: '#f1ebff',
    b: '#d8ebff',
    l: '#ffffff',
    brow: 0,
    smile: 0.35,
    eye: 1,
    sp: 1,
    pa: 1,
    asym: 0,
    label: 'Neutral',
    toneEmoji: '🌿',
  },
  happy: {
    a: '#fff0f7',
    b: '#d6ecff',
    l: '#fff4e6',
    brow: -0.1,
    smile: 1,
    eye: 1,
    sp: 1.4,
    pa: 1.3,
    asym: 0,
    label: 'Happy',
    toneEmoji: '✨',
  },
  excited: {
    a: '#ffe9f6',
    b: '#e1d8ff',
    l: '#fff0dc',
    brow: -0.2,
    smile: 1,
    eye: 1.15,
    sp: 2.2,
    pa: 2,
    asym: 0,
    label: 'Excited',
    toneEmoji: '⚡',
  },
  calm: {
    a: '#e7e1ff',
    b: '#d2f0f4',
    l: '#eeedff',
    brow: 0,
    smile: 0.5,
    eye: 0.8,
    sp: 0.6,
    pa: 0.5,
    asym: 0,
    label: 'Calm',
    toneEmoji: '🌸',
  },
  sad: {
    a: '#e0e3f6',
    b: '#c6d6ef',
    l: '#d3e0ff',
    brow: 0.4,
    smile: -0.6,
    eye: 0.8,
    sp: 0.4,
    pa: 0.3,
    asym: 0,
    label: 'Sad',
    toneEmoji: '🌧️',
  },
  stressed: {
    a: '#e9e7f3',
    b: '#d8e2ec',
    l: '#e6ecfa',
    brow: 0.25,
    smile: -0.2,
    eye: 0.95,
    sp: 0.3,
    pa: 0.1,
    asym: 0,
    label: 'Stressed',
    toneEmoji: '🛡️',
  },
  confused: {
    a: '#f1e8fb',
    b: '#dcebf7',
    l: '#ffffff',
    brow: 0,
    smile: 0,
    eye: 1,
    sp: 0.8,
    pa: 0.7,
    asym: 0.18,
    label: 'Confused',
    toneEmoji: '💭',
  },
  uncertain: {
    a: '#eeeaf5',
    b: '#dfe6ef',
    l: '#ffffff',
    brow: 0.1,
    smile: 0.1,
    eye: 0.9,
    sp: 0.7,
    pa: 0.6,
    asym: 0.08,
    label: 'Uncertain',
    toneEmoji: '🌱',
  },
};

// Distinct theme configurations for each companion
interface CompanionTheme {
  bodyCol: string;
  accent: string;
  glow: string;
  gradA: string;
  gradB: string;
}

const COMPANION_THEMES: Record<string, CompanionTheme> = {
  char_maya: {
    bodyCol: '#99f6e4', // Mint / Emerald
    accent: '#059669',
    glow: '#34d399',
    gradA: '#e6fcf5',
    gradB: '#ccfbf1',
  },
  char_aravind: {
    bodyCol: '#c7d2fe', // Periwinkle / Indigo
    accent: '#4f46e5',
    glow: '#818cf8',
    gradA: '#eef2ff',
    gradB: '#e0e7ff',
  },
  char_kaviya: {
    bodyCol: '#fed7aa', // Peach / Amber / Rose
    accent: '#e11d48',
    glow: '#fbbf24',
    gradA: '#fffbeb',
    gradB: '#ffe4e6',
  },
};

// Fallback theme generator
function getCompanionTheme(char?: Character): CompanionTheme {
  if (char && COMPANION_THEMES[char.id]) {
    return COMPANION_THEMES[char.id];
  }
  if (char?.avatarColor?.includes('emerald')) {
    return COMPANION_THEMES.char_maya;
  }
  if (char?.avatarColor?.includes('amber') || char?.avatarColor?.includes('rose')) {
    return COMPANION_THEMES.char_kaviya;
  }
  return {
    bodyCol: '#d8b4fe',
    accent: '#8b5cf6',
    glow: '#c084fc',
    gradA: '#f5f3ff',
    gradB: '#ede9fe',
  };
}

export const ChatScreen: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();

  const { getCharacterById, updateCharacter } = useCharacters();
  const {
    getMessages,
    isResponding,
    sendMessage,
    initCharacterChat,
    addCompanionMessage,
  } = useChat();

  const character = characterId ? getCharacterById(characterId) : undefined;
  const messages = characterId ? getMessages(characterId) : [];
  const responding = characterId ? isResponding(characterId) : false;

  // Active theme based on companion
  const theme = getCompanionTheme(character);

  // Studio UI state
  const [mood, setMood] = useState<string>('neutral');
  const [detectedTone, setDetectedTone] = useState<string>('Neutral');
  const [toneEmoji, setToneEmoji] = useState<string>('🌿');
  const [companionName, setCompanionName] = useState<string>(character?.name || 'Companion');
  const [companionBodyCol, setCompanionBodyCol] = useState<string>(theme.bodyCol);
  const [lang, setLang] = useState<string>('en');
  const [speakOn, setSpeakOn] = useState<boolean>(true);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [ambientAudioOn, setAmbientAudioOn] = useState<boolean>(false);
  const [ambientVol, setAmbientVol] = useState<number>(0.4);

  // Floating controls state
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isTypeBarOpen, setIsTypeBarOpen] = useState<boolean>(false);
  const [isLogOpen, setIsLogOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // Voice AI State
  type VoiceState = 'idle' | 'listening' | 'transcribing' | 'processing' | 'speaking' | 'error';
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceStatusText, setVoiceStatusText] = useState<string>('Idle · tap the orb to talk');
  const voiceStateRef = useRef<VoiceState>(voiceState);
  voiceStateRef.current = voiceState;

  // Mini-Game state (Tic-tac-toe)
  const [gameBoard, setGameBoard] = useState<string[]>(Array(9).fill(''));
  const [gameStatus, setGameStatus] = useState<string>('Your turn (✕).');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Focus Timer state (Study space)
  const [studySeconds, setStudySeconds] = useState<number>(1500);
  const [isStudyRunning, setIsStudyRunning] = useState<boolean>(false);

  // Gemini API Key Modal state
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const wvCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  // Three.js References
  const threeRef = useRef<{
    renderer: any;
    scene: any;
    cam: any;
    C: any;
    cur: any;
    reqId: number | null;
    jump: number;
    pulse: number;
    px: number;
    py: number;
  }>({
    renderer: null,
    scene: null,
    cam: null,
    C: null,
    cur: {
      brow: 0,
      smile: 0.35,
      eye: 1,
      sp: 1,
      pa: 1,
      asym: 0,
      a: null,
      b: null,
      l: null,
    },
    reqId: null,
    jump: 0,
    pulse: 0,
    px: 0,
    py: 0,
  });

  // Audio References
  const audioRef = useRef<{
    stream: MediaStream | null;
    ac: AudioContext | null;
    an: AnalyserNode | null;
    fdata: Uint8Array | null;
    rec: any;
    ac2: AudioContext | null;
    amb: GainNode | null;
    oscs: OscillatorNode[];
  }>({
    stream: null,
    ac: null,
    an: null,
    fdata: null,
    rec: null,
    ac2: null,
    amb: null,
    oscs: [],
  });

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => setToastMessage(''), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize character and chat on mount / switch
  useEffect(() => {
    if (characterId && character) {
      initCharacterChat(characterId, character.name, character.personalityPreset);
      setCompanionName(character.name);
      setCompanionBodyCol(theme.bodyCol);
    }
  }, [characterId, character, initCharacterChat, theme.bodyCol]);



  // Scroll transcript when messages change
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, isLogOpen]);

  // ========================================================
  // VOICE AI TONE DETECTION & MOOD ANALYSIS
  // ========================================================

  const analyzeToneAndEmotion = useCallback(
    (text: string, freqData?: Uint8Array): keyof typeof MOODS => {
      const s = text.toLowerCase();

      // Acoustic energy analysis
      let energy = 0;
      let isHighPitch = false;
      if (freqData && freqData.length > 0) {
        let sum = 0;
        let highFreqSum = 0;
        const half = Math.floor(freqData.length / 2);
        for (let i = 0; i < freqData.length; i++) {
          sum += freqData[i];
          if (i >= half) highFreqSum += freqData[i];
        }
        energy = sum / freqData.length / 255;
        isHighPitch = highFreqSum / (sum + 1) > 0.42;
      }

      // 1. Stressed / Anxiety Tone
      if (
        /\b(stress|stressed|anxious|anxiety|panic|overwhelm|overwhelmed|exam|deadline|pressure|scared|nervous|freaking out)\b/.test(
          s
        )
      ) {
        return 'stressed';
      }

      // 2. Sadness / Grief Tone
      if (
        /\b(sad|crying|cry|unhappy|depressed|lonely|hurt|heartbroken|tired of|miss|hopeless|bad day|down)\b/.test(
          s
        )
      ) {
        return 'sad';
      }

      // 3. Excited / High Energy Tone
      if (
        /\b(excited|can't wait|awesome|omg|super|yay|hooray|pumped|thrilled|epic|amazing|unbelievable)\b/.test(
          s
        ) ||
        (energy > 0.55 && isHighPitch)
      ) {
        return 'excited';
      }

      // 4. Happy / Joyful Tone
      if (
        /\b(happy|glad|great|good|smile|love|laugh|fun|cheerful|grateful|nice|wonderful|best|delighted)\b/.test(
          s
        )
      ) {
        return 'happy';
      }

      // 5. Calm / Peaceful Tone
      if (
        /\b(calm|peace|relax|breathe|zen|peaceful|quiet|rest|meditate|serene|chill|soothing)\b/.test(
          s
        )
      ) {
        return 'calm';
      }

      // 6. Confused Tone
      if (
        /\b(confused|why|what do you mean|how come|don't understand|puzzled|lost)\b/.test(s) ||
        s.endsWith('?')
      ) {
        return 'confused';
      }

      // 7. Uncertain Tone
      if (/\b(maybe|not sure|uncertain|guess|probably|i don't know|hesitant)\b/.test(s)) {
        return 'uncertain';
      }

      // Acoustic fallbacks
      if (energy > 0.45 && isHighPitch) return 'excited';
      if (energy < 0.12 && s.length > 5) return 'calm';

      return 'neutral';
    },
    []
  );

  // Speak aloud using SpeechSynthesis
  const speakAloud = useCallback(
    (text: string) => {
      if (!speakOn || !window.speechSynthesis) {
        setVoiceState('idle');
        setVoiceStatusText('Idle · tap the orb to talk');
        return;
      }
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`~[\]]/g, '').trim();
      const u = new SpeechSynthesisUtterance(cleanText);
      u.lang = lang === 'ta' ? 'ta-IN' : 'en-US';

      // Female voice selection: priority given to natural female voices
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice =
        voices.find((v) => /female|jenny|zira|samantha|victoria|karen|siri/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith('en') && /female/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith('en'));

      if (femaleVoice) {
        u.voice = femaleVoice;
      }
      u.pitch = 1.18; // Warm soothing friendly female pitch
      u.rate = 1.0;

      u.onstart = () => {
        setVoiceState('speaking');
        setVoiceStatusText(`${companionName} is speaking…`);
      };

      u.onboundary = () => {
        threeRef.current.pulse = 1;
      };

      u.onend = () => {
        setVoiceState('idle');
        setVoiceStatusText('Idle · tap the orb to talk');
      };

      u.onerror = () => {
        setVoiceState('idle');
        setVoiceStatusText('Idle · tap the orb to talk');
      };

      setVoiceState('speaking');
      window.speechSynthesis.speak(u);
    },
    [speakOn, lang, companionName]
  );

  // Stop all active audio / recognition
  const stopAllAudio = useCallback(() => {
    if (audioRef.current.stream) {
      audioRef.current.stream.getTracks().forEach((t) => t.stop());
      audioRef.current.stream = null;
    }
    if (audioRef.current.ac) {
      audioRef.current.ac.close().catch(() => {});
      audioRef.current.ac = null;
      audioRef.current.an = null;
    }
    if (audioRef.current.rec) {
      try {
        audioRef.current.rec.abort();
      } catch (e) {}
      audioRef.current.rec = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('idle');
    setVoiceStatusText('Idle · tap the orb to talk');
  }, []);

  // Process a user message (spoken or typed)
  const handleUserMessage = useCallback(
    async (text: string, freqSnapshot?: Uint8Array) => {
      const cleanText = text.trim();
      if (!cleanText || !characterId) return;

      // 1. Tone Detection & Mood Analysis
      const detected = analyzeToneAndEmotion(cleanText, freqSnapshot);
      setMood(detected);
      setDetectedTone(MOODS[detected].label);
      setToneEmoji(MOODS[detected].toneEmoji);

      showToast(`Tone detected: ${MOODS[detected].label} ${MOODS[detected].toneEmoji}`);
      setVoiceState('processing');
      setVoiceStatusText(`Analyzing tone (${MOODS[detected].label}) & thinking…`);

      // 2. 3D Companion reaction
      threeRef.current.jump = 1;

      // 3. Send message to chat store & API
      try {
        const activeKey = localStorage.getItem('gemini_api_key') || undefined;
        await sendMessage(characterId, cleanText, activeKey);
      } catch (e) {
        // Handled gracefully in context
      }
    },
    [characterId, analyzeToneAndEmotion, sendMessage, showToast]
  );

  // Synchronize AI speech response with companion mouth visemes
  useEffect(() => {
    if (responding) {
      setVoiceState('processing');
      setVoiceStatusText(`${companionName} is thinking…`);
    } else if (messages.length > 0 && messages[messages.length - 1].sender === 'ai') {
      const lastAiMsg = messages[messages.length - 1].text;
      speakAloud(lastAiMsg);
    }
  }, [responding, messages, companionName, speakAloud]);

  // Voice Input (Orb) Listener
  const startListening = useCallback(async () => {
    if (voiceState !== 'idle' && voiceState !== 'error') {
      stopAllAudio();
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceState('error');
      setVoiceStatusText('Speech recognition not available. Use typing instead.');
      showToast('Speech recognition not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRef.current.stream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ac = new AudioCtx();
      const an = ac.createAnalyser();
      an.fftSize = 64;
      const source = ac.createMediaStreamSource(stream);
      source.connect(an);

      audioRef.current.ac = ac;
      audioRef.current.an = an;
      audioRef.current.fdata = new Uint8Array(an.frequencyBinCount);

      const rec = new SpeechRec();
      rec.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
      rec.interimResults = false;
      audioRef.current.rec = rec;

      rec.onresult = (e: any) => {
        setVoiceState('transcribing');
        setVoiceStatusText('Transcribing your voice…');
        const transcript = e.results[0][0].transcript;

        // Take snapshot of frequency data for pitch/energy analysis
        const freqSnapshot = audioRef.current.fdata
          ? new Uint8Array(audioRef.current.fdata)
          : undefined;

        stopAllAudio();
        handleUserMessage(transcript, freqSnapshot);
      };

      rec.onerror = (e: any) => {
        if (e.error !== 'aborted') {
          setVoiceState('error');
          setVoiceStatusText(`Voice error: ${e.error}`);
          showToast(`Microphone notice: ${e.error}`);
          setTimeout(() => setVoiceState('idle'), 3000);
        }
      };

      rec.onend = () => {
        if (voiceStateRef.current === 'listening') {
          stopAllAudio();
          setVoiceState('idle');
          setVoiceStatusText('Idle · tap the orb to talk');
        }
      };

      rec.start();
      setVoiceState('listening');
      setVoiceStatusText('Listening… speak freely');
    } catch (err) {
      setVoiceState('error');
      setVoiceStatusText('Microphone access blocked or unavailable.');
      showToast('Microphone access denied or unavailable.');
    }
  }, [voiceState, lang, stopAllAudio, handleUserMessage, showToast]);

  // Ambient sound synthesizer
  const toggleAmbientSound = useCallback(
    (on: boolean) => {
      setAmbientAudioOn(on);
      const audio = audioRef.current;
      if (on) {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          audio.ac2 = audio.ac2 || new AudioCtx();
          if (audio.ac2.state === 'suspended') {
            audio.ac2.resume();
          }
          audio.amb = audio.ac2.createGain();
          audio.amb.gain.value = ambientVol * 0.12;

          const filter = audio.ac2.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 650;
          filter.connect(audio.amb);
          audio.amb.connect(audio.ac2.destination);

          audio.oscs = [220, 277.2, 329.6, 440].map((fr) => {
            const osc = audio.ac2!.createOscillator();
            osc.frequency.value = fr;
            osc.connect(filter);
            osc.start();
            return osc;
          });
        } catch (e) {}
      } else {
        audio.oscs.forEach((o) => {
          try {
            o.stop();
          } catch (e) {}
        });
        audio.oscs = [];
        if (audio.amb) {
          audio.amb.disconnect();
          audio.amb = null;
        }
      }
    },
    [ambientVol]
  );

  // Focus timer countdown
  useEffect(() => {
    let interval: any;
    if (isStudyRunning && studySeconds > 0) {
      interval = setInterval(() => {
        setStudySeconds((prev) => {
          if (prev <= 1) {
            setIsStudyRunning(false);
            showToast('Time is up! Great focus session. 🌸');
            threeRef.current.jump = 1;
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudyRunning, studySeconds, showToast]);

  // ========================================================
  // THREE.JS 3D SCENE SETUP & ANIMATION LOOP
  // ========================================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof THREE === 'undefined') return;

    let renderer: any;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch (e) {
      return;
    }

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

    // Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0xc9d6ff, 0.95);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 5);
    scene.add(hemi, dir);

    // Ground circle
    const fl = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })
    );
    fl.rotation.x = -Math.PI / 2;
    fl.position.y = -1.2;
    scene.add(fl);

    // Ground soft radial shadow
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(80,60,150,0.35)');
    gr.addColorStop(1, 'rgba(80,60,150,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);

    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.8),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true,
        depthWrite: false,
      })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = -1.19;
    scene.add(sh);

    // Materials
    const M = (c: any, r = 0.5) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
    const sph = (r: number, m: any, x = 1, y = 1, z = 1) => {
      const o = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), m);
      o.scale.set(x, y, z);
      return o;
    };

    const mat = M(companionBodyCol, 0.45);
    const lite = M(0xf4eeff, 0.5);
    const pink = M(0xffb8d6, 0.7);
    const dk = M(0x2b2145, 0.3);
    const wh = M(0xffffff, 0.2);

    const cr = new THREE.Group();
    scene.add(cr);

    // Chubby body
    const body = sph(1, mat, 1.05, 1, 0.95);
    cr.add(body);

    // White belly
    const belly = sph(0.6, lite, 1, 1, 0.5);
    belly.position.set(0, -0.45, 0.55);
    cr.add(belly);

    // Tail
    const tail = sph(0.25, lite);
    tail.position.set(0, -0.6, -0.9);
    cr.add(tail);

    // Horns, feet, and blush cheeks
    [-1, 1].forEach((s) => {
      const h = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 16), lite);
      h.position.set(s * 0.38, 1, 0);
      h.rotation.z = -s * 0.4;
      cr.add(h);

      const f = sph(0.3, mat, 1.1, 0.6, 1.2);
      f.position.set(s * 0.45, -1, 0.3);
      cr.add(f);

      const ck = sph(0.14, pink, 1, 0.7, 0.3);
      ck.position.set(s * 0.64, -0.05, 0.72);
      cr.add(ck);
    });

    // Arms
    const arms = [-1, 1].map((s) => {
      const a = new THREE.Group();
      a.position.set(s * 1, -0.1, 0.2);
      const m = sph(0.22, mat, 0.8, 1.3, 0.8);
      m.position.y = -0.2;
      a.add(m);
      cr.add(a);
      return a;
    });

    // Eyes with specular highlights
    const eyes = [-1, 1].map((s) => {
      const e = new THREE.Group() as any;
      e.position.set(s * 0.4, 0.22, 0.8);
      e.add(sph(0.22, wh, 1, 1.15, 0.5));

      const p = new THREE.Group();
      p.add(sph(0.11, dk, 1, 1.1, 0.6));
      const hl = sph(0.035, wh);
      hl.position.set(0.04, 0.05, 0.07);
      p.add(hl);
      p.position.z = 0.07;
      e.add(p);
      e.p = p;
      cr.add(e);
      return e;
    });

    // Eyebrows
    const brows = [-1, 1].map((s) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.06), dk);
      b.position.set(s * 0.4, 0.58, 0.72);
      b.rotation.x = -0.25;
      cr.add(b);
      return b;
    });

    // Mouths (Smile + Open viseme)
    const mS = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.026, 8, 24, Math.PI), dk);
    mS.position.set(0, -0.1, 0.93);
    cr.add(mS);

    const mO = sph(0.11, M(0x7a2d5a, 0.4), 1, 1, 0.3);
    mO.position.set(0, -0.17, 0.92);
    mO.visible = false;
    cr.add(mO);

    // Floating Charms
    const fls: any[] = [];
    [
      [-2.7, 1.3, -1, 'ico'],
      [2.8, 0.7, -1.5, 'oct'],
      [-2.3, -0.2, -2, 'tor'],
      [2.4, 1.9, -2, 'dod'],
    ].forEach(([x, y, z, k]: any, i) => {
      const geo =
        k === 'ico'
          ? new THREE.IcosahedronGeometry(0.35)
          : k === 'oct'
          ? new THREE.OctahedronGeometry(0.35)
          : k === 'tor'
          ? new THREE.TorusGeometry(0.3, 0.1, 12, 24)
          : new THREE.DodecahedronGeometry(0.3);

      const m = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: [0xffc8e1, 0xbfe0ff, 0xd7c8ff, 0xc9f2e4][i],
          roughness: 0.5,
          flatShading: true,
        })
      );
      m.position.set(x, y, z);
      m.userData = { y, i };
      scene.add(m);
      fls.push(m);
    });

    // Star points
    const N = 60;
    const pg = new THREE.BufferGeometry();
    const pa = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pa[i * 3] = (Math.random() - 0.5) * 8;
      pa[i * 3 + 1] = Math.random() * 4 - 1;
      pa[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    pg.setAttribute('position', new THREE.BufferAttribute(pa, 3));
    const pts = new THREE.Points(
      pg,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.8 })
    );
    scene.add(pts);

    threeRef.current.renderer = renderer;
    threeRef.current.scene = scene;
    threeRef.current.cam = cam;
    threeRef.current.C = { cr, body, mat, eyes, brows, mS, mO, arms, fls, pts, pa, hemi, dir };
    threeRef.current.cur.a = new THREE.Color(MOODS.neutral.a);
    threeRef.current.cur.b = new THREE.Color(MOODS.neutral.b);
    threeRef.current.cur.l = new THREE.Color(MOODS.neutral.l);

    // Resize handler
    const handleResize = () => {
      if (!renderer || !canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.position.set(0, 1.1, 8.5 / Math.min(1, cam.aspect * 1.3));
      cam.lookAt(0, 0.1, 0);
      cam.updateProjectionMatrix();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Pointer tracking
    const handlePointerMove = (e: PointerEvent) => {
      threeRef.current.px = (e.clientX / window.innerWidth) * 2 - 1;
      threeRef.current.py = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', handlePointerMove);

    // Tap companion raycasting
    const handlePointerDown = (e: PointerEvent) => {
      if (!threeRef.current.C) return;
      const rc = new THREE.Raycaster();
      const v = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1)
      );
      rc.setFromCamera(v, cam);
      if (rc.intersectObject(threeRef.current.C.body).length) {
        threeRef.current.jump = 1;
      }
    };
    canvas.addEventListener('pointerdown', handlePointerDown);

    // Animation Tick Loop
    const clk = new THREE.Clock();
    let blink = 0;
    let nb = 2;
    const lerp = THREE.MathUtils.lerp;

    const tick = () => {
      threeRef.current.reqId = requestAnimationFrame(tick);
      const dt = Math.min(clk.getDelta(), 0.05);
      const t = clk.elapsedTime;
      const mo = reduceMotion ? 0.2 : 1;
      const T = MOODS[mood] || MOODS.neutral;
      const cur = threeRef.current.cur;

      // Lerp 3D facial & movement parameters
      ['brow', 'smile', 'eye', 'sp', 'pa', 'asym'].forEach((k) => {
        cur[k] = lerp(cur[k], (T as any)[k], 0.05);
      });

      // Lerp ambient lighting colors
      if (cur.a && cur.b && cur.l) {
        cur.a.lerp(new THREE.Color(T.a), 0.05);
        cur.b.lerp(new THREE.Color(T.b), 0.05);
        cur.l.lerp(new THREE.Color(T.l), 0.05);

        // Update Background Gradient dynamically
        if (bgRef.current) {
          bgRef.current.style.background = `radial-gradient(circle at 50% 38%, ${cur.a.getStyle()}, ${cur.b.getStyle()})`;
        }
      }

      // Audio waveform & level
      let bars: Uint8Array | null = null;
      if (audioRef.current.an && voiceState === 'listening') {
        const fdata = audioRef.current.fdata!;
        audioRef.current.an.getByteFrequencyData(fdata as any);
        bars = fdata;
      }

      threeRef.current.pulse *= 0.9;
      threeRef.current.jump *= 0.92;

      const C = threeRef.current.C;
      if (C) {
        const { cr, eyes, brows, mS, mO, arms } = C;
        C.hemi.color.copy(cur.l);
        C.dir.color.copy(cur.l);

        // Update body color if changed in studio
        if (C.mat.color.getHexString() !== companionBodyCol.replace('#', '')) {
          C.mat.color.set(companionBodyCol);
        }

        // Bobbing & jumping
        cr.position.y = Math.abs(Math.sin(t * cur.sp * 2)) * 0.07 * mo + threeRef.current.jump * 0.5 * mo;
        cr.scale.set(
          1 + Math.sin(t * 1.6) * 0.015 * mo - threeRef.current.jump * 0.03,
          1 + Math.sin(t * 1.6) * 0.025 * mo + threeRef.current.jump * 0.05,
          1
        );

        // Tilt & rotation based on state and pointer
        const tilt =
          voiceState === 'listening'
            ? 0.14
            : voiceState === 'processing'
            ? Math.sin(t * 2) * 0.1
            : Math.sin(t * 0.7) * 0.04 * mo;
        cr.rotation.z = lerp(cr.rotation.z, tilt, 0.08);
        cr.rotation.y = lerp(cr.rotation.y, threeRef.current.px * 0.35 * mo, 0.06);
        cr.rotation.x = lerp(cr.rotation.x, -threeRef.current.py * 0.12 * mo, 0.06);

        // Blinking
        nb -= dt;
        if (nb < 0) {
          blink = 1;
          nb = 2 + Math.random() * 3;
        }
        blink = Math.max(0, blink - dt * 7);
        const open =
          cur.eye *
          (1 - Math.sin(blink * Math.PI) * 0.92) *
          (voiceState === 'listening' ? 1.12 : 1);

        eyes.forEach((e: any) => {
          e.scale.y = Math.max(0.06, open);
          const lx = voiceState === 'processing' ? 0.4 : threeRef.current.px;
          const ly = voiceState === 'processing' ? 0.5 : threeRef.current.py;
          e.p.position.x = lerp(e.p.position.x, lx * 0.07, 0.1);
          e.p.position.y = lerp(e.p.position.y, ly * 0.07, 0.1);
        });

        // Eyebrows
        brows.forEach((b: any, i: number) => {
          const s = i ? 1 : -1;
          b.rotation.z = s * cur.brow * -1 + (i ? cur.asym : 0);
          b.position.y = 0.58 + (i ? cur.asym * 0.3 : 0) + (cur.eye > 1.1 ? 0.06 : 0);
        });

        // Mouth (smile vs speaking viseme)
        const sm = cur.smile;
        mS.rotation.z = sm >= 0 ? Math.PI : 0;
        mS.scale.y = Math.max(0.15, Math.abs(sm));
        mS.position.y = sm >= 0 ? -0.04 : -0.2;

        const isSpk = voiceState === 'speaking';
        mS.visible = !isSpk;
        mO.visible = isSpk;
        if (isSpk) {
          mO.scale.set(
            1,
            0.15 + threeRef.current.pulse * 0.9 + Math.abs(Math.sin(t * 9)) * 0.1 * threeRef.current.pulse,
            0.3
          );
        }

        // Arm gestures
        const wave = cur.sp > 1.5 || (voiceState === 'speaking' && mood === 'happy');
        arms[1].rotation.z = lerp(arms[1].rotation.z, wave ? Math.sin(t * 7) * 0.7 * mo + 0.6 : 0, 0.15);
        arms[0].rotation.z = Math.sin(t * 1.4) * 0.06 * mo;

        // Floating gems
        C.fls.forEach((m: any) => {
          m.rotation.x += dt * 0.4 * cur.sp * mo;
          m.rotation.y += dt * 0.3 * mo;
          m.position.y = m.userData.y + Math.sin(t * 0.8 + m.userData.i) * 0.15 * mo;
        });

        // Particle stars
        const pa = C.pa;
        for (let i = 0; i < pa.length; i += 3) {
          pa[i + 1] += dt * 0.2 * cur.pa * mo;
          if (pa[i + 1] > 3.5) pa[i + 1] = -1;
        }
        C.pts.geometry.attributes.position.needsUpdate = true;
        C.pts.material.opacity = 0.25 + 0.35 * Math.min(cur.pa, 1.5);

        cam.position.x = lerp(cam.position.x, threeRef.current.px * 0.4 * mo, 0.05);
        cam.lookAt(0, 0.1, 0);

        renderer.render(scene, cam);
      }

      // Draw Orb Waveform Canvas
      if (wvCanvasRef.current) {
        const wv = wvCanvasRef.current.getContext('2d');
        if (wv) {
          wv.clearRect(0, 0, 124, 60);
          wv.fillStyle = '#ffffff';
          const n = 12;
          for (let i = 0; i < n; i++) {
            let a = 0.06;
            if (bars) {
              a = Math.max(0.06, bars[i] / 255);
            } else if (voiceState === 'speaking') {
              a = Math.max(
                0.06,
                threeRef.current.pulse * (0.5 + 0.5 * Math.sin(i * 1.3 + t * 12))
              );
            }
            const h = a * 56;
            wv.beginPath();
            if (wv.roundRect) {
              wv.roundRect(i * 10.4 + 2, 30 - h / 2, 6, h, 3);
            } else {
              wv.rect(i * 10.4 + 2, 30 - h / 2, 6, h);
            }
            wv.fill();
          }
        }
      }
    };

    tick();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      if (threeRef.current.reqId) {
        cancelAnimationFrame(threeRef.current.reqId);
      }
      try {
        renderer.dispose();
      } catch (e) {}
    };
  }, [companionBodyCol, mood, reduceMotion, voiceState]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      toggleAmbientSound(false);
    };
  }, [stopAllAudio, toggleAmbientSound]);

  // Tic-Tac-Toe Game Logic with interactive companion banter
  const handleCellClick = (index: number) => {
    if (gameBoard[index] || isGameOver) return;
    const newBoard = [...gameBoard];
    newBoard[index] = 'X';

    const checkWin = (b: string[]) => {
      const W = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];
      for (const [x, y, z] of W) {
        if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x];
      }
      return b.every((c) => c) ? 'T' : null;
    };

    let result = checkWin(newBoard);
    let companionPlaced = -1;
    if (!result) {
      // AI Move
      const empties = newBoard.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      if (empties.length > 0) {
        companionPlaced = empties[Math.floor(Math.random() * empties.length)];
        newBoard[companionPlaced] = 'O';
        result = checkWin(newBoard);
      }
    }

    setGameBoard(newBoard);
    if (result) {
      setIsGameOver(true);
      if (result === 'X') {
        setGameStatus('You win! 🎉 Amazing game!');
        threeRef.current.jump = 2;
        setMood('happy');
        if (characterId) {
          addCompanionMessage(
            characterId,
            `OMG you won!! 🎉 That was a brilliant move! You're unstoppable bestie! Rematch whenever you're ready! 😄`
          );
        }
      } else if (result === 'O') {
        setGameStatus(`${companionName} wins this round! 😄 Rematch?`);
        threeRef.current.jump = 1.3;
        setMood('excited');
        if (characterId) {
          addCompanionMessage(
            characterId,
            `Three in a row! I win this round! 😄 That was such a fun game though—rematch? 🎮`
          );
        }
      } else {
        setGameStatus('A balanced tie! 🤝 Well played!');
        setMood('calm');
        if (characterId) {
          addCompanionMessage(
            characterId,
            `A balanced tie! 🤝 Great minds think alike! Want to play again or try a riddle? ✨`
          );
        }
      }
    } else {
      setGameStatus('Your turn (✕).');
      if (companionPlaced >= 0 && characterId) {
        const movesBanter = [
          `I put my O right there! ✨ Your turn ✕!`,
          `Ooh nice placement! Here's my play! Your turn! 😄`,
          `Blocking you right here! Hehe, your move! 🎮`,
        ];
        const pick = movesBanter[Math.floor(Math.random() * movesBanter.length)];
        addCompanionMessage(characterId, pick);
      }
    }
  };

  const resetGame = () => {
    setGameBoard(Array(9).fill(''));
    setGameStatus('Your turn (✕).');
    setIsGameOver(false);
    if (characterId) {
      addCompanionMessage(characterId, `Fresh game started! 🎮 You make the first move as ✕! Good luck bestie! ✨`);
    }
  };

  const handlePlayWouldYouRather = () => {
    if (!characterId) return;
    const questions = [
      `Would you rather have infinite cozy rain outside with endless hot chocolate, or a warm sunny beach day with unlimited ice cream? 🍦 Tell me!`,
      `Would you rather be able to pause time whenever you need a nap, or be able to teleport anywhere in the world instantly? ✨`,
      `Would you rather always know what your pets are thinking, or be fluent in every human language in the world? 🐶`,
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];
    addCompanionMessage(characterId, `🎲 Would You Rather time! Here is your question:\n"${q}"`);
    threeRef.current.jump = 1;
    setMood('happy');
    showToast('Sent game question to chat!');
  };

  const handlePlayRiddle = () => {
    if (!characterId) return;
    const riddles = [
      `🧠 Riddle time! "I have branches, but no fruit, trunk or leaves. What am I?" (Hint: think rivers or money!) Type your guess in chat! 😄`,
      `🧠 Here's a cozy riddle: "What can you catch, but never throw?" (Hint: it happens in winter!) What's your answer? ✨`,
      `🧠 Bestie riddle: "What has a thumb and four fingers, but is not alive?" Type your guess! 🧤`,
    ];
    const r = riddles[Math.floor(Math.random() * riddles.length)];
    addCompanionMessage(characterId, r);
    threeRef.current.jump = 1;
    setMood('excited');
    showToast('Companion asked a riddle in chat!');
  };

  // Radial Ring Items
  const RADIAL_ITEMS = [
    { id: 'play', icon: '🎮', label: 'Play Games' },
    { id: 'study', icon: '📚', label: 'Study Space' },
    { id: 'studio', icon: '🎨', label: 'Studio' },
  ];

  return (
    <div className="companion-studio-root" style={{ '--acc': theme.accent } as React.CSSProperties}>
      {/* Dynamic Ambient Background Canvas */}
      <div ref={bgRef} id="bg" />

      {/* Main 3D Companion WebGL Viewport */}
      <canvas ref={canvasRef} id="c" aria-label={`3D companion ${companionName}`} />

      {/* Floating Dedicated Header */}
      <header className="companion-studio-header">
        {/* Companion Title with Accessible Heading */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="studio-btn"
            aria-label="Back to companions"
            title="Return to companions list"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Companions</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 id="ttl" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 m-0 leading-none">
                {companionName}
              </h1>
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: theme.accent }}
                title="Companion Connected"
              />
            </div>
            <small className="block text-xs font-semibold text-purple-700/80 mt-1">
              {character?.personalityPreset || 'Empathetic Companion'}
            </small>
          </div>
        </div>

        {/* Header Tools (Tone Badge, Manual Mood Override, Edit & Transcript Buttons) */}
        <div className="flex items-center gap-2">
          {/* Live Tone / Mood Badge */}
          <div
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 border border-purple-200/80 shadow-xs"
            title={`Voice AI Tone: ${detectedTone}`}
          >
            <span>{toneEmoji}</span>
            <span>Tone: {detectedTone}</span>
          </div>

          {/* Manual Mood Override Selector */}
          <label
            htmlFor="mood"
            className="studio-btn py-1 px-3 text-xs"
            title="Override emotional tone"
          >
            <span>Mood</span>
            <select
              id="mood"
              value={mood}
              onChange={(e) => {
                setMood(e.target.value);
                setDetectedTone(MOODS[e.target.value]?.label || 'Custom');
                setToneEmoji(MOODS[e.target.value]?.toneEmoji || '✨');
                showToast(`Mood adjusted: ${MOODS[e.target.value]?.label}`);
              }}
              aria-label="Manual mood override"
              className="bg-transparent border-0 cursor-pointer font-semibold outline-none text-slate-800"
            >
              {Object.keys(MOODS).map((key) => (
                <option key={key} value={key} className="text-slate-800">
                  {MOODS[key].label}
                </option>
              ))}
            </select>
          </label>

          {/* Edit Companion Shortcut Button */}
          {character && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="studio-btn p-2.5"
              aria-label={`Edit ${character.name}`}
              title={`Edit ${character.name}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {/* Female Voice Toggle Button */}
          <button
            onClick={() => {
              const next = !speakOn;
              setSpeakOn(next);
              if (!next && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
              showToast(next ? 'Female Voice Audio: Active 🔊' : 'Voice Audio: Muted 🔇');
            }}
            className={`studio-btn py-1 px-3 text-xs font-semibold ${speakOn ? 'bg-purple-100/90 text-purple-900 border-purple-300' : 'text-slate-600'}`}
            title={speakOn ? 'Female voice audio enabled. Click to mute.' : 'Audio muted. Click to hear companion in female voice.'}
            aria-label="Toggle companion voice speech"
          >
            <span>{speakOn ? '🔊 Voice' : '🔇 Mute'}</span>
          </button>

          {/* Gemini API Key Configuration Button */}
          <button
            onClick={() => setApiKeyModalOpen(true)}
            className="studio-btn py-1 px-3 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200"
            title="Configure Gemini API Key"
            aria-label="Configure Gemini API Key"
          >
            <span>🔑 Gemini Key</span>
          </button>

          {/* Transcript / Chat Log Button */}
          <button
            id="lg"
            onClick={() => setIsLogOpen(!isLogOpen)}
            className={`studio-btn ${isLogOpen ? 'bg-white shadow-md' : ''}`}
            aria-label="Chat options menu"
            aria-controls="log"
            aria-expanded={isLogOpen}
            title="Toggle Transcript Drawer"
          >
            <span>Transcript</span>
          </button>
        </div>
      </header>

      {/* Floating Radial Ring Menu */}
      <nav
        id="ring"
        className={`radial-ring-menu ${isMenuOpen ? 'open' : ''}`}
        aria-label="Companion menu"
      >
        {RADIAL_ITEMS.map((item, index) => {
          const total = RADIAL_ITEMS.length;
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
          const R = Math.min(window.innerWidth * 0.38, window.innerHeight * 0.28, 195);
          const x = `${Math.cos(angle) * R * 1.15}px`;
          const y = `${Math.sin(angle) * R}px`;

          return (
            <button
              key={item.id}
              className="radial-item-btn"
              style={
                {
                  left: '50%',
                  top: '46%',
                  '--x': x,
                  '--y': y,
                  '--cx': '0px',
                  '--cy': '0px',
                  '--i': index,
                } as React.CSSProperties
              }
              onClick={() => {
                setIsMenuOpen(false);
                setActivePanel(item.id);
                if (item.id === 'play' && characterId) {
                  addCompanionMessage(
                    characterId,
                    `Yay! Let's play games together! 🎮 We're playing Tic-Tac-Toe right now—you're ✕ and I'm O. Make your move on the board, or pick Would You Rather or a Riddle! ✨`
                  );
                  threeRef.current.jump = 1.3;
                  setMood('happy');
                }
              }}
              data-id={item.id}
              aria-current={activePanel === item.id ? 'true' : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Floating Bottom Dock (Typing, Voice Orb, Menu, Status) */}
      <div id="dock" className="companion-studio-dock">
        {/* Typing Bar (Toggled with ⌨ Type button) */}
        <form
          id="tb"
          className={`typing-bar-container ${isTypeBarOpen ? 'open' : ''}`}
          onSubmit={(e) => {
            e.preventDefault();
            if (textInput.trim() && !responding) {
              const val = textInput;
              setTextInput('');
              handleUserMessage(val);
            }
          }}
        >
          <input
            ref={inputRef}
            id="ti"
            type="text"
            className="typing-bar-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Say something to ${companionName}…`}
            aria-label={`Type message for ${companionName}`}
          />
          <button
            id="send"
            type="submit"
            className="studio-btn px-6 text-white"
            style={{ backgroundColor: theme.accent }}
            disabled={responding || !textInput.trim()}
            aria-label="Send message"
          >
            Send
          </button>
        </form>

        {/* Dock Controls Row */}
        <div id="row" className="dock-controls-row">
          {/* Menu Button */}
          <button
            id="menuBtn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="studio-btn"
            aria-expanded={isMenuOpen}
            aria-controls="ring"
          >
            ✦ Menu
          </button>

          {/* Central Voice AI Orb */}
          <button
            id="orb"
            onClick={startListening}
            className={`voice-orb ${voiceState}`}
            aria-label="Record voice message"
            title="Tap to speak with Voice AI"
          >
            <canvas ref={wvCanvasRef} id="wv" width="124" height="60" />
          </button>

          {/* Keyboard Type Toggle Button */}
          <button
            id="kb"
            onClick={() => {
              setIsTypeBarOpen(!isTypeBarOpen);
              if (!isTypeBarOpen) {
                setTimeout(() => inputRef.current?.focus(), 150);
              }
            }}
            className="studio-btn"
            aria-expanded={isTypeBarOpen}
          >
            ⌨ Type
          </button>
        </div>

        {/* Live Status Pill with Detected Tone */}
        <div id="st" className="voice-status-pill" role="status">
          <span>{toneEmoji}</span>
          <span>{voiceStatusText}</span>
        </div>
      </div>

      {/* Slide-Up Panel for Tools */}
      <section
        id="panel"
        className={`studio-sliding-panel glass-surface ${activePanel ? 'open' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby="pt"
      >
        <div className="sliding-panel-header">
          <h2 id="pt" className="text-xl font-bold m-0 flex items-center gap-2 text-slate-900">
            {activePanel === 'play' && '🎮 Play Zone (Tic-Tac-Toe)'}
            {activePanel === 'study' && '📚 Study Space (Focus Timer)'}
            {activePanel === 'studio' && '🎨 Studio Customizer'}
          </h2>
          <button
            id="x"
            onClick={() => setActivePanel(null)}
            className="studio-btn p-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div id="pb" className="text-slate-700 text-sm">
          {/* 1. PLAY GAMES ZONE */}
          {activePanel === 'play' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200/70">
                <p className="note text-xs font-semibold text-purple-900 m-0">
                  🎮 Interactive Games with {companionName}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 m-0">
                  {companionName} plays along directly in your chat with live banter and moves!
                </p>
              </div>

              {/* Tic-Tac-Toe Arena */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">🎯 Tic-Tac-Toe</span>
                  <span className="text-xs font-semibold text-purple-700">You: ✕ | {companionName}: O</span>
                </div>
                <div className="game-grid">
                  {gameBoard.map((val, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCellClick(idx)}
                      disabled={!!val || isGameOver}
                      aria-label={`Cell ${idx + 1} ${val || 'empty'}`}
                      className="font-bold text-lg"
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <p id="gs" className="text-center font-bold text-purple-700 my-2 text-xs">
                  {gameStatus}
                </p>
                <div className="flex justify-center mt-2">
                  <button onClick={resetGame} className="studio-btn text-xs py-1.5 px-3">
                    🔄 Rematch
                  </button>
                </div>
              </div>

              {/* More Games with Companion */}
              <div className="pt-3 border-t border-purple-100/80">
                <p className="text-xs font-bold text-slate-800 mb-2">✨ Quick Bestie Games</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePlayWouldYouRather}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200/80 text-left transition group shadow-2xs cursor-pointer"
                  >
                    <span className="block text-base mb-0.5">🎲</span>
                    <span className="block text-xs font-bold text-slate-800 group-hover:text-purple-700">
                      Would You Rather
                    </span>
                    <span className="block text-[10px] text-slate-400">Cozy dilemma fun</span>
                  </button>

                  <button
                    onClick={handlePlayRiddle}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200/80 text-left transition group shadow-2xs cursor-pointer"
                  >
                    <span className="block text-base mb-0.5">🧠</span>
                    <span className="block text-xs font-bold text-slate-800 group-hover:text-purple-700">
                      Bestie Riddle
                    </span>
                    <span className="block text-[10px] text-slate-400">Mind-bending teasers</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. STUDY SPACE */}
          {activePanel === 'study' && (
            <div className="text-center py-4">
              <div className="text-5xl font-black text-slate-800 tracking-tight my-4">
                {String(Math.floor(studySeconds / 60)).padStart(2, '0')}:
                {String(studySeconds % 60).padStart(2, '0')}
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setIsStudyRunning(!isStudyRunning);
                    if (!isStudyRunning) {
                      setMood('calm');
                      setDetectedTone('Calm');
                      setToneEmoji('🌸');
                    }
                  }}
                  className="studio-btn px-6 text-white font-bold"
                  style={{ backgroundColor: theme.accent }}
                >
                  {isStudyRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() => {
                    setIsStudyRunning(false);
                    setStudySeconds(1500);
                  }}
                  className="studio-btn"
                >
                  Reset
                </button>
              </div>
              <p className="note mt-4">
                Focus timer. {companionName} stays calm and focused with you while it runs.
              </p>
            </div>
          )}

          {/* 5. STUDIO CUSTOMIZER */}
          {activePanel === 'studio' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="nm" className="block text-xs font-semibold text-slate-600 mb-1">
                  Companion Name
                </label>
                <input
                  type="text"
                  id="nm"
                  value={companionName}
                  onChange={(e) => setCompanionName(e.target.value)}
                  maxLength={20}
                  className="w-full p-2.5 rounded-xl border border-purple-200/80 bg-white/80"
                />
              </div>

              <div>
                <label htmlFor="bc" className="block text-xs font-semibold text-slate-600 mb-1">
                  Companion Body Colour
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="bc"
                    value={companionBodyCol}
                    onChange={(e) => setCompanionBodyCol(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-purple-200"
                  />
                  <span className="text-xs text-slate-500 font-mono">{companionBodyCol}</span>
                </div>
              </div>

              <div>
                <label htmlFor="lg2" className="block text-xs font-semibold text-slate-600 mb-1">
                  Language (Voice & Recognition)
                </label>
                <select
                  id="lg2"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200/80 bg-white/80"
                >
                  <option value="en">English (US)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={speakOn}
                    onChange={(e) => setSpeakOn(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <span>Speak replies aloud with voice AI</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={reduceMotion}
                    onChange={(e) => setReduceMotion(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <span>Reduce motion</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={ambientAudioOn}
                    onChange={(e) => toggleAmbientSound(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <span>Ambient sound synthesizer</span>
                </label>
              </div>

              <p className="note pt-2">
                Microphone audio is analyzed live in your browser for mood and tone.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Floating Glass Transcript Drawer */}
      <div
        id="log"
        ref={transcriptRef}
        className={`transcript-drawer glass-surface ${isLogOpen ? 'open' : ''}`}
        aria-live="polite"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-200/60 font-bold text-sm">
          <span>Conversation History</span>
          <button onClick={() => setIsLogOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>


        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`transcript-msg ${msg.sender === 'user' ? 'user' : 'ai'}`}
          >
            <strong>{msg.sender === 'user' ? 'You' : companionName}:</strong> {msg.text}
          </div>
        ))}
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div
          id="toast"
          className="fixed top-20 left-1/2 -translate-x-1/2 py-2 px-5 rounded-full bg-slate-900/90 text-white text-xs font-semibold backdrop-blur-md shadow-xl z-50 animate-bounce"
          role="alert"
        >
          {toastMessage}
        </div>
      )}

      {/* Edit Character Modal */}
      {isEditModalOpen && character && (
        <CharacterFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialCharacter={character}
          onSubmit={async (data) => {
            if (characterId) {
              await updateCharacter(characterId, data);
              setCompanionName(data.name);
            }
          }}
        />
      )}

      {/* Gemini API Key Configuration Modal */}
      {apiKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔑</span>
                <h3 className="text-lg font-bold text-slate-900">Gemini API Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setApiKeyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Enter your Google Gemini API key to power your companion's empathetic responses. Your companion acts strictly as your loving best friend and will gently refuse academic research, Wikipedia dissertations, and search queries.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Gemini API Key
              </label>
              <input
                type="password"
                className="w-full px-3 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 text-xs font-mono outline-none"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Keys can also be placed in <code>server/.env</code> as <code>GEMINI_API_KEY=...</code>
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('gemini_api_key');
                    setApiKeyInput('');
                    showToast('Gemini API Key removed.');
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50"
                >
                  Clear Key
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const trimmed = apiKeyInput.trim();
                  if (trimmed) {
                    localStorage.setItem('gemini_api_key', trimmed);
                    showToast('Gemini API Key saved successfully! ✨');
                  } else {
                    localStorage.removeItem('gemini_api_key');
                    showToast('Key cleared.');
                  }
                  setApiKeyModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
