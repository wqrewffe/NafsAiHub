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
            drop_debugger: isProduction
          },
          mangle: true,
          output: {
            comments: false
          }
        },
        // Code splitting strategy
        rollupOptions: {
          output: {
            manualChunks: {
              // Split vendor dependencies into separate chunks
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'firebase': ['firebase/app', 'firebase/auth', 'firebase/database', 'firebase/storage'],
              'ai-libs': ['@google/generative-ai', '@google/genai'],
              'ui-libs': ['framer-motion', 'lottie-react', 'react-hot-toast', 'recharts'],
              'icons': ['lucide-react', 'react-icons', '@heroicons/react']
            },
            // Optimize chunk names
            chunkFileNames: 'assets/[name]-[hash:8].js',
            entryFileNames: 'assets/[name]-[hash:8].js',
            assetFileNames: 'assets/[name]-[hash:8][extname]'
          }
        },
        // Set chunk size warnings at higher threshold
        chunkSizeWarningLimit: 500,
        // Disable source maps in production to avoid sourcemap errors
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
