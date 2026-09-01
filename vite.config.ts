import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The site is served from https://<user>.github.io/Learn-Network-Subnetting/
// Override with BASE_PATH=/ when serving from a custom domain or the root.
const base = process.env.BASE_PATH ?? '/Learn-Network-Subnetting/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Keep the WebGL stack in its own chunk so text-only pages stay light.
          if (id.includes('node_modules/three') || id.includes('@react-three')) return 'three'
          return undefined
        },
      },
    },
  },
})
