import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: true,
        port: Number(process.env.PORT) || 3000,
      },
      preview: {
        host: true,
        port: Number(process.env.PORT) || 3000,
        allowedHosts: ['nafsaihub.onrender.com']
      },
      // base: 'https://nafsaihub.onrender.com/'
         base: 'https://nafs-ai-hub.vercel.app/'
    };
});
