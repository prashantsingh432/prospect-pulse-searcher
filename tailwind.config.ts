
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: '#f7f9fb',
        foreground: '#191c1e',
        primary: {
          DEFAULT: '#3525cd',
          foreground: '#ffffff'
        },
        secondary: {
          DEFAULT: '#58579b',
          foreground: '#ffffff'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        // LeadCurator Colors
        "primary-fixed": "#e2dfff",
        "surface-container-lowest": "#ffffff",
        "primary-fixed-dim": "#c3c0ff",
        "on-secondary-fixed": "#140f54",
        "error-container": "#ffdad6",
        "on-primary": "#ffffff",
        "on-secondary-container": "#454386",
        "surface-container-high": "#e6e8ea",
        "secondary-container": "#b6b4ff",
        "surface-dim": "#d8dadc",
        "on-tertiary-fixed-variant": "#7b2f00",
        "on-primary-fixed": "#0f0069",
        "outline": "#777587",
        "primary-container": "#4f46e5",
        "tertiary": "#7e3000",
        "on-tertiary-fixed": "#351000",
        "inverse-on-surface": "#eff1f3",
        "on-error": "#ffffff",
        "surface-bright": "#f7f9fb",
        "on-surface": "#191c1e",
        "on-surface-variant": "#464555",
        "surface-container-highest": "#e0e3e5",
        "on-background": "#191c1e",
        "surface-variant": "#e0e3e5",
        "tertiary-container": "#a44100",
        "on-secondary": "#ffffff",
        "surface-tint": "#4d44e3",
        "inverse-primary": "#c3c0ff",
        "surface-container-low": "#f2f4f6",
        "outline-variant": "#c7c4d8",
        "surface-container": "#eceef0",
        "on-tertiary-container": "#ffd2be",
        "error": "#ba1a1a",
        "on-error-container": "#93000a",
        "tertiary-fixed": "#ffdbcc",
        "on-primary-fixed-variant": "#3323cc",
        "surface": "#f7f9fb",
        "inverse-surface": "#2d3133",
        "tertiary-fixed-dim": "#ffb695",
        "secondary-fixed": "#e2dfff",
        "on-tertiary": "#ffffff",
        "secondary-fixed-dim": "#c3c0ff",
        "on-secondary-fixed-variant": "#413f82",
        "on-primary-container": "#dad7ff",
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '0.5rem',
        full: '0.75rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
