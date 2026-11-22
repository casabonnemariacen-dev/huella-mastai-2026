import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Ruta base del sitio. Netlify: "/" (por defecto). GitHub Pages: el workflow
// define BASE_PATH=/huella-mastai-2026/.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
});
