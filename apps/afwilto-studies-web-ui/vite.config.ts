import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'

// S08-12 (AC-F14): on `build:check` only, record which modules each chunk holds,
// outside dist/ so nothing about the module graph is ever served.
export const CHUNK_REPORT = path.resolve(__dirname, 'node_modules/.cache/studies-chunk-report.json')

function chunkModuleReport(): Plugin {
  return {
    name: 'studies-chunk-module-report',
    apply: 'build',
    generateBundle(_options, bundle) {
      if (!process.env['STUDIES_CHUNK_REPORT']) return
      const chunks = Object.values(bundle)
        .filter((out) => out.type === 'chunk')
        .map((c) => ({
          fileName: c.fileName,
          isEntry: c.isEntry,
          facadeModuleId: c.facadeModuleId,
          moduleIds: c.moduleIds,
          imports: c.imports,
          dynamicImports: c.dynamicImports,
        }))
      fs.mkdirSync(path.dirname(CHUNK_REPORT), { recursive: true })
      fs.writeFileSync(CHUNK_REPORT, JSON.stringify(chunks, null, 2))
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    chunkModuleReport(),
    tailwindcss(),
    federation({
      dts: false,
      name: 'studies',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
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
  server: { port: 3008, strictPort: true },
  preview: { port: 3008, strictPort: true },
  build: { target: 'esnext' },
})
