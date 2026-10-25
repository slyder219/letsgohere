// Manual tool, never run by the build or deploy:
//   npm run images -- <input folder> <output folder>
// Converts every image in <input> (including subfolders) to WebP with the site's settings
// and writes it to <output> under the same name with a .webp extension. Inputs are never modified.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, extname, dirname, basename } from 'node:path';

const MAX_WIDTH = 1600; // sharp full-width on a 3x iPhone; larger images are scaled down, never up
const QUALITY = 78;
const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff']);

const [input, output] = process.argv.slice(2).map((p) => p && resolve(p));
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

if (!input || !output) fail('Usage: npm run images -- <input folder> <output folder>');
if (!existsSync(input) || !statSync(input).isDirectory()) fail(`Input folder not found: ${input}`);
if (output === input || output.startsWith(input + '/')) fail('Output folder must be outside the input folder, so originals are never overwritten.');
try {
  execFileSync('cwebp', ['-version'], { stdio: 'ignore' });
} catch {
  fail('cwebp is not installed. On a Mac: brew install webp');
}

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : IMAGE.has(extname(e.name).toLowerCase()) ? [join(dir, e.name)] : [],
  );

const list = files(input);
if (!list.length) fail(`No images (${[...IMAGE].join(' ')}) found in ${input}`);

let before = 0;
let after = 0;
for (const file of list) {
  const target = join(output, dirname(relative(input, file)), `${basename(file, extname(file))}.webp`);
  mkdirSync(dirname(target), { recursive: true });
  try {
    execFileSync('cwebp', ['-quiet', '-mt', '-m', '6', '-metadata', 'none', '-q', String(QUALITY), '-resize', String(MAX_WIDTH), '0', '-resize_mode', 'down_only', file, '-o', target]);
  } catch {
    console.error(`  skipped (could not convert): ${relative(input, file)}`);
    continue;
  }
  const [a, b] = [statSync(file).size, statSync(target).size];
  before += a;
  after += b;
  console.log(`  ${relative(input, file)} → ${relative(output, target)}  ${Math.round(a / 1024)} KB → ${Math.round(b / 1024)} KB`);
}
console.log(`Done: ${list.length} file(s), ${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB`);
