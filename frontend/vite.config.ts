import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), preact()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
