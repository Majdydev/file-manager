import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: "electron/main.cjs",
      },
      {
        entry: "electron/preload.cjs",
        onstart(options) {
          options.startup();
        },
      },
    ]),
    renderer(),
  ],
  optimizeDeps: {
    include: ["better-sqlite3"],
  },
  build: {
    rollupOptions: {
      external: ["better-sqlite3"],
    },
  },
  resolve: {
    // Add .node extension for native modules
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json", ".node"],
  },
});
