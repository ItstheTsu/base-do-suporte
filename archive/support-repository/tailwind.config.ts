import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#e6edf3',
        'secondary': '#8b98a5',
        'muted': '#5b6675',
        'background': '#0b0f14',
        'surface': '#121821',
        'surface-alt': '#0f141b',
        'border': '#1f2733',
        'accent': '#5eead4',
        'danger': '#f87171',
        'warning': '#fbbf24',
        'success': '#34d399',
      },
      fontFamily: {
        'sans': ['"Poppins"', 'system-ui', 'sans-serif'],
        'mono': ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      backgroundColor: {
        'dark': '#0b0f14',
        'surface': '#121821',
        'surface-alt': '#0f141b',
      },
      borderColor: {
        'dark': '#1f2733',
      },
      textColor: {
        'primary': '#e6edf3',
        'secondary': '#8b98a5',
        'muted': '#5b6675',
      },
    },
  },
  plugins: [],
}

export default config
