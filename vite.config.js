import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false, // Prevents Vite from copying heavy icons and manifests into the build!
  esbuild: {
    drop: ['console', 'debugger'] // Drops console logs during the ESBuild transform phase
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'iife' // Required for Roadroller's eval to work without module syntax errors
      }
    },
    minify: 'terser',
    terserOptions: {
      ecma: 2020,
      toplevel: true, // Mangle top-level variable names
      mangle: {
        properties: {
          regex: /^_/ // Extremely safe: Mangles only private properties starting with an underscore!
        }
      },
      compress: {
        passes: 5, // Run the compressor 5 times
        unsafe: true,
        unsafe_math: true,
        unsafe_arrows: true,
        booleans_as_integers: true, // Replaces true/false with 1/0 everywhere
        drop_console: true // Strips out all console.logs to save space
      },
      format: { comments: false } // Drop any leftover legal/preserve comments
    },
    modulePreload: false
  }
});