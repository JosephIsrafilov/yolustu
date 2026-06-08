import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const distDir = `.next-build-${Date.now()}`;
const env = {
  ...process.env,
  NEXT_DIST_DIR: distDir,
};

const nextBin = require.resolve('next/dist/bin/next');
const result = spawnSync(process.execPath, [nextBin, 'build', '--webpack'], {
  cwd: process.cwd(),
  env,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
