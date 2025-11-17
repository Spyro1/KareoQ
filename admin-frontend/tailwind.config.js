module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"]
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(12%, -6%, 0) scale(1.05)' },
          '66%': { transform: 'translate3d(-10%, 10%, 0) scale(0.95)' }
        },
        'glow-pulse-strong': {
          '0%, 100%': { opacity: 0.35 },
          '25%': { opacity: 0.95 },
          '55%': { opacity: 0.28 },
          '70%': { opacity: 0.82 }
        },
        'glow-drift-a': {
          '0%': { transform: 'translate3d(-8%, -4%, 0) scale(0.85)', opacity: 0.3 },
          '20%': { transform: 'translate3d(14%, -10%, 0) scale(1.1)', opacity: 0.78 },
          '50%': { transform: 'translate3d(10%, 16%, 0) scale(0.8)', opacity: 0.26 },
          '75%': { transform: 'translate3d(-18%, 10%, 0) scale(1.22)', opacity: 0.88 },
          '100%': { transform: 'translate3d(-8%, -4%, 0) scale(0.85)', opacity: 0.3 }
        },
        'glow-drift-b': {
          '0%': { transform: 'translate3d(12%, 12%, 0) scale(0.9)', opacity: 0.28 },
          '18%': { transform: 'translate3d(-12%, 6%, 0) scale(1.08)', opacity: 0.74 },
          '45%': { transform: 'translate3d(20%, -16%, 0) scale(0.78)', opacity: 0.24 },
          '68%': { transform: 'translate3d(-10%, -4%, 0) scale(1.18)', opacity: 0.86 },
          '100%': { transform: 'translate3d(12%, 12%, 0) scale(0.9)', opacity: 0.28 }
        },
        'glow-drift-c': {
          '0%': { transform: 'translate3d(-16%, 10%, 0) scale(0.82)', opacity: 0.24 },
          '22%': { transform: 'translate3d(14%, 2%, 0) scale(1.2)', opacity: 0.82 },
          '48%': { transform: 'translate3d(-6%, -14%, 0) scale(0.76)', opacity: 0.2 },
          '80%': { transform: 'translate3d(18%, -6%, 0) scale(1.3)', opacity: 0.9 },
          '100%': { transform: 'translate3d(-16%, 10%, 0) scale(0.82)', opacity: 0.24 }
        }
      },
      animation: {
        'blob-slow': 'blob 26s ease-in-out infinite',
        'blob-medium': 'blob 20s ease-in-out infinite',
        'blob-fast': 'blob 16s ease-in-out infinite',
        'glow-pulse-strong-slow': 'glow-pulse-strong 16s ease-in-out infinite',
        'glow-pulse-strong-fast': 'glow-pulse-strong 10s ease-in-out infinite reverse',
        'glow-drift-a': 'glow-drift-a 22s ease-in-out infinite',
        'glow-drift-b': 'glow-drift-b 18s ease-in-out infinite',
        'glow-drift-c': 'glow-drift-c 14s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
