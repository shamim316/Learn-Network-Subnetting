import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The site is served from the custom domain in public/CNAME, so it lives at the
// root and asset URLs must not carry a repo-name prefix. Override with
// BASE_PATH=/Learn-Network-Subnetting/ to build for the bare github.io URL.
const base = process.env.BASE_PATH ?? '/'

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
