import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
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
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      }
    };
});
