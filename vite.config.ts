import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    plugins: [splitVendorChunkPlugin()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    },

    build: {
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'ui-vendor': ['react-router-dom', 'framer-motion']
          }
        }
      },
      reportCompressedSize: false
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    },

    base: '/',

    server: {
      host: true,
      port: Number(process.env.PORT) || 3000
    },

    preview: {
      host: true,
      port: Number(process.env.PORT) || 3000,
      allowedHosts: ['nafsaihub.onrender.com']
    }
  };
});
