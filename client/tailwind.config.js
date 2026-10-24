/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './preview.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        inaro: {
          bg: {
            primary: 'var(--bg-primary, #0a0d14)',
            secondary: 'var(--bg-secondary, #121826)',
            elevated: 'var(--bg-elevated, #1a2236)',
          },
          text: {
            primary: 'var(--text-primary, #f0f4fc)',
            secondary: 'var(--text-secondary, #94a3b8)',
            muted: 'var(--text-muted, #64748b)',
          },
          mood: {
            primary: 'var(--mood-primary, #0ea5e9)',
            glow: 'var(--mood-primary-glow, rgba(14, 165, 233, 0.25))',
          },
          border: {
            subtle: 'var(--border-subtle, rgba(255, 255, 255, 0.08))',
            prominent: 'var(--border-prominent, rgba(255, 255, 255, 0.16))',
          },
        },
        // Lovable Light Spectrum palette
        inaroBlue: '#3B82F6',
        inaroPurple: '#7C3AED',
        inaroViolet: '#8B5CF6',
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        sky: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'var(--font-family-sans)', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'Inter', 'sans-serif'],
        tamil: ['var(--font-family-tamil)', 'sans-serif'],
      },
      boxShadow: {
        'mood-glow': '0 8px 32px var(--mood-primary-glow, rgba(14, 165, 233, 0.25))',
      },
      animation: {
        'float': 'float 7s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'pop-in 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-14px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.25)' },
          '50%':       { boxShadow: '0 0 40px rgba(59, 130, 246, 0.45)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
