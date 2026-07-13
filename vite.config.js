import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Icon library — cached across versions, rarely changes
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide'
          }
          // React runtime — rarely changes, benefits from long-term cache
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react'
          }
          // Game data (buildings, events, dialogue, etc.) — large static
          // content tables that change less often than engine/UI code.
          if (id.includes('/src/data/')) {
            return 'game-data'
          }
        },
      },
    },
  },
})
