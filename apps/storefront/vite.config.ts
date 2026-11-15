import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
    return {
      server: {
        // Pinned: SITE_URL on the Convex deployment and the OAuth callback must match this
        // origin. strictPort fails loudly on a clash instead of drifting to another port.
        // 5183: outside the congested 3xxx default range (vite/next/other projects).
        port: 5183,
        strictPort: true,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        tsconfigPaths()
      ],
      build: {
        rollupOptions: {
          output: {
            // Vendor chunks change far less often than app code, so returning visitors keep
            // them cached across deploys.
            manualChunks: {
              react: ['react', 'react-dom', 'react-router-dom'],
              convex: ['convex/react', 'convex/browser', '@convex-dev/auth/react'],
              motion: ['framer-motion'],
              state: ['@reduxjs/toolkit', 'react-redux'],
            },
          },
        },
      },
    };
});
