import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Custom Vite Plugin to allow the browser editor to directly write
 * edited datasets back into src/data/songs.json and src/data/artists.json
 */
function filePersistencePlugin() {
  return {
    name: 'file-persistence-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/save-songs' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              const filePath = path.resolve(__dirname, 'src/data/songs.json')
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ 
                success: true, 
                count: data.length, 
                message: `총 ${data.length}곡이 src/data/songs.json에 직접 반영되었습니다!` 
              }))
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        if (req.url === '/api/save-artists' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              const filePath = path.resolve(__dirname, 'src/data/artists.json')
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ 
                success: true, 
                count: data.length, 
                message: `아티스트 정보가 src/data/artists.json에 직접 반영되었습니다!` 
              }))
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        if (req.url === '/api/save-recommended' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              const filePath = path.resolve(__dirname, 'src/data/recommendedPlaylist.json')
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ 
                success: true, 
                count: data.songs ? data.songs.length : 0, 
                message: `음총팀 추천 리스트가 src/data/recommendedPlaylist.json에 직접 반영되었습니다!` 
              }))
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    filePersistencePlugin()
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
