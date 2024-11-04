import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"
import type { ProxyOptions, Connect } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7071',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy: Connect.Server, _options: ProxyOptions) => {
          proxy.on('error', (err: Error, _req: Connect.IncomingMessage, _res: Connect.ServerResponse) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq: Connect.IncomingMessage, req: Connect.IncomingMessage, _res: Connect.ServerResponse) => {
            console.log('Sending Request to:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes: Connect.IncomingMessage, req: Connect.IncomingMessage, _res: Connect.ServerResponse) => {
            console.log('Received Response from:', req.method, req.url, proxyRes.statusCode);
          });
        }
      },
    },
  },
  resolve: {
    alias: {
      bulma: resolve(__dirname, "node_modules/bulma/bulma.sass"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
})