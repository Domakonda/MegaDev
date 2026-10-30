// Turns one prerendered page from build/ into a single HTML file: its CSS inlined, its scripts
// dropped. That is the page as the desk sees it, readable without the kb's build.
import fs from 'node:fs';
import path from 'node:path';

const [page, out] = process.argv.slice(2);
const file = path.join('build', page + '.html');
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/<link href="([^"]+)" rel="stylesheet">/g, (_, href) => {
  const css = fs.readFileSync(path.resolve(path.dirname(file), href), 'utf8');
  return `<style>${css}</style>`;
});
html = html.replace(/<link [^>]*rel="modulepreload"[^>]*>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`${out}: ${html.length} bytes`);
