import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@afwilto/http-client': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
})
