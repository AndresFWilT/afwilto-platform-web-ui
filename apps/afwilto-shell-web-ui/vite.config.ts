import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      federation({
        name: 'shell',
        remotes: {
          mfe_legacy: {
            type: 'module',
            name: 'mfe_legacy',
            entry: env.VITE_REMOTE_LEGACY_URL ?? 'http://localhost:3002/remoteEntry.js',
          },
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
    server: { port: 3000, strictPort: true },
    preview: { port: 3000, strictPort: true },
    build: { target: 'esnext' },
  }
})
