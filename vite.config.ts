import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 8000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    target: "esnext",
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  css: {
    preprocessorOptions: {
      scss: {
        // https://sass-lang.com/documentation/breaking-changes/legacy-js-api/#silencing-warnings
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
  plugins: [
    UnoCSS(),
    react(),
    babel({
      presets: [reactCompilerPreset({ target: "18" })],
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    hmr: host
      ? {
          host,
          port: 1421,
          protocol: "ws",
        }
      : undefined,
    host: host || "127.0.0.1",
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri` and cargo build output
      //    （target 位于仓库根目录，Rust 编译时会锁定构建产物，监听会触发 EBUSY）
      ignored: ["**/src-tauri/**", "**/target/**"],
    },
  },
});
