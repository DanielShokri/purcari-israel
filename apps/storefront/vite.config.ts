import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        // Pinned: SITE_URL on the Convex deployment must match this origin,
        // and the OAuth callback lands on it. strictPort makes a port clash
        // fail loudly instead of silently drifting to another port (which
        // broke Google login: the ?code= redirect hit the wrong app).
        port: 3003,
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
