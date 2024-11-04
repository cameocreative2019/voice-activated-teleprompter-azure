import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"
import type { ProxyOptions, Connect } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    manifest: true,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: '/src/main.tsx'
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7071',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      bulma: resolve(__dirname, "node_modules/bulma/bulma.sass"),
    }
  }
})