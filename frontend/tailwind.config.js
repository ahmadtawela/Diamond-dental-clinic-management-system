/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F7F8F6",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#0F6E56",
          dark: "#0B5142",
          light: "#E1F5EE",
        },
        ink: {
          DEFAULT: "#1F2A24",
          secondary: "#5B6B63",
          muted: "#8A968F",
        },
        border: "#E4E7E2",
        danger: { DEFAULT: "#B3261E", light: "#FBEAEA" },
        warning: { DEFAULT: "#C77D22", light: "#FBF1E3" },
        success: { DEFAULT: "#2F7D4F", light: "#E9F5EE" },
        sidebar: {
          DEFAULT: "#0B211B",
          active: "#123A2F",
          text: "#CFE8DF",
          accent: "#35C79A",
        },
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "Noto Sans Arabic", "sans-serif"],
        sans: ["Inter", "Noto Sans Arabic", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};
