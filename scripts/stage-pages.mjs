import fs from 'node:fs';
import path from 'node:path';

// Publish only the static site, never source files, caches or dependencies.
const destination = path.join(process.env.RUNNER_TEMP || '/tmp', 'sosil-pages');
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
const directories = ['archive', 'assets', 'contact', 'gibberish', 'info', 'media', 'merch', 'news', 'notes', 'works'];
const files = fs.readdirSync('.').filter(name => /\.(html|xml|txt|svg|ico)$/.test(name) || ['.nojekyll', 'CNAME'].includes(name));
for (const name of [...directories, ...files]) fs.cpSync(name, path.join(destination, name), { recursive: true });
console.log('Staged static site for GitHub Pages.');
