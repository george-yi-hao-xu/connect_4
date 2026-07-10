import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 4444,
  },
  build: {
    outDir: 'dist-web',
  },
});
