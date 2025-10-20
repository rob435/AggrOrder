import { defineConfig } from 'vite'

// Vanilla JS config - no React, no Tailwind processing
export default defineConfig({
  root: './',
  build: {
    outDir: 'dist-vanilla',
    rollupOptions: {
      input: {
        main: './vanilla.html'
      }
    },
    minify: 'esbuild',
    target: 'es2020',
  },
  server: {
    port: 5173,
    open: '/vanilla.html'
  },
  optimizeDeps: {
    exclude: ['react', 'react-dom', '@radix-ui/*', 'recharts'],
    entries: ['vanilla.html', 'src/vanilla/**/*.js']
  },
  resolve: {
    alias: {
      // Prevent @ imports from resolving (they're React only)
      '@': '/dev/null'
    }
  }
})
