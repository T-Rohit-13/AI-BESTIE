/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
          }
        }
      },
      fontFamily: {
        sans: ['var(--font-family-sans)', 'sans-serif'],
        tamil: ['var(--font-family-tamil)', 'sans-serif'],
      },
      boxShadow: {
        'mood-glow': '0 8px 32px var(--mood-primary-glow, rgba(14, 165, 233, 0.25))',
      }
    },
  },
  plugins: [],
}
