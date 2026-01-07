/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark mode color palette for Sloth.app
        charcoal: {
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#888888",
          500: "#6d6d6d",
          600: "#5d5d5d",
          700: "#4f4f4f",
          800: "#454545",
          900: "#1a1a1a",
          950: "#0d0d0d",
        },
        // Muted teal accent color
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
      },
      backgroundColor: {
        app: "#0d0d0d",
        surface: "#1a1a1a",
        "surface-hover": "#252525",
      },
      textColor: {
        primary: "#ffffff",
        secondary: "#b0b0b0",
        muted: "#6d6d6d",
      },
      borderColor: {
        default: "#2a2a2a",
        hover: "#3a3a3a",
      },
    },
  },
  plugins: [],
};
