import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@features": path.resolve(__dirname, "src/features"),
      "@components": path.resolve(__dirname, "src/components"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@api": path.resolve(__dirname, "src/api"),
      "@context": path.resolve(__dirname, "src/context"),
    }
  }
})
