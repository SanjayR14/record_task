/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        record: {
          dark: '#121212',
          header: '#181818',
          pill: '#242424',
          orange: '#FF5723',
          orangeHover: '#F4511E',
          orangeLight: '#FFF2EE',
          bg: '#F8F6F1',
          card: '#FFFFFF',
          border: '#E8E5DD',
          textDark: '#1F1F1F',
          textMuted: '#717171',
          readAgain: '#888888',
          verifiedBlue: '#2563EB',
          badgeRed: '#EF4444',
          badgeRedBg: '#FEE2E2',
          badgeGreen: '#10B981',
          badgeGreenBg: '#D1FAE5'
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      screens: {
        'xs': '400px',
      }
    },
  },
  plugins: [],
};
