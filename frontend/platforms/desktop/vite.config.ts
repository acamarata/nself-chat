import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@/lib': path.resolve(__dirname, '../../src/lib'),
      '@/components': path.resolve(__dirname, '../../src/components'),
      '@/hooks': path.resolve(__dirname, '../../src/hooks'),
      '@/config': path.resolve(__dirname, '../../src/config'),
      '@/stores': path.resolve(__dirname, '../../src/stores'),
      '@/test-utils': path.resolve(__dirname, '../../src/test-utils'),
    },
  },
  server: {
    port: 5174,
    strictPort: false,
  },
})
