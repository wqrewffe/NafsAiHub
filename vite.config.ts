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
        '@': path.resolve(__dirname, '.')
      }
    },

    base: '/',

    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssCodeSplit: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
      emptyOutDir: true,
      assetsInlineLimit: 8192,
      minifyInternalExports: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('@firebase')) return 'vendor-firebase';
              if (id.includes('@emotion') || id.includes('@mui')) return 'vendor-ui';
              return 'vendor';
            }
            if (id.includes('/hooks/')) return 'hooks';
            if (id.includes('/services/')) return 'services';
            if (id.includes('/components/')) return 'components';
            if (id.includes('/pages/')) return 'pages';
          }
        }
      }
    },

    optimizeDeps: {
      include: ['react', 'react-dom'],
      esbuildOptions: {
        target: 'esnext',
        supported: {
          'top-level-await': true
        },
        legalComments: 'none',
        minify: true,
        treeShaking: true
      }
    },

    esbuild: {
      target: 'esnext',
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      treeShaking: true,
      legalComments: 'none'
    },

    server: {
      host: true,
      port: Number(process.env.PORT) || 3000,
      hmr: {
        overlay: false
      },
      watch: {
        usePolling: false
      }
    },

    preview: {
      host: true,
      port: Number(process.env.PORT) || 3000,
      allowedHosts: [
        'nafs-ai-hub.vercel.app',
        'nafsaihub.onrender.com',
        'nafsaihub.vercel.app'
      ]
    }
  };
});
