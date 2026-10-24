import React, { useEffect, useRef, useState } from 'react';
import { EmotionLabel } from '../../types/contracts';
import { MOOD_PROFILES, MoodVisualProfile } from './Avatar3D';
import { CuteMascot } from './CuteMascot';

interface Companion3DAvatarProps {
  emotion?: EmotionLabel;
  isSpeaking?: boolean;
  isThinking?: boolean;
  characterName?: string;
  onInteract?: () => void;
  className?: string;
}

export const Companion3DAvatar: React.FC<Companion3DAvatarProps> = ({
  emotion = 'calm',
  isSpeaking = false,
  isThinking = false,
  characterName = 'INARO',
  onInteract,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);

  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [isScriptReady, setIsScriptReady] = useState<boolean>(() => {
    return typeof window !== 'undefined' && !!(window as any).THREE;
  });

  // State refs to keep loop references up-to-date without recreating scene
  const emotionRef = useRef<EmotionLabel>(emotion);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const isThinkingRef = useRef<boolean>(isThinking);

  useEffect(() => {
    emotionRef.current = emotion;
  }, [emotion]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  // Ensure Three.js script is loaded if not already in window
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).THREE) {
      setIsScriptReady(true);
      return;
    }

    const scriptId = 'three-js-cdn-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => setIsScriptReady(true);
      script.onerror = () => setHasWebGL(false);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setIsScriptReady(true));
    }
  }, []);

  // Main Three.js Scene Lifecycle
  useEffect(() => {
    if (!isScriptReady || !canvasRef.current || !containerRef.current) return;
    const THREE = (window as any).THREE;
    if (!THREE) return;

    let renderer: any = null;
    let animFrameId: number;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Test WebGL support
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    } catch (err) {
      console.warn('WebGL not available in this environment. Falling back to SVG companion.', err);
      setHasWebGL(false);
      return;
    }

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

    // Dynamic Interpolation Targets
    const cur = {
      brow: 0,
      smile: 0.4,
      eye: 0.9,
      sp: 0.6,
      pa: 0.5,
      asym: 0,
      a: new THREE.Color(MOOD_PROFILES.calm.a),
      b: new THREE.Color(MOOD_PROFILES.calm.b),
      l: new THREE.Color('#ffffff'),
    };

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0xc9d6ff, 0.95);
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(3, 5, 5);
    scene.add(hemi, dir);

    // Floor Shadow & Ambient Disk
    const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const fl = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: isDark ? 0.12 : 0.45 })
    );
    fl.rotation.x = -Math.PI / 2;
    fl.position.y = -1.2;
    scene.add(fl);

    // Radial shadow disk texture
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    if (g) {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(80,60,150,0.4)');
      gr.addColorStop(1, 'rgba(80,60,150,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
    }
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.8),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = -1.19;
    scene.add(sh);

    // Helper builders
    const M = (c: any, r = 0.5) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
    const sph = (r: number, m: any, x = 1, y = 1, z = 1) => {
      const o = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), m);
      o.scale.set(x, y, z);
      return o;
    };

    // Character Group & Materials
    const bodyCol = '#8f7bff';
    const mat = M(bodyCol, 0.42);
    const lite = M(0xf6f2ff, 0.5);
    const pink = M(0xffb8d6, 0.7);
    const dk = M(0x231a38, 0.3);
    const wh = M(0xffffff, 0.2);

    const cr = new THREE.Group();
    scene.add(cr);

    // Body & Belly
    const body = sph(1, mat, 1.05, 1, 0.95);
    cr.add(body);

    const belly = sph(0.6, lite, 1, 1, 0.5);
    belly.position.set(0, -0.45, 0.55);
    cr.add(belly);

    const tail = sph(0.25, lite);
    tail.position.set(0, -0.6, -0.9);
    cr.add(tail);

    // Ears, Feet & Cheeks
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

    // Eyes with pupil lookAt tracking
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

    // Mouths: Resting Smile Arc & Speech Viseme Ellipse
    const mS = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.026, 8, 24, Math.PI), dk);
    mS.position.set(0, -0.1, 0.93);
    cr.add(mS);

    const mO = sph(0.11, M(0x7a2d5a, 0.4), 1, 1, 0.3);
    mO.position.set(0, -0.17, 0.92);
    mO.visible = false;
    cr.add(mO);

    // Floating Crystal Charms
    const fls: any[] = [];
    [[-2.7, 1.3, -1, 'ico'], [2.8, 0.7, -1.5, 'oct'], [-2.3, -0.2, -2, 'tor'], [2.4, 1.9, -2, 'dod']].forEach(
      ([x, y, z, k]: any, i) => {
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
      }
    );

    // Floating Particle Stars
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

    // Pointer Tracking
    let px = 0;
    let py = 0;
    let jump = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      py = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const v = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const rc = new THREE.Raycaster();
      rc.setFromCamera(v, cam);
      if (rc.intersectObject(body).length) {
        jump = 1;
        if (onInteract) onInteract();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);

    // Responsive Canvas Resizing strictly bounded to container
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 300;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.position.set(0, 1.1, 8.5 / Math.min(1, cam.aspect * 1.3));
      cam.lookAt(0, 0.1, 0);
      cam.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);
    handleResize();

    // Render & Animation Loop
    const clk = new THREE.Clock();
    let blink = 0;
    let nb = 2;
    const lerp = THREE.MathUtils.lerp;

    const tick = () => {
      animFrameId = requestAnimationFrame(tick);

      const dt = Math.min(clk.getDelta(), 0.05);
      const t = clk.elapsedTime;
      const activeEmotion = emotionRef.current;
      const targetMood: MoodVisualProfile = MOOD_PROFILES[activeEmotion] || MOOD_PROFILES.calm;

      // Interpolate emotional geometry properties
      const props: (keyof MoodVisualProfile)[] = ['brow', 'smile', 'eye', 'sp', 'pa', 'asym'];
      props.forEach((k) => {
        cur[k] = lerp(cur[k], targetMood[k] as number, 0.05);
      });
      cur.a.lerp(new THREE.Color(targetMood.a), 0.05);
      cur.b.lerp(new THREE.Color(targetMood.b), 0.05);
      cur.l.lerp(new THREE.Color(targetMood.l), 0.05);

      // Ambient container background
      if (bgRef.current) {
        bgRef.current.style.background = `radial-gradient(circle at 50% 38%, ${cur.a.getStyle()}, ${cur.b.getStyle()})`;
      }

      jump *= 0.92;
      hemi.color.copy(cur.l);
      dir.color.copy(cur.l);

      // Breathing & jumping motion
      cr.position.y = Math.abs(Math.sin(t * cur.sp * 2)) * 0.07 + jump * 0.5;
      cr.scale.set(
        1 + Math.sin(t * 1.6) * 0.015 - jump * 0.03,
        1 + Math.sin(t * 1.6) * 0.025 + jump * 0.05,
        1
      );

      // Character tilt
      const isSpeakingNow = isSpeakingRef.current;
      const isThinkingNow = isThinkingRef.current;
      const tilt = isThinkingNow
        ? Math.sin(t * 2) * 0.12
        : isSpeakingNow
        ? Math.sin(t * 3) * 0.06
        : Math.sin(t * 0.7) * 0.04;
      cr.rotation.z = lerp(cr.rotation.z, tilt, 0.08);
      cr.rotation.y = lerp(cr.rotation.y, px * 0.35, 0.06);
      cr.rotation.x = lerp(cr.rotation.x, -py * 0.12, 0.06);

      // Blinking Loop
      nb -= dt;
      if (nb < 0) {
        blink = 1;
        nb = 2 + Math.random() * 3.5;
      }
      blink = Math.max(0, blink - dt * 7);
      const open = cur.eye * (1 - Math.sin(blink * Math.PI) * 0.92) * (isThinkingNow ? 1.15 : 1);

      // Pupils lookAt tracking
      eyes.forEach((e: any) => {
        e.scale.y = Math.max(0.06, open);
        const lx = isThinkingNow ? 0.35 : px;
        const ly = isThinkingNow ? 0.45 : py;
        e.p.position.x = lerp(e.p.position.x, lx * 0.07, 0.1);
        e.p.position.y = lerp(e.p.position.y, ly * 0.07, 0.1);
      });

      // Eyebrow rotation & height
      brows.forEach((b: any, i: number) => {
        const s = i ? 1 : -1;
        b.rotation.z = s * cur.brow * -1 + (i ? cur.asym : 0);
        b.position.y = 0.58 + (i ? cur.asym * 0.3 : 0) + (cur.eye > 1.1 ? 0.06 : 0);
      });

      // Mouth Visemes: smile vs open speaking viseme
      const sm = cur.smile;
      mS.rotation.z = sm >= 0 ? Math.PI : 0;
      mS.scale.y = Math.max(0.15, Math.abs(sm));
      mS.position.y = sm >= 0 ? -0.04 : -0.2;

      mS.visible = !isSpeakingNow;
      mO.visible = isSpeakingNow;
      if (isSpeakingNow) {
        mO.scale.set(1, 0.2 + Math.abs(Math.sin(t * 11)) * 0.75, 0.3);
      }

      // Arm waving motion
      const wave = cur.sp > 1.4 || isSpeakingNow || activeEmotion === 'happy';
      arms[1].rotation.z = lerp(arms[1].rotation.z, wave ? Math.sin(t * 7) * 0.7 + 0.6 : 0, 0.15);
      arms[0].rotation.z = Math.sin(t * 1.4) * 0.06;

      // Floating Charms
      fls.forEach((m) => {
        m.rotation.x += dt * 0.4 * cur.sp;
        m.rotation.y += dt * 0.3;
        m.position.y = m.userData.y + Math.sin(t * 0.8 + m.userData.i) * 0.15;
      });

      // Particle Drift
      const pArr = pa;
      for (let i = 0; i < pArr.length; i += 3) {
        pArr[i + 1] += dt * 0.2 * cur.pa;
        if (pArr[i + 1] > 3.5) pArr[i + 1] = -1;
      }
      pts.geometry.attributes.position.needsUpdate = true;
      pts.material.opacity = 0.25 + 0.35 * Math.min(cur.pa, 1.5);

      cam.position.x = lerp(cam.position.x, px * 0.4, 0.05);
      cam.lookAt(0, 0.1, 0);

      renderer.render(scene, cam);
    };

    tick();

    // Clean up Three.js resources when component unmounts
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      resizeObserver.disconnect();

      try {
        renderer?.dispose();
        scene.clear();
      } catch (e) {
        // Safe disposal
      }
    };
  }, [isScriptReady, onInteract]);

  if (!hasWebGL) {
    return (
      <div className={`relative flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <CuteMascot onInteract={onInteract} />
        <p className="text-xs text-purple-700/80 font-medium mt-2">
          {characterName} is listening with you
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[220px] sm:min-h-[260px] overflow-hidden select-none cursor-pointer rounded-2xl ${className}`}
      title="Click or tap to interact with companion"
      role="region"
      aria-label={`${characterName} 3D Avatar`}
    >
      {/* Dynamic Ambient Gradient Background (Container-scoped, never fullscreen fixed) */}
      <div
        ref={bgRef}
        className="absolute inset-0 transition-all duration-700 pointer-events-none rounded-2xl opacity-90"
        style={{
          background: 'radial-gradient(circle at 50% 38%, #0ea5e9, #1e1b4b)',
        }}
      />

      {/* 3D WebGL Canvas (Scoped to container bounds) */}
      <canvas
        ref={canvasRef}
        className="relative z-10 w-full h-full block focus:outline-none"
        tabIndex={0}
        aria-label={`Interactive 3D animated companion ${characterName}`}
      />
    </div>
  );
};
