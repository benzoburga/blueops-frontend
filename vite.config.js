import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

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
})
