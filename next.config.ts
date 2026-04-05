import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: configDir,
  },
  async redirects() {
    return [
      // /memory was the OpenBrain config page — consolidated into Settings
      {
        source: '/memory',
        destination: '/settings',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
