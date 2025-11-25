import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Keeping existing keyframes
        fadeOut: {
          from: { opacity: "1", transform: "translateY(0) translateZ(0)" },
          to: { opacity: "0", transform: "translateY(-10px) translateZ(0)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px) scale(0.95) translateZ(0)" },
          to: { opacity: "1", transform: "translateY(0) scale(1) translateZ(0)" },
        },
        fadeInDown: {
          from: { opacity: "0", transform: "translateY(-20px) translateZ(0)" },
          to: { opacity: "1", transform: "translateY(0) translateZ(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.9) translateZ(0)" },
          to: { opacity: "1", transform: "scale(1) translateZ(0)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-30px) translateZ(0)" },
          to: { opacity: "1", transform: "translateX(0) translateZ(0)" },
        },
        typing: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        blink: {
          "0%, 100%": { "border-right-color": "transparent" },
          "50%": { "border-right-color": "#4f46e5" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(30px) translateZ(0)" },
          to: { opacity: "1", transform: "translateY(0) translateZ(0)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0) translateZ(0)" },
          "25%": { transform: "translate(20px, -20px) translateZ(0)" },
          "50%": { transform: "translate(-10px, 10px) translateZ(0)" },
          "75%": { transform: "translate(15px, 5px) translateZ(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%) translateZ(0)" },
          "100%": { transform: "translateX(200%) translateZ(0)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1) translateZ(0)" },
          "50%": { opacity: "0.7", transform: "scale(1.1) translateZ(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1) translateZ(0)" },
          "50%": { opacity: "0.8", transform: "scale(1.05) translateZ(0)" },
        },
        slideInRight: {
          from: { transform: "translateX(400px) translateZ(0)", opacity: "0" },
          to: { transform: "translateX(0) translateZ(0)", opacity: "1" },
        },
        shrink: {
          from: { width: "100%" },
          to: { width: "0%" },
        },
        purpleShift: {
          "0%": { transform: "translate(0%, 0%) scale(1) rotate(0deg)" },
          "33%": { transform: "translate(5%, -3%) scale(1.05) rotate(3deg)" },
          "66%": { transform: "translate(-3%, 4%) scale(0.98) rotate(-2deg)" },
          "100%": { transform: "translate(0%, 0%) scale(1) rotate(0deg)" },
        },
        logoGlowBlue: {
          "0%, 100%": {
            filter: "drop-shadow(0 0 8px rgba(41, 121, 255, 0.4)) drop-shadow(0 0 16px rgba(41, 121, 255, 0.2)) drop-shadow(0 0 24px rgba(41, 121, 255, 0.1))"
          },
          "50%": {
            filter: "drop-shadow(0 0 12px rgba(41, 121, 255, 0.5)) drop-shadow(0 0 20px rgba(41, 121, 255, 0.3)) drop-shadow(0 0 32px rgba(41, 121, 255, 0.15))"
          }
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 8px rgba(41, 121, 255, 0.3), 0 0 16px rgba(41, 121, 255, 0.2)",
            filter: "drop-shadow(0 0 3px rgba(41, 121, 255, 0.3))"
          },
          "50%": {
            boxShadow: "0 0 12px rgba(41, 121, 255, 0.4), 0 0 24px rgba(41, 121, 255, 0.25)",
            filter: "drop-shadow(0 0 5px rgba(41, 121, 255, 0.4))"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-out": "fadeOut 0.3s cubic-bezier(0.0, 0, 0.2, 1) forwards",
        "fade-in": "fadeIn 0.4s cubic-bezier(0.0, 0, 0.2, 1) forwards",
        "fade-in-down": "fadeInDown 0.4s cubic-bezier(0.0, 0, 0.2, 1) forwards",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.0, 0, 0.2, 1) forwards",
        "slide-in-left": "slideInLeft 0.4s cubic-bezier(0.0, 0, 0.2, 1) forwards",
        "typing": "typing 2s steps(40, end) forwards",
        "slide-in-right": "slideInRight 0.35s cubic-bezier(0.0, 0, 0.2, 1)",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
