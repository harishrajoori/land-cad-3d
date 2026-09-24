/**
 * Fetch Poly Haven CC0 models and pack each into a single self-contained .glb
 * for the house-design viewer. Build-time tool only (not shipped in the app).
 *
 * Usage:
 *   node tooling/fetch-polyhaven.mjs Sofa_01=sofa GothicBed_01=bed dining_table=dining_table
 *   node tooling/fetch-polyhaven.mjs --all   (uses the DEFAULT_SET below)
 *
 * Output: static/models/cc0/<localName>.glb  (+ credits.json)
 */
import { NodeIO } from '@gltf-transform/core';
import { dedup, prune } from '@gltf-transform/functions';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const RES = '1k';
const OUT_DIR = path.resolve('static/models/cc0');
const TMP_DIR = path.resolve('.tmp-polyhaven');
const API = 'https://api.polyhaven.com';

// asset id -> local model name used by the app's furniture mapping.
const DEFAULT_SET = {
  Sofa_01: 'sofa',
  ArmChair_01: 'armchair',
  GothicBed_01: 'bed',
  dining_table: 'dining_table',
  dining_chair_02: 'dining_chair',
  CoffeeTable_01: 'coffee_table',
  WoodenTable_01: 'table',
  drawer_cabinet: 'wardrobe',
  ClassicNightstand_01: 'nightstand',
  Shelf_01: 'shelf',
};

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
}

async function packAsset(assetId, localName) {
  const files = await getJSON(`${API}/files/${assetId}`);
  const gltfRes = files?.gltf?.[RES]?.gltf;
  if (!gltfRes) throw new Error(`${assetId}: no ${RES} glTF resolution`);

  const workDir = path.join(TMP_DIR, assetId);
  await mkdir(workDir, { recursive: true });

  // The primary gltf entry and its included dependencies (bin + textures).
  const gltfUrl = gltfRes.url;
  const gltfPath = path.join(workDir, path.basename(gltfUrl));
  await download(gltfUrl, gltfPath);

  for (const [rel, info] of Object.entries(gltfRes.include ?? {})) {
    await download(info.url, path.join(workDir, rel));
  }

  // Read, clean, and write a single self-contained binary GLB.
  const io = new NodeIO();
  const doc = await io.read(gltfPath);
  await doc.transform(dedup(), prune());
  await mkdir(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${localName}.glb`);
  await io.write(outPath, doc); // .glb extension -> binary, embedded resources
  return { assetId, localName, outPath };
}

async function main() {
  const args = process.argv.slice(2);
  const set = (args.length === 0 || args[0] === '--all')
    ? DEFAULT_SET
    : Object.fromEntries(args.map((a) => { const [id, name] = a.split('='); return [id, name || id.toLowerCase()]; }));

  await mkdir(OUT_DIR, { recursive: true });
  const credits = existsSync(path.join(OUT_DIR, 'credits.json'))
    ? JSON.parse(await readFile(path.join(OUT_DIR, 'credits.json'), 'utf8'))
    : {};

  for (const [assetId, localName] of Object.entries(set)) {
    try {
      const r = await packAsset(assetId, localName);
      credits[localName] = { source: 'Poly Haven', license: 'CC0', assetId, url: `https://polyhaven.com/a/${assetId}` };
      console.log(`OK  ${assetId} -> ${path.relative(process.cwd(), r.outPath)}`);
    } catch (e) {
      console.error(`SKIP ${assetId}: ${e.message}`);
    }
  }
  await writeFile(path.join(OUT_DIR, 'credits.json'), JSON.stringify(credits, null, 2));
  await rm(TMP_DIR, { recursive: true, force: true });
  console.log('Done. Models in', path.relative(process.cwd(), OUT_DIR));
}

main().catch((e) => { console.error(e); process.exit(1); });
