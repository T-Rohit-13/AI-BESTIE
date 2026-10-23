/**
 * INARO — Auth & Identity UI Controller (Team Member 1 Scope)
 * Multi-Step Sign-Up & Sign-In Web Experience
 * Contract-aligned with docs/API_CONTRACTS.md
 */

// Application State
const AuthState = {
  currentScreen: 'landing',
  history: [],
  formData: {
    username: '',
    fullName: '',
    age: '',
    countryCode: '+91',
    mobileNumber: '',
    password: '',
    otpCode: ['', '', '', ''],
    trustedPersonName: '',
    trustedPersonMobile: '',
    locationPreference: 'allow', // 'allow' | 'manual'
    manualRegion: 'Tamil Nadu (National Helpline Fallback)',
    rememberMe: false
  },
  otpTimerSeconds: 45,
  otpTimerInterval: null,
  otpVerified: false
};

// DOM Cache Utility
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/* ==========================================================================
   Screen Navigation & Transition Controller
   ========================================================================== */
function navigateToScreen(screenId, pushHistory = true) {
  const screens = $$('.screen-view');
  const targetScreen = $(`#screen-${screenId}`);

  if (!targetScreen) {
    console.warn(`Screen with ID "screen-${screenId}" not found.`);
    return;
  }

  if (pushHistory && AuthState.currentScreen && AuthState.currentScreen !== screenId) {
    AuthState.history.push(AuthState.currentScreen);
  }

  screens.forEach((screen) => {
    screen.classList.remove('active');
  });

  targetScreen.classList.add('active');
  AuthState.currentScreen = screenId;

  // Screen-specific hooks
  onScreenEntered(screenId);
}

function navigateBack() {
  if (AuthState.history.length > 0) {
    const prevScreen = AuthState.history.pop();
    navigateToScreen(prevScreen, false);
  } else {
    navigateToScreen('landing', false);
  }
}

function onScreenEntered(screenId) {
  // Update avatar mood based on current screen
  if (window.CompanionAvatar) {
    if (screenId === 'success') {
      window.CompanionAvatar.setMood('excited');
      window.CompanionAvatar.triggerJump();
      triggerConfetti();
    } else if (screenId === 'verify-otp') {
      window.CompanionAvatar.setMood('neutral');
    } else if (screenId === 'trusted-setup') {
      window.CompanionAvatar.setMood('calm');
    } else {
      window.CompanionAvatar.setMood('neutral');
    }
  }

  if (screenId === 'verify-otp') {
    startOtpCountdown();
    // Focus first OTP field
    setTimeout(() => {
      const firstOtp = $('#otp-0');
      if (firstOtp) firstOtp.focus();
    }, 150);
  }

  if (screenId === 'success') {
    const userNameSpan = $('#success-user-name');
    if (userNameSpan) {
      userNameSpan.textContent = AuthState.formData.fullName || AuthState.formData.username || 'Friend';
    }
  }
}

/* ==========================================================================
   Live Validation Handlers (Username, Age, Phone)
   ========================================================================== */
function initValidationHandlers() {
  const usernameInput = $('#signup-username');
  const usernameFeedback = $('#username-feedback');

  if (usernameInput) {
    let debounceTimer;
    usernameInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value.trim();
      AuthState.formData.username = val;

      if (!val) {
        usernameFeedback.innerHTML = '';
        return;
      }

      if (val.length < 3) {
        usernameFeedback.innerHTML = `<span class="feedback-error">Username must be at least 3 characters</span>`;
        return;
      }

      const regex = /^[a-zA-Z0-9_]+$/;
      if (!regex.test(val)) {
        usernameFeedback.innerHTML = `<span class="feedback-error">Only letters, numbers, and underscores allowed</span>`;
        return;
      }

      usernameFeedback.innerHTML = `<span class="feedback-muted">Checking availability…</span>`;

      debounceTimer = setTimeout(() => {
        // Simulated contract check: username availability
        const reservedUsers = ['admin', 'inaro', 'root', 'support'];
        if (reservedUsers.includes(val.toLowerCase())) {
          usernameFeedback.innerHTML = `<span class="feedback-error">✗ Username is taken. Try another.</span>`;
        } else {
          usernameFeedback.innerHTML = `<span class="feedback-success">✓ Username is available!</span>`;
        }
      }, 350);
    });
  }

  const nameInput = $('#signup-name');
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      AuthState.formData.fullName = e.target.value.trim();
    });
  }

  const ageInput = $('#signup-age');
  const ageFeedback = $('#age-feedback');
  if (ageInput) {
    ageInput.addEventListener('input', (e) => {
      const age = parseInt(e.target.value, 10);
      AuthState.formData.age = isNaN(age) ? '' : age;

      if (e.target.value && (isNaN(age) || age < 13)) {
        ageFeedback.innerHTML = `<span class="feedback-error">Must be 13 or older to join INARO</span>`;
      } else if (age > 120) {
        ageFeedback.innerHTML = `<span class="feedback-error">Please enter a valid age</span>`;
      } else {
        ageFeedback.innerHTML = '';
      }
    });
  }

  const phoneInput = $('#signup-phone');
  const sendOtpBtn = $('#send-otp-btn');
  const countryCodeSelect = $('#signup-country-code');

  if (countryCodeSelect) {
    countryCodeSelect.addEventListener('change', (e) => {
      AuthState.formData.countryCode = e.target.value;
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      // Numerical filter
      let cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
      e.target.value = cleaned;
      AuthState.formData.mobileNumber = cleaned;

      if (sendOtpBtn) {
        sendOtpBtn.disabled = cleaned.length !== 10;
      }
    });
  }

  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', () => {
      if (AuthState.formData.mobileNumber.length === 10) {
        triggerSendOtp();
      }
    });
  }
}

/* ==========================================================================
   OTP Generation & Verification Logic
   ========================================================================== */
function triggerSendOtp() {
  const fullPhone = `${AuthState.formData.countryCode} ${AuthState.formData.mobileNumber}`;
  const displayTarget = $('#otp-target-number');
  if (displayTarget) {
    displayTarget.textContent = fullPhone;
  }

  showToast(`Verification OTP dispatched to ${fullPhone}! (Mock: 1234)`);
  navigateToScreen('verify-otp');
}

function startOtpCountdown() {
  clearInterval(AuthState.otpTimerInterval);
  AuthState.otpTimerSeconds = 45;
  updateTimerUI();

  const resendBtn = $('#resend-otp-btn');
  if (resendBtn) resendBtn.disabled = true;

  AuthState.otpTimerInterval = setInterval(() => {
    AuthState.otpTimerSeconds--;
    updateTimerUI();

    if (AuthState.otpTimerSeconds <= 0) {
      clearInterval(AuthState.otpTimerInterval);
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend OTP';
      }
    }
  }, 1000);
}

function updateTimerUI() {
  const timerDisplay = $('#otp-timer-display');
  if (timerDisplay) {
    const mins = Math.floor(AuthState.otpTimerSeconds / 60);
    const secs = AuthState.otpTimerSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

function initOtpInputs() {
  const otpFields = $$('.otp-field');
  const verifyContinueBtn = $('#verify-otp-continue-btn');
  const otpVerifiedBanner = $('#otp-verified-banner');

  otpFields.forEach((field, index) => {
    field.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      field.value = val ? val[0] : '';
      AuthState.formData.otpCode[index] = field.value;

      if (field.value) {
        field.classList.add('filled');
        // Auto-advance to next box
        if (index < otpFields.length - 1) {
          otpFields[index + 1].focus();
        }
      } else {
        field.classList.remove('filled');
      }

      checkOtpCompletion();
    });

    field.addEventListener('keydown', (e) => {
      // Backspace handling
      if (e.key === 'Backspace' && !field.value && index > 0) {
        otpFields[index - 1].focus();
      }
    });

    // Paste handling
    field.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text');
      const numericChars = pasteData.replace(/\D/g, '').slice(0, 4);

      if (numericChars) {
        numericChars.split('').forEach((char, i) => {
          if (otpFields[i]) {
            otpFields[i].value = char;
            otpFields[i].classList.add('filled');
            AuthState.formData.otpCode[i] = char;
          }
        });

        const focusTarget = Math.min(numericChars.length, otpFields.length - 1);
        otpFields[focusTarget].focus();
        checkOtpCompletion();
      }
    });
  });

  function checkOtpCompletion() {
    const code = AuthState.formData.otpCode.join('');
    if (code.length === 4) {
      // Simulated OTP verification
      // Any 4 digits are accepted in dev mode or mock 1234
      AuthState.otpVerified = true;
      if (otpVerifiedBanner) otpVerifiedBanner.classList.add('visible');
      if (verifyContinueBtn) verifyContinueBtn.disabled = false;
      if (window.CompanionAvatar) {
        window.CompanionAvatar.setMood('happy');
        window.CompanionAvatar.triggerJump();
      }
    } else {
      AuthState.otpVerified = false;
      if (otpVerifiedBanner) otpVerifiedBanner.classList.remove('visible');
      if (verifyContinueBtn) verifyContinueBtn.disabled = true;
    }
  }

  const resendBtn = $('#resend-otp-btn');
  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      if (!resendBtn.disabled) {
        otpFields.forEach((f) => {
          f.value = '';
          f.classList.remove('filled');
        });
        AuthState.formData.otpCode = ['', '', '', ''];
        checkOtpCompletion();
        startOtpCountdown();
        showToast('Fresh OTP dispatched to your mobile number!');
        otpFields[0].focus();
      }
    });
  }

  if (verifyContinueBtn) {
    verifyContinueBtn.addEventListener('click', () => {
      if (AuthState.otpVerified) {
        navigateToScreen('trusted-setup');
      }
    });
  }
}

/* ==========================================================================
   Trusted Contact & Helpline Location Setup
   ========================================================================== */
function initTrustedSetup() {
  const allowLocBtn = $('#loc-allow-btn');
  const manualLocBtn = $('#loc-manual-btn');
  const manualDropdown = $('#manual-region-dropdown');

  if (allowLocBtn && manualLocBtn) {
    allowLocBtn.addEventListener('click', () => {
      allowLocBtn.classList.add('active');
      manualLocBtn.classList.remove('active');
      AuthState.formData.locationPreference = 'allow';
      if (manualDropdown) manualDropdown.style.display = 'none';

      // Ask for browser geolocation if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => showToast('Location permission enabled for crisis helplines!'),
          () => showToast('Location defaulted to National Support Helpline.')
        );
      }
    });

    manualLocBtn.addEventListener('click', () => {
      manualLocBtn.classList.add('active');
      allowLocBtn.classList.remove('active');
      AuthState.formData.locationPreference = 'manual';
      if (manualDropdown) manualDropdown.style.display = 'block';
    });
  }

  const trustedPhone = $('#trusted-phone');
  if (trustedPhone) {
    trustedPhone.addEventListener('input', (e) => {
      AuthState.formData.trustedPersonMobile = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
  }

  const trustedName = $('#trusted-name');
  if (trustedName) {
    trustedName.addEventListener('input', (e) => {
      AuthState.formData.trustedPersonName = e.target.value.trim();
    });
  }

  const finishSetupBtn = $('#finish-setup-btn');
  const skipSetupBtn = $('#skip-setup-btn');

  if (finishSetupBtn) {
    finishSetupBtn.addEventListener('click', () => {
      completeRegistration();
    });
  }

  if (skipSetupBtn) {
    skipSetupBtn.addEventListener('click', () => {
      completeRegistration();
    });
  }
}

function completeRegistration() {
  // Conforms with docs/API_CONTRACTS.md: Account registered & verified
  showToast('Account setup completed successfully!');
  navigateToScreen('success');
}

/* ==========================================================================
   Sign-In, Password Visibility & Forgot Password Flow
   ========================================================================== */
function initSignInHandlers() {
  const togglePassBtn = $('#toggle-password-visibility');
  const passInput = $('#signin-password');

  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePassBtn.innerHTML = isPass ? `👁️` : `🙈`;
      togglePassBtn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
    });
  }

  const signinForm = $('#signin-form');
  if (signinForm) {
    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const identifier = $('#signin-identifier').value.trim();
      const pass = passInput.value;

      if (!identifier || !pass) {
        showToast('Please enter both your identifier and password.');
        return;
      }

      // Successful simulated sign-in
      showToast(`Welcome back, ${identifier}!`);
      setTimeout(() => {
        AuthState.formData.fullName = identifier;
        navigateToScreen('success');
      }, 500);
    });
  }

  // Forgot password modal setup
  const forgotPassLink = $('#forgot-password-link');
  const forgotModal = $('#forgot-password-modal');
  const modalCloseBtn = $('#modal-close-btn');
  const forgotForm = $('#forgot-password-form');

  if (forgotPassLink && forgotModal) {
    forgotPassLink.addEventListener('click', (e) => {
      e.preventDefault();
      forgotModal.classList.add('active');
    });
  }

  if (modalCloseBtn && forgotModal) {
    modalCloseBtn.addEventListener('click', () => {
      forgotModal.classList.remove('active');
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const idVal = $('#forgot-identifier').value.trim();
      if (!idVal) return;

      // Contract Anti-Enumeration generic response:
      // "If an account matching that identifier exists, a verification code has been sent..."
      forgotModal.classList.remove('active');
      showToast('If an account exists, a reset code was dispatched to the registered number.');
    });
  }
}

/* ==========================================================================
   Toast Notification & Confetti Trigger
   ========================================================================== */
function showToast(message) {
  let toast = $('#toast-notice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span class="toast-success-icon">✦</span><span>${message}</span>`;
  toast.classList.add('visible');

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 4000);
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#7C3AED', '#8B5CF6', '#22C55E', '#F59E0B']
    });
  }
}

/* ==========================================================================
   3D AI Companion Avatar Engine (Three.js Live Companion)
   Directly derived from the approved INARO companion avatar specification
   Enriched Soft Lavender Shade & Dynamic Cursor-Tracking Physics
   ========================================================================== */
function init3DCompanionAvatar() {
  const canvas = $('#avatar3dCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const MOODS = {
    neutral: { a: '#f3e8ff', b: '#e9d5ff', l: '#ffffff', brow: 0, smile: 0.35, eye: 1, sp: 1, pa: 1, asym: 0 },
    happy: { a: '#fdf2f8', b: '#ede9fe', l: '#fff4e6', brow: -0.1, smile: 1, eye: 1, sp: 1.4, pa: 1.3, asym: 0 },
    excited: { a: '#fae8ff', b: '#e0e7ff', l: '#fff0dc', brow: -0.2, smile: 1, eye: 1.15, sp: 2.2, pa: 2, asym: 0 },
    calm: { a: '#ede9fe', b: '#ddd6fe', l: '#eeedff', brow: 0, smile: 0.5, eye: 0.8, sp: 0.6, pa: 0.5, asym: 0 },
    concerned: { a: '#f5f3ff', b: '#e2e8f0', l: '#e6ecfa', brow: 0.25, smile: -0.2, eye: 0.95, sp: 0.3, pa: 0.1, asym: 0 }
  };

  let currentMood = 'neutral';
  let bodyColor = '#c4b5fd'; // Soft luminous lavender shade
  let jump = 0;

  const cur = {
    brow: 0,
    smile: 0.35,
    eye: 1,
    sp: 1,
    pa: 1,
    asym: 0,
    a: new THREE.Color(MOODS.neutral.a),
    b: new THREE.Color(MOODS.neutral.b),
    l: new THREE.Color('#fff')
  };

  let renderer, scene, cam, C = null;
  const M = (c, r = 0.5) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const sph = (r, m, x = 1, y = 1, z = 1) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), m);
    o.scale.set(x, y, z);
    return o;
  };

  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(32, canvas.clientWidth / canvas.clientHeight, 0.1, 60);
    cam.position.set(0, 0.8, 6.5);
    cam.lookAt(0, 0.1, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xd8b4fe, 0.95);
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(3, 5, 5);
    scene.add(hemi, dir);

    // Floor shadow with lavender glow
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(168, 85, 247, 0.38)');
    gr.addColorStop(1, 'rgba(168, 85, 247, 0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);

    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = -1.19;
    scene.add(sh);

    // Avatar mesh group with luminous lavender tones
    const mat = M(bodyColor, 0.42);
    const lite = M(0xfaf5ff, 0.5); // Lavender-tinted cloud white
    const pink = M(0xf472b6, 0.7); // Cute pink blush
    const dk = M(0x2b2145, 0.3);
    const wh = M(0xffffff, 0.2);

    const cr = new THREE.Group();
    scene.add(cr);

    const body = sph(1, mat, 1.05, 1, 0.95);
    cr.add(body);

    const belly = sph(0.6, lite, 1, 1, 0.5);
    belly.position.set(0, -0.45, 0.55);
    cr.add(belly);

    const tail = sph(0.25, lite);
    tail.position.set(0, -0.6, -0.9);
    cr.add(tail);

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

    const arms = [-1, 1].map((s) => {
      const a = new THREE.Group();
      a.position.set(s * 1, -0.1, 0.2);
      const m = sph(0.22, mat, 0.8, 1.3, 0.8);
      m.position.y = -0.2;
      a.add(m);
      cr.add(a);
      return a;
    });

    const eyes = [-1, 1].map((s) => {
      const e = new THREE.Group();
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

    const brows = [-1, 1].map((s) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.06), dk);
      b.position.set(s * 0.4, 0.58, 0.72);
      b.rotation.x = -0.25;
      cr.add(b);
      return b;
    });

    const mS = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.026, 8, 24, Math.PI), dk);
    mS.position.set(0, -0.1, 0.93);
    cr.add(mS);

    // Floating gem nodes around avatar (soft lavender, pastel violet, sky blue)
    const fls = [];
    [
      [-2.2, 1.2, -1, 'ico'],
      [2.3, 0.8, -1.2, 'oct'],
      [-1.9, -0.3, -1.5, 'tor'],
      [2.0, 1.6, -1.5, 'dod']
    ].forEach(([x, y, z, k], i) => {
      const geo =
        k === 'ico'
          ? new THREE.IcosahedronGeometry(0.28)
          : k === 'oct'
          ? new THREE.OctahedronGeometry(0.28)
          : k === 'tor'
          ? new THREE.TorusGeometry(0.24, 0.08, 12, 24)
          : new THREE.DodecahedronGeometry(0.24);

      const m = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: [0xd8b4fe, 0xc4b5fd, 0xa5b4fc, 0xfbcfe8][i],
          roughness: 0.35,
          flatShading: true
        })
      );
      m.position.set(x, y, z);
      m.userData = { y, i, origX: x };
      scene.add(m);
      fls.push(m);
    });

    C = { cr, body, mat, eyes, brows, mS, arms, fls, hemi, dir };

    function onResize() {
      if (!canvas || !renderer) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }

    window.addEventListener('resize', onResize);
    onResize();

    // Mouse pointer interaction - Smooth Cursor Tracking
    let px = 0, py = 0;
    window.addEventListener('pointermove', (e) => {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = -((e.clientY / window.innerHeight) * 2 - 1);
    });

    canvas.addEventListener('pointerdown', () => {
      jump = 1;
      if (window.CompanionAvatar) {
        window.CompanionAvatar.triggerJump();
      }
    });

    // Render loop
    const clk = new THREE.Clock();
    let blink = 0, nb = 2.5;
    const lerp = THREE.MathUtils.lerp;

    function tick() {
      requestAnimationFrame(tick);
      const dt = Math.min(clk.getDelta(), 0.05);
      const t = clk.elapsedTime;
      const T = MOODS[currentMood] || MOODS.neutral;

      ['brow', 'smile', 'eye', 'sp', 'pa', 'asym'].forEach((k) => {
        cur[k] = lerp(cur[k], T[k], 0.06);
      });

      jump *= 0.92;

      if (C) {
        const { cr, eyes, brows, mS, arms, fls } = C;

        // The AI Robot physically moves smoothly according to the cursor
        const targetX = px * 0.72;
        const targetY = (py * 0.42) + Math.abs(Math.sin(t * cur.sp * 2)) * 0.07 + jump * 0.45;
        cr.position.x = lerp(cr.position.x, targetX, 0.075);
        cr.position.y = lerp(cr.position.y, targetY, 0.075);
        cr.position.z = lerp(cr.position.z, Math.sin(t * 1.5) * 0.08, 0.05);

        // Robot leans, turns, and tilts towards the cursor
        cr.rotation.y = lerp(cr.rotation.y, px * 0.75, 0.085);
        cr.rotation.x = lerp(cr.rotation.x, -py * 0.42, 0.085);
        cr.rotation.z = lerp(cr.rotation.z, -px * 0.22, 0.08);

        cr.scale.set(
          1 + Math.sin(t * 1.6) * 0.015 - jump * 0.03,
          1 + Math.sin(t * 1.6) * 0.025 + jump * 0.05,
          1
        );

        // Blinking cycle
        nb -= dt;
        if (nb < 0) {
          blink = 1;
          nb = 2 + Math.random() * 3.5;
        }
        blink = Math.max(0, blink - dt * 7);
        const open = cur.eye * (1 - Math.sin(blink * Math.PI) * 0.92);

        // Pupils track cursor attentively
        eyes.forEach((e) => {
          e.scale.y = Math.max(0.06, open);
          e.p.position.x = lerp(e.p.position.x, px * 0.12, 0.16);
          e.p.position.y = lerp(e.p.position.y, py * 0.12, 0.16);
        });

        brows.forEach((b, i) => {
          const s = i ? 1 : -1;
          b.rotation.z = s * cur.brow * -1 + (i ? cur.asym : 0);
          b.position.y = 0.58 + (i ? cur.asym * 0.3 : 0);
        });

        const sm = cur.smile;
        mS.rotation.z = sm >= 0 ? Math.PI : 0;
        mS.scale.y = Math.max(0.15, Math.abs(sm));
        mS.position.y = sm >= 0 ? -0.04 : -0.2;

        // Arms gesture according to cursor position and mood
        const wave = currentMood === 'happy' || currentMood === 'excited';
        arms[1].rotation.z = lerp(arms[1].rotation.z, (px > 0.15 ? 0.45 : 0) + (wave ? Math.sin(t * 7) * 0.6 + 0.5 : 0), 0.12);
        arms[0].rotation.z = lerp(arms[0].rotation.z, (px < -0.15 ? -0.45 : 0) + Math.sin(t * 1.4) * 0.06, 0.12);

        // Camera perspective tracking
        cam.position.x = lerp(cam.position.x, px * 0.45, 0.05);
        cam.position.y = lerp(cam.position.y, 0.8 + py * 0.25, 0.05);
        cam.lookAt(cr.position.x * 0.3, 0.1 + cr.position.y * 0.3, 0);

        // Floating crystals orbit and sway towards cursor
        fls.forEach((m) => {
          m.rotation.x += dt * 0.4 * cur.sp;
          m.rotation.y += dt * 0.3;
          m.position.y = m.userData.y + Math.sin(t * 0.8 + m.userData.i) * 0.12;
          m.position.x += ((m.userData.origX + px * 0.35) - m.position.x) * 0.04;
        });

        renderer.render(scene, cam);
      }
    }

    tick();

    // Export companion interface globally
    window.CompanionAvatar = {
      setMood: (m) => {
        if (MOODS[m]) currentMood = m;
      },
      triggerJump: () => {
        jump = 1;
      }
    };
  } catch (err) {
    console.warn('Three.js initialization skipped or not supported:', err);
  }
}

/* ==========================================================================
   Master Initializer
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Navigation event delegations
  $$('[data-navigate]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-navigate');
      navigateToScreen(target);
    });
  });

  $$('[data-nav-back]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateBack();
    });
  });

  // Sign-Up Continue button
  const signupContinueBtn = $('#signup-continue-btn');
  if (signupContinueBtn) {
    signupContinueBtn.addEventListener('click', () => {
      const u = AuthState.formData.username;
      const n = AuthState.formData.fullName;
      const a = AuthState.formData.age;
      const p = AuthState.formData.mobileNumber;

      if (!u || u.length < 3) {
        showToast('Please choose a valid username (at least 3 characters).');
        $('#signup-username').focus();
        return;
      }
      if (!n) {
        showToast('Please enter your full name.');
        $('#signup-name').focus();
        return;
      }
      if (!a || a < 13) {
        showToast('You must be 13 or older to join INARO.');
        $('#signup-age').focus();
        return;
      }
      if (!p || p.length !== 10) {
        showToast('Please enter your 10-digit mobile number.');
        $('#signup-phone').focus();
        return;
      }

      triggerSendOtp();
    });
  }

  // Initialize sub-modules
  initValidationHandlers();
  initOtpInputs();
  initTrustedSetup();
  initSignInHandlers();
  init3DCompanionAvatar();
});
