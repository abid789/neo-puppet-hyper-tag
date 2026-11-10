import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@dimforge/rapier2d-compat'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          rapier: ['@dimforge/rapier2d-compat'],
          pixi: ['pixi.js'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
        },
      },
    },
  },
  server: {
    open: true,
  },
});
