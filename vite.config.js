import { defineConfig } from 'vite';

// app.js is a plain (non-module) script loaded at runtime by index.html.
// Keep it out of the dep optimizer / transform pipeline so it stays byte-identical.
export default defineConfig({
  root: '.',
  server: { port: 5173, strictPort: true },
  build: { target: 'es2020' },
  optimizeDeps: { include: ['three'] },
});
