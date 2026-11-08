import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/@supabase')) return 'supabase';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler') || id.includes('node_modules/react-router')) return 'react';
        },
      },
    },
  },
  server: { port: 5173 },
});
