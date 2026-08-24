import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './',
  server: {
    proxy: {
      '/proxy/melon': {
        target: 'https://www.melon.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/melon/, ''),
        headers: {
          'Referer': 'https://www.melon.com/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      },
      '/proxy/genie': {
        target: 'https://www.genie.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/genie/, ''),
        headers: {
          'Referer': 'https://www.genie.co.kr/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      },
      '/proxy/bugs': {
        target: 'https://music.bugs.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/bugs/, ''),
        headers: {
          'Referer': 'https://music.bugs.co.kr/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      }
    }
  }
})

