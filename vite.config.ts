import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'node:path'

// THE BASE IS THE MOUNT POINT, and it must match what easyagent-ext-ui-host serves. A bundle built for
// another base is every asset 404ing, which a browser reports as a blank panel with nothing in the log
// naming the file.
export default defineConfig({
  base: '/ext/sandbox/',
  plugins: [svelte()],
  resolve: { alias: { $lib: path.resolve('./src/lib') } },
  build: { target: 'es2022', sourcemap: false },
})
