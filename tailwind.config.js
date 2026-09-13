/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/react");
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkTheme: "class",
  plugins: [
    heroui({
      prefix: "heroui", // prefix for themes variables
      addCommonColors: false, // override common colors (e.g. "blue", "green", "pink").
      defaultTheme: "light", // default theme from the themes object
      defaultExtendTheme: "light", // default theme to extend on custom themes
      themes: {
        light: {
          colors: {
            primary: "#006898", // Negro
            secondary: "#000000", // Azul petróleo
            background: "#FFFFFF",
            foreground: "#1F2937",
             
          }, 
        },
        dark: {
          colors: {
            default: {
              50: "#0d0d0e",
              100: "#19191c",
              200: "#26262a",
              300: "#323238",
              400: "#3f3f46",
              500: "#65656b",
              600: "#8c8c90",
              700: "#b2b2b5",
              800: "#d9d9da",
              900: "#ffffff",
              foreground: "#fff",
              DEFAULT: "#3f3f46",
            },
            primary: {
              50: "#001f2e",
              100: "#003148",
              200: "#004463",
              300: "#00567d",
              400: "#006898",
              500: "#2d82aa",
              600: "#599dbc",
              700: "#86b7ce",
              800: "#b3d2e0",
              900: "#dfecf2",
              foreground: "#fff",
              DEFAULT: "#006898",
            },
            secondary: {
              50: "#021b4d",
              100: "#032a79",
              200: "#053aa6",
              300: "#0649d2",
              400: "#0759ff",
              500: "#3276ff",
              600: "#5e93ff",
              700: "#89b0ff",
              800: "#b5cdff",
              900: "#e0eaff",
              foreground: "#fff",
              DEFAULT: "#0759ff",
            },
            success: {
              50: "#073c1e",
              100: "#0b5f30",
              200: "#0f8341",
              300: "#13a653",
              400: "#17c964",
              500: "#40d27f",
              600: "#68dc9a",
              700: "#91e5b5",
              800: "#b9efd1",
              900: "#e2f8ec",
              foreground: "#000",
              DEFAULT: "#17c964",
            },
            warning: {
              50: "#4a320b",
              100: "#744e11",
              200: "#9f6b17",
              300: "#ca881e",
              400: "#f5a524",
              500: "#f7b54a",
              600: "#f9c571",
              700: "#fad497",
              800: "#fce4bd",
              900: "#fef4e4",
              foreground: "#000",
              DEFAULT: "#f5a524",
            },
            danger: {
              50: "#49051d",
              100: "#73092e",
              200: "#9e0c3e",
              300: "#c80f4f",
              400: "#f31260",
              500: "#f53b7c",
              600: "#f76598",
              700: "#f98eb3",
              800: "#fbb8cf",
              900: "#fee1eb",
              foreground: "#000",
              DEFAULT: "f31212",
            },
            background: "#000B17",
            foreground: "#ffffff",
            content1: {
              DEFAULT: "#020f1d",
              foreground: "#fff",
            },
            content2: {
              DEFAULT: "#121C27",
              foreground: "#fff",
            },
            content3: {
              DEFAULT: "#121C27",
              foreground: "#fff",
            },
            content4: {
              DEFAULT: "#121C27",
              foreground: "#fff",
            },
            focus: "#006FEE",
            overlay: "#ffffff",
          },
        },
      },
    }),
  ],
};
