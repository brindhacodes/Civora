import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/ },
            { name: 'map-vendor', test: /node_modules[\\/](leaflet|react-leaflet|@react-leaflet)[\\/]/ },
            { name: 'icons-vendor', test: /node_modules[\\/]lucide-react[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    port: 5177,
  },
})
