import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';

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
        allowedHosts: ['nafsaihub.vercel.app']
      },
      build: {
        // Enable minification and optimizations
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: isProduction,
            drop_debugger: isProduction,
            pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug', 'console.warn'] : []
          },
          mangle: true,
          output: {
            comments: false
          }
        },
        // Code splitting strategy - more aggressive
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Core vendor chunk
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                return 'react';
              }
              if (id.includes('node_modules/react-router')) {
                return 'react-router';
              }
              // Firebase chunk
              if (id.includes('node_modules/firebase/')) {
                return 'firebase';
              }
              // AI libraries
              if (id.includes('node_modules/@google/')) {
                return 'ai-libs';
              }
              // Animation libraries
              if (id.includes('node_modules/framer-motion/') || id.includes('node_modules/react-spring/')) {
                return 'animations';
              }
              // Lottie
              if (id.includes('node_modules/lottie-react/')) {
                return 'lottie';
              }
              // Charts
              if (id.includes('node_modules/recharts/')) {
                return 'recharts';
              }
              // Icons
              if (id.includes('node_modules/@heroicons/') || id.includes('node_modules/react-icons/')) {
                return 'icons';
              }
              // Heavy utilities
              if (id.includes('node_modules/html2canvas/') || id.includes('node_modules/jspdf/')) {
                return 'heavy-utils';
              }
              // Everything else in node_modules but not caught
              if (id.includes('node_modules/')) {
                return 'vendor';
              }
            },
            // Optimize chunk names
            chunkFileNames: 'assets/[name]-[hash:8].js',
            entryFileNames: 'assets/[name]-[hash:8].js',
            assetFileNames: 'assets/[name]-[hash:8][extname]'
          }
        },
        // Set chunk size warnings at higher threshold
        chunkSizeWarningLimit: 800,
        // Disable source maps to avoid encoding issues
        sourcemap: false,
        // Reduce output verbosity
        reportCompressedSize: false
      },
      base: '/',
      // Optimize dependency pre-bundling
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          'firebase/app',
          'firebase/auth',
          '@google/generative-ai',
          'framer-motion',
          'lucide-react'
        ]
      }
    };
});
