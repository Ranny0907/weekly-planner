import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/weekly-planner/', // GitHub Pages 需要设置仓库名作为 base
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,       // 端口号
  },
})

