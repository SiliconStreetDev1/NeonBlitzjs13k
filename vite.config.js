import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false, // Prevents Vite from copying heavy icons and manifests into the build!
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      toplevel: true, // Mangle top-level variable names
      compress: {
        passes: 2,
        drop_console: true // Strips out all console.logs to save space
      }
    },
    modulePreload: false
  }
});