import { cp, mkdir, rm, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'www');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const filename of ['index.html', 'manifest.webmanifest', 'service-worker.js']) {
  await copyFile(path.join(root, filename), path.join(output, filename));
}
for (const directory of ['css', 'js', 'icons']) {
  await cp(path.join(root, directory), path.join(output, directory), { recursive: true });
}
console.log(`Web and Android assets built: ${output}`);
