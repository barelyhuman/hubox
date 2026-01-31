import esbuild from 'esbuild'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development';

// Build main process
esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/main.js',
  external: ['electron'],
  sourcemap: isDev,
  minify: !isDev,
}).catch(() => process.exit(1));

// Build preload script
esbuild.build({
  entryPoints: ['src/preload.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/preload.js',
  external: ['electron'],
  sourcemap: isDev,
  minify: !isDev,
}).catch(() => process.exit(1));

// Build renderer process
esbuild.build({
  entryPoints: ['src/renderer/renderer.ts'],
  bundle: true,
  platform: 'browser',
  target: ['chrome120'],
  outfile: 'dist/renderer/renderer.js',
  sourcemap: isDev,
  minify: !isDev,
}).catch(() => process.exit(1));
