import type { Config } from 'tailwindcss';

// The look (docs/handbook/ui/look.md): a cool charcoal base, frosted glass surfaces, soft white
// text, one accent that runs from blue to iris, and a warm tone kept for wins. Headings are medium weight, never bold.
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'sans-serif'],
      },
      colors: {
        base: '#0D0E12',
        ink: { DEFAULT: '#ECECEF', soft: '#B4BAC0', muted: '#8D969E', faint: '#7C7C85', off: '#55555C' },
        accent: { DEFAULT: '#6E74F0', glow: '#494FDF', soft: '#9599F5', iris: '#A78BF5' },
        win: { DEFAULT: '#E9B872', soft: '#F3D3A6' },
      },
      borderRadius: { card: '24px', pill: '9999px' },
      backdropBlur: { glass: '20px' },
    },
  },
  plugins: [],
} satisfies Config;
