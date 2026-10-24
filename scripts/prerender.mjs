// After `vite build`: gives every trip URL a real HTML file with its own link-preview tags,
// so iMessage/WhatsApp show the trip, and GitHub Pages answers 200 instead of the 404.html fallback.
// Trips added to the Worker after this build still work through 404.html; they get previews on the next site deploy.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const SITE = 'https://letsgohere.site';
const WORKER = 'https://letsgohere-worker.seanlyder.workers.dev'; // same as src/lib/api.js
const html = readFileSync('dist/index.html', 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const meta = (doc, { title, description, image, url }) =>
  doc
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(description)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(description)}`)
    .replace(/(<meta property="og:image" content=")[^"]*/, (m, a) => (image ? a + esc(image) : m))
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`);

let trips = [];
try {
  const res = await fetch(`${WORKER}/trips`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  trips = await res.json();
} catch (e) {
  console.warn(`prerender: could not load the trip list (${e.message}); trip pages fall back to 404.html`);
}

for (const t of trips) {
  const name = t.title.split(': ')[0];
  const page = meta(html, {
    title: `${name} · Let's Go Here`,
    description: [t.tagline, t.when].filter(Boolean).join(' · '),
    image: t.hero,
    url: `${SITE}/${t.id}/`,
  });
  for (const sub of ['', '/explore', '/search']) {
    mkdirSync(`dist/${t.id}${sub}`, { recursive: true });
    writeFileSync(`dist/${t.id}${sub}/index.html`, page);
  }
}
copyFileSync('dist/index.html', 'dist/404.html');
console.log(`prerendered ${trips.length} trip(s)`);
