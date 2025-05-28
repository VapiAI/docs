import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../assets",
    emptyOutDir: false,
    lib: {
      entry: "index.tsx",
      formats: ["iife"],
      name: "VapiVoiceAgentWidget",
      fileName: () => "widget.js",
    },
    rollupOptions: {
      external: [],
    },
  },
  define: {
    'process.env': {},
  },
}); 