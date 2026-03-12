export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        prison: {
          bg: '#0a0a0a',
          surface: '#111111',
          border: '#222222',
          green: '#00ff41',
          red: '#ff3333',
          yellow: '#ffcc00',
          muted: '#555555',
          text: '#cccccc',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Courier New', 'monospace'],
      },
      animation: {
        'flicker': 'flicker 3s infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.8' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.6' },
          '97%': { opacity: '1' },
        },
      }
    }
  }
}
