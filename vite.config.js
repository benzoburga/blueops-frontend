//vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@modulos': path.resolve(__dirname, './src/Modulos'),
      '@mocks': path.resolve(__dirname, './src/mocks'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  server: {
    host: true,           // 👈 expone en LAN (muestra URL "Network")
    port: 5173,           // 👈 usa 5173 (o el que prefieras)
    proxy: {
      '/api':   { target: 'http://localhost:4000', changeOrigin: true },
      '/files': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
