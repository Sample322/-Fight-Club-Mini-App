import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    },
    // Разрешаем любые хосты для разработки
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok.io', 
      '.loca.lt',
      '.localtunnel.me',
      'localhost',
      '127.0.0.1'
    ]
  }
})