// Collect installed packages conservatively, including build dependencies.
// Missing upstream license files are recorded for manual follow-up.
import { readdir, mkdir, readFile, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const output = process.argv[2];
if (!output) throw new Error('Usage: node collect-npm-licenses.mjs OUTPUT');
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
await mkdir(output, { recursive: true });
const manifest = [];
for (const [location, metadata] of Object.entries(lock.packages)) {
  if (!location.startsWith('node_modules/')) continue;
  let entries;
  try { entries = await readdir(location, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  const pkg = JSON.parse(await readFile(path.join(location, 'package.json'), 'utf8'));
  const files = entries.filter((entry) => entry.isFile() && /^(licen[cs]e|copying|notice)(\b|[._-])/i.test(entry.name));
  const destination = path.join(output, location);
  await mkdir(destination, { recursive: true });
  for (const file of files) await copyFile(path.join(location, file.name), path.join(destination, file.name));
  let licenseSource = 'package';
  if (files.length === 0 && pkg.name === 'react-remove-scroll-bar' && pkg.version === '2.3.8') {
    const override = path.join(path.dirname(fileURLToPath(import.meta.url)), 'license-overrides', 'react-remove-scroll-bar-2.3.8.LICENSE');
    await copyFile(override, path.join(destination, 'LICENSE.upstream'));
    files.push({ name: 'LICENSE.upstream' });
    licenseSource = 'upstream repository default branch; package declares MIT';
  }
  // Preserve the package metadata even if the package omits its license text.
  await copyFile(path.join(location, 'package.json'), path.join(destination, 'package.json'));
  manifest.push({ name: pkg.name, version: pkg.version || metadata.version, license: pkg.license ?? null, location, licenseFiles: files.map((f) => f.name), licenseSource });
}
await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Collected ${manifest.length} npm packages; ${manifest.filter((p) => !p.licenseFiles.length).length} lack a license file.`);
