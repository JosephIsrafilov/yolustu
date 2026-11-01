import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const env = { ...process.env, NEXT_PUBLIC_DEMO_MODE: 'true', NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: '', NEXT_PUBLIC_API_URL: '', NEXT_PUBLIC_WS_URL: '' };
const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], { cwd: process.cwd(), env, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
if (!existsSync(join(process.cwd(), 'out', 'index.html'))) throw new Error('Static demo export is missing out/index.html');
const html = readFileSync(join(process.cwd(), 'out', 'index.html'), 'utf8');
if (!html.includes('lang="en"')) throw new Error('Demo must export in English');

// Next 16 static export writes nested RSC files, while client prefetch asks for flattened names.
function walk(folder) {
  for (const entry of readdirSync(folder)) {
    const target = join(folder, entry);
    if (statSync(target).isDirectory()) walk(target);
  }
  if (!existsSync(join(folder, 'index.html'))) return;
  for (const entry of readdirSync(folder)) {
    if (!entry.startsWith('__next.') || !statSync(join(folder, entry)).isDirectory()) continue;
    function flatten(dir, parts) {
      for (const child of readdirSync(dir)) {
        const source = join(dir, child);
        if (statSync(source).isDirectory()) flatten(source, [...parts, child]);
        else if (child.endsWith('.txt')) copyFileSync(source, join(folder, [...parts, child].join('.')));
      }
    }
    flatten(join(folder, entry), [entry]);
  }
}
walk(join(process.cwd(), 'out'));
if (!existsSync(join(process.cwd(), 'out', 'driver', 'apply', '__next.driver.apply.txt'))) throw new Error('RSC prefetch alias missing');
