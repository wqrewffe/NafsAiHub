// import path from 'path';
// import { defineConfig, loadEnv } from 'vite';

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, '.', '');

//   return {
//     define: {
//       'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
//       'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
//     },

//     resolve: {
//       alias: {
//         '@': path.resolve(__dirname, '.')
//       }
//     },

//     base: '/',

//     build: {
//       target: 'esnext',
//       minify: 'esbuild',
//       cssCodeSplit: true,
//       reportCompressedSize: false,
//       chunkSizeWarningLimit: 1000,
//       emptyOutDir: true,
//       assetsInlineLimit: 8192,
//       minifyInternalExports: true,
//       sourcemap: false,
//       rollupOptions: {
//         output: {
//           manualChunks(id) {
//             if (id.includes('node_modules')) {
//               if (id.includes('react')) return 'vendor-react';
//               return 'vendor';
//             }
//             if (id.includes('/hooks/') || id.includes('/services/')) {
//               return 'utils';
//             }
//           }
//         }
//       }
//     },

//     optimizeDeps: {
//       include: ['react', 'react-dom'],
//       esbuildOptions: {
//         target: 'esnext',
//         supported: {
//           'top-level-await': true
//         },
//         legalComments: 'none',
//         minify: true,
//         treeShaking: true
//       }
//     },

//     esbuild: {
//       target: 'esnext',
//       minifyIdentifiers: true,
//       minifySyntax: true,
//       minifyWhitespace: true,
//       treeShaking: true,
//       legalComments: 'none'
//     },

//     server: {
//       host: true,
//       port: Number(process.env.PORT) || 3000,
//       hmr: {
//         overlay: false
//       },
//       watch: {
//         usePolling: false
//       }
//     },

//     preview: {
//       host: true,
//       port: Number(process.env.PORT) || 3000,
//       allowedHosts: [
//         'nafs-ai-hub.vercel.app',
//         'nafsaihub.onrender.com',
//         'nafsaihub.vercel.app'
//       ]
//     }
//   };
// });
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
  // Allow both Vercel and Render preview hosts
  allowedHosts: ['nafsaihub.vercel.app']
      },
      // base: 'https://nafsaihub.onrender.com/'
   // Primary base used for production assets. Alternate deploy URL: https://nafsaihub.onrender.com/
   base: '/'
    };
});
