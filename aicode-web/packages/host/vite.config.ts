import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import { createQuietLogger } from '../../scripts/vite-quiet-logger.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const productRemote =
    env.VITE_PRODUCT_REMOTE ||
    'http://localhost:5001/assets/remoteEntry.js'
  const userRemote =
    env.VITE_USER_REMOTE || 'http://localhost:5002/assets/remoteEntry.js'

  return {
    customLogger: createQuietLogger(),
    clearScreen: false,
    plugins: [
      react(),
      federation({
        name: 'host',
        remotes: {
          product_app: productRemote,
          user_app: userRemote,
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
          'react-router-dom': { singleton: true },
          antd: { singleton: true, requiredVersion: '5.22.5' },
        },
      }),
    ],
    server: {
      port: 5000,
      strictPort: true,
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8088',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 5000,
      strictPort: true,
      cors: true,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      modules: {
        generateScopedName: 'host_[local]_[hash:base64:5]',
      },
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
    build: {
      modulePreload: false,
      target: 'esnext',
      minify: false,
      cssCodeSplit: false,
      reportCompressedSize: false,
    },
  }
})
