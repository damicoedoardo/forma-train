import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { NextConfig } from 'next';

/** A name for the app's code: a hash of everything that goes into the app. It only changes when the
    app does, so a deploy that touches only the backend or the docs leaves every file name the same,
    and an open app has no reason to reload. (A commit id would change the name on every deploy.) */
function codeId(): string {
  const hash = createHash('sha256');
  const add = (path: string) => {
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path).sort()) add(join(path, name));
      return;
    }
    hash.update(path);
    hash.update(readFileSync(path));
  };
  for (const path of ['src', 'public', 'package.json', 'pnpm-lock.yaml', 'next.config.ts', 'tailwind.config.ts', 'postcss.config.js']) {
    try {
      add(path);
    } catch {
      // Not there: leave it out.
    }
  }
  return hash.digest('hex').slice(0, 12);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A name for this build, so the service worker can tell this deploy's files from older ones.
  env: { NEXT_PUBLIC_BUILD_ID: codeId() },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // The service worker must never be served stale, or app updates
        // would be stuck behind the old cache.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
