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
        dts: false,
        name: 'shell',
        remotes: {
          mfe_legacy: {
            type: 'module',
            name: 'mfe_legacy',
            entry: env.VITE_REMOTE_LEGACY_URL ?? 'http://localhost:3007/remoteEntry.js',
          },
          afwilto_home: {
            type: 'module',
            name: 'afwilto_home',
            entry: env.VITE_REMOTE_AFWILTO_HOME_URL ?? 'http://localhost:3001/remoteEntry.js',
          },
          ud: {
            type: 'module',
            name: 'ud',
            entry: env.VITE_REMOTE_UD_URL ?? 'http://localhost:3003/remoteEntry.js',
          },
          slab_home: {
            type: 'module',
            name: 'slab_home',
            entry: env.VITE_REMOTE_SLAB_HOME_URL ?? 'http://localhost:3002/remoteEntry.js',
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
