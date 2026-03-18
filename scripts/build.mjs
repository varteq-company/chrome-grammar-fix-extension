import { mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');

async function prepareDist() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await mkdir(path.join(distDir, 'background'), { recursive: true });
  await mkdir(path.join(distDir, 'content'), { recursive: true });
  await mkdir(path.join(distDir, 'popup'), { recursive: true });
  await mkdir(path.join(distDir, 'icons'), { recursive: true });
}

async function copyStaticAssets() {
  await cp(path.join(srcDir, 'manifest.json'), path.join(distDir, 'manifest.json'));
  await cp(path.join(srcDir, 'popup', 'popup.html'), path.join(distDir, 'popup', 'popup.html'));
  await cp(path.join(srcDir, 'popup', 'popup.css'), path.join(distDir, 'popup', 'popup.css'));
  await cp(path.join(srcDir, 'content', 'content.css'), path.join(distDir, 'content', 'content.css'));
  await cp(path.join(srcDir, 'icons'), path.join(distDir, 'icons'), { recursive: true });
}

async function bundleScripts() {
  await build({
    entryPoints: [path.join(srcDir, 'background', 'service-worker.js')],
    outfile: path.join(distDir, 'background', 'service-worker.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'chrome114',
    legalComments: 'none',
  });

  await build({
    entryPoints: [path.join(srcDir, 'popup', 'popup.js')],
    outfile: path.join(distDir, 'popup', 'popup.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'chrome114',
    legalComments: 'none',
  });

  await build({
    entryPoints: [path.join(srcDir, 'content', 'content.js')],
    outfile: path.join(distDir, 'content', 'content.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'chrome114',
    legalComments: 'none',
  });
}

await prepareDist();
await copyStaticAssets();
await bundleScripts();
console.log('Build complete: dist/ is ready for Load unpacked');
