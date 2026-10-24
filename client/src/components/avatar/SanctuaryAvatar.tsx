import React, { useEffect, useRef } from 'react';

export type SanctuaryMood = 'calm' | 'sad' | 'angry' | 'anxious' | 'happy' | 'neutral';

interface SanctuaryAvatarProps {
  mood: SanctuaryMood;
  isListening: boolean;
  isReleasing: boolean;
  intensity?: number;
}

interface ExpressionTarget {
  browTilt: number;     // -1 (sad tilt) to +1 (angry/furrowed)
  browHeight: number;   // 0 to 1
  eyeOpenness: number;  // 0.2 (sleepy/soft) to 1.0 (alert)
  smile: number;        // -0.6 (frown) to +0.8 (warm smile)
  mouthWidth: number;
  auraColor: string;
  glowColor: string;
  bodyColor: string;
}

const EXPRESSIONS: Record<SanctuaryMood, ExpressionTarget> = {
  calm: {
    browTilt: 0,
    browHeight: 0.5,
    eyeOpenness: 0.35,
    smile: 0.25,
    mouthWidth: 20,
    auraColor: 'rgba(168, 85, 247, 0.25)',
    glowColor: '#c084fc',
    bodyColor: '#e9d5ff',
  },
  sad: {
    browTilt: -0.6,
    browHeight: 0.7,
    eyeOpenness: 0.75,
    smile: -0.2,
    mouthWidth: 16,
    auraColor: 'rgba(96, 165, 250, 0.35)', // Soothing blue
    glowColor: '#60a5fa',
    bodyColor: '#dbeafe',
  },
  angry: {
    browTilt: 0.5,
    browHeight: 0.3,
    eyeOpenness: 0.85,
    smile: 0.1, // Calm steady presence to de-escalate
    mouthWidth: 22,
    auraColor: 'rgba(52, 211, 153, 0.35)', // Calming grounding emerald
    glowColor: '#34d399',
    bodyColor: '#d1fae5',
  },
  anxious: {
    browTilt: -0.3,
    browHeight: 0.8,
    eyeOpenness: 0.9,
    smile: 0.0,
    mouthWidth: 18,
    auraColor: 'rgba(45, 212, 191, 0.35)', // Reassuring teal
    glowColor: '#2dd4bf',
    bodyColor: '#ccfbf1',
  },
  happy: {
    browTilt: 0.1,
    browHeight: 0.6,
    eyeOpenness: 0.8,
    smile: 0.7,
    mouthWidth: 26,
    auraColor: 'rgba(251, 146, 60, 0.35)', // Warm radiant peach/gold
    glowColor: '#fb923c',
    bodyColor: '#ffedd5',
  },
  neutral: {
    browTilt: 0,
    browHeight: 0.5,
    eyeOpenness: 0.65,
    smile: 0.2,
    mouthWidth: 18,
    auraColor: 'rgba(192, 132, 252, 0.2)',
    glowColor: '#a855f7',
    bodyColor: '#f3e8ff',
  },
};

export const SanctuaryAvatar: React.FC<SanctuaryAvatarProps> = ({
  mood,
  isListening,
  isReleasing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Current interpolated state
  const curRef = useRef({
    browTilt: 0,
    browHeight: 0.5,
    eyeOpenness: 0.6,
    smile: 0.2,
    mouthWidth: 18,
    floatY: 0,
    breath: 0,
    blink: 0,
    releaseScale: 1,
    particles: [] as Array<{ x: number; y: number; vy: number; vx: number; alpha: number; size: number }>,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {}
    if (!ctx) return;

    let startTime = performance.now();
    let nextBlinkTime = startTime + 3000;

    const render = (time: number) => {
      const dt = (time - startTime) * 0.001;
      const target = EXPRESSIONS[mood] || EXPRESSIONS.neutral;
      const cur = curRef.current;

      // 1. Smooth interpolation toward target expression
      const lerp = 0.08;
      cur.browTilt += (target.browTilt - cur.browTilt) * lerp;
      cur.browHeight += (target.browHeight - cur.browHeight) * lerp;
      cur.eyeOpenness += (target.eyeOpenness - cur.eyeOpenness) * lerp;
      cur.smile += (target.smile - cur.smile) * lerp;
      cur.mouthWidth += (target.mouthWidth - cur.mouthWidth) * lerp;

      // 2. Autonomous Breathing & Floating motion
      const breathSpeed = isListening ? 2.5 : 1.2;
      cur.breath = Math.sin(time * 0.002 * breathSpeed);
      cur.floatY = Math.sin(time * 0.0015) * 6;

      // 3. Autonomous Blinking
      if (time > nextBlinkTime) {
        cur.blink = 1;
        nextBlinkTime = time + 2500 + Math.random() * 3500;
      }
      if (cur.blink > 0) {
        cur.blink = Math.max(0, cur.blink - 0.12);
      }

      // 4. Release Particle Effect
      if (isReleasing) {
        if (Math.random() < 0.4) {
          cur.particles.push({
            x: 120 + (Math.random() - 0.5) * 60,
            y: 120 + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -1.5 - Math.random() * 2,
            alpha: 1,
            size: 2 + Math.random() * 4,
          });
        }
      }

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + cur.floatY;

      // -------------------------------------------------------------
      // Dynamic Glowing Aura
      // -------------------------------------------------------------
      const auraRadius = 70 + (cur.breath * 4) + (isListening ? Math.sin(time * 0.01) * 8 : 0);
      const gradient = ctx.createRadialGradient(cx, cy, 30, cx, cy, auraRadius + 20);
      gradient.addColorStop(0, target.glowColor + (isListening ? '66' : '33'));
      gradient.addColorStop(0.7, target.auraColor);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, auraRadius + 20, 0, Math.PI * 2);
      ctx.fill();

      // -------------------------------------------------------------
      // Ethereal Avatar Head / Body Shape (Unique Soothing Droplet)
      // -------------------------------------------------------------
      ctx.save();
      ctx.translate(cx, cy);

      // Subtle scale pulsation on breath
      const scale = 1 + (cur.breath * 0.02) + (isListening ? 0.03 : 0);
      ctx.scale(scale, scale);

      // Soft gradient body
      const bodyGrad = ctx.createLinearGradient(0, -60, 0, 60);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.6, target.bodyColor);
      bodyGrad.addColorStop(1, target.glowColor + '88');

      ctx.fillStyle = bodyGrad;
      ctx.shadowColor = target.glowColor;
      ctx.shadowBlur = isListening ? 20 : 12;

      // Organic smooth teardrop / sanctuary orb contour
      ctx.beginPath();
      ctx.ellipse(0, 0, 56, 52, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0; // reset shadow

      // -------------------------------------------------------------
      // Expressive Eyebrows
      // -------------------------------------------------------------
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      const browY = -18 - (cur.browHeight * 6);
      const browOffset = cur.browTilt * 5;

      // Left Eyebrow
      ctx.beginPath();
      ctx.moveTo(-28, browY - browOffset);
      ctx.quadraticCurveTo(-18, browY - 2, -8, browY + browOffset);
      ctx.stroke();

      // Right Eyebrow
      ctx.beginPath();
      ctx.moveTo(8, browY + browOffset);
      ctx.quadraticCurveTo(18, browY - 2, 28, browY - browOffset);
      ctx.stroke();

      // -------------------------------------------------------------
      // Expressive Eyes with soft blink & empathetic gaze
      // -------------------------------------------------------------
      const blinkFactor = 1 - cur.blink;
      const eyeH = Math.max(1, 9 * cur.eyeOpenness * blinkFactor);
      const eyeW = 7;
      const eyeY = -4;

      // Left Eye
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(-18, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right Eye
      ctx.beginPath();
      ctx.ellipse(18, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye Highlights (Catchlights)
      if (eyeH > 3) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-20, eyeY - 2, 2.2, 0, Math.PI * 2);
        ctx.arc(16, eyeY - 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // -------------------------------------------------------------
      // Gentle Empathetic Cheeks (Blush)
      // -------------------------------------------------------------
      ctx.fillStyle = mood === 'sad' ? 'rgba(147, 197, 253, 0.35)' : 'rgba(244, 114, 182, 0.35)';
      ctx.beginPath();
      ctx.arc(-24, 8, 7, 0, Math.PI * 2);
      ctx.arc(24, 8, 7, 0, Math.PI * 2);
      ctx.fill();

      // -------------------------------------------------------------
      // Empathetic Mouth
      // -------------------------------------------------------------
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      const mouthY = 16;
      const mouthHalfW = cur.mouthWidth / 2;
      const mouthSmileOffset = cur.smile * 6;

      ctx.beginPath();
      ctx.moveTo(-mouthHalfW, mouthY - (cur.smile * 2));
      ctx.quadraticCurveTo(0, mouthY + mouthSmileOffset, mouthHalfW, mouthY - (cur.smile * 2));
      ctx.stroke();

      ctx.restore();

      // -------------------------------------------------------------
      // Floating Release Particles
      // -------------------------------------------------------------
      for (let i = cur.particles.length - 1; i >= 0; i--) {
        const p = cur.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.015;

        if (p.alpha <= 0) {
          cur.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(192, 132, 252, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [mood, isListening, isReleasing]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        width={240}
        height={220}
        className="w-[200px] h-[180px] sm:w-[240px] sm:h-[220px] transition-transform duration-500"
        aria-label={`Sanctuary spirit avatar listening attentively in a ${mood} state`}
      />
      {isListening && (
        <div className="mt-1 flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/90 text-purple-800 text-xs font-semibold shadow-xs animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>I'm listening closely... speak your heart</span>
        </div>
      )}
    </div>
  );
};
