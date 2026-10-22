import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      dts: false,
      name: 'cidr',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/app/App.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { port: 3009, strictPort: true },
  preview: { port: 3009, strictPort: true },
  build: { target: 'esnext' },
})
