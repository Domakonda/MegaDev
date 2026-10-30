import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';

// Build setup for viewing the kb outside the `support` repo: .svx pages through mdsvex, every
// page prerendered to static HTML in build/.
const runbook = fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url));

export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx'], layout: { runbook } })],
  kit: {
    adapter: adapter(),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['*', '/kb'] },
  },
};
