import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('react-dom') || id.includes('react/')) {
            return 'react-vendor'
          }

          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts-vendor'
          }

          if (id.includes('framer-motion') || id.includes('motion')) {
            return 'motion-vendor'
          }

          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'mui-vendor'
          }

          if (id.includes('@radix-ui')) {
            return 'radix-vendor'
          }

          if (id.includes('lucide-react')) {
            return 'icons-vendor'
          }

          return undefined
        },
      },
    },
  },
})
