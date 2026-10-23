import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import { createQuietLogger } from '../../scripts/vite-quiet-logger.mjs'

export default defineConfig({
  customLogger: createQuietLogger(),
  clearScreen: false,
  plugins: [
    react(),
    federation({
      name: 'product_app',
      filename: 'remoteEntry.js',
      // 对外暴露的模块，主应用通过 product_app/App 引入
      exposes: {
        './App': './src/App.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
        antd: { singleton: true },
      },
    }),
  ],
  server: {
    port: 5001,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5001',
  },
  preview: {
    port: 5001,
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    modules: {
      generateScopedName: 'product_[local]_[hash:base64:5]',
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
    ...(process.argv.includes('--watch')
      ? { watch: { clearScreen: false } }
      : {}),
  },
})
