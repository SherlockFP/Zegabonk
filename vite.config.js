import { defineConfig } from 'vite';

// Plain static game — just serve the folder. No bundling, no transforms.
export default defineConfig({
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
