import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { brasil: {
      verde:"#009C3B", campo:"#0B8F3A", amarelo:"#FFDF00", azul:"#002776",
      azulEscuro:"#001550", fundo:"#F0F4F8", texto:"#0D1B2A", suave:"#64748B"
    }},
    fontFamily: {
      display:["var(--font-bebas)","sans-serif"],
      sans:["var(--font-barlow)","sans-serif"]
    }
  }},
  plugins: []
};
export default config;