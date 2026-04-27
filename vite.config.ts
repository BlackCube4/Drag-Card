import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'drag-card.ts',
      name: 'DragCard',
      formats: ['es'],
      fileName: () => `drag-card.js`
    },
    outDir: 'dist'
  }
});