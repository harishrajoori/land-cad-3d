import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { base } from '$app/paths';

/**
 * Real CC0 furniture models (Poly Haven), packed into single self-contained GLBs
 * under static/models/cc0/. Maps the concept's catalog ids to model files, loads
 * them once, caches the parsed scene, and hands out normalised clones sized to a
 * target footprint (in feet). Falls back silently if a model is missing.
 */

// catalog id -> GLB filename (without extension). Only ids we actually downloaded.
const MODEL_FILES: Record<string, string> = {
  sofa: 'sofa',
  armchair: 'armchair',
  bed_queen: 'bed',
  bed_twin: 'bed',
  dining_table: 'dining_table',
  dining_chair: 'dining_chair',
  coffee_table: 'coffee_table',
  table: 'table',
  wardrobe: 'wardrobe',
  nightstand: 'nightstand',
  shelf: 'shelf',
};

// Approximate real footprint (feet) to scale each model to. Keeps proportions sane.
const TARGET_SIZE_FT: Record<string, number> = {
  sofa: 6.5, armchair: 3, bed_queen: 6.5, bed_twin: 3.5, dining_table: 5.5,
  dining_chair: 1.8, coffee_table: 3.5, table: 4, wardrobe: 4, nightstand: 1.6, shelf: 3,
};

const loader = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Object3D | null>>();

export function hasGLB(catalogId: string): boolean {
  return catalogId in MODEL_FILES;
}

function loadRaw(file: string): Promise<THREE.Object3D | null> {
  const url = `${base}/models/cc0/${file}.glb`;
  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      () => resolve(null), // missing/failed model — caller falls back to a primitive
    );
  });
}

/** Returns a fresh clone of the model, centred on the floor and scaled to footprint. */
export async function loadGLBFurniture(catalogId: string): Promise<THREE.Object3D | null> {
  const file = MODEL_FILES[catalogId];
  if (!file) return null;
  if (!cache.has(file)) cache.set(file, loadRaw(file));
  const source = await cache.get(file)!;
  if (!source) return null;

  const object = source.clone(true);
  // Normalise: sit on the floor (y=0), centre on x/z, scale to target footprint (in feet).
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const footprint = Math.max(size.x, size.z) || 1;
  const target = TARGET_SIZE_FT[catalogId] ?? 3;
  const scale = target / footprint;
  object.scale.setScalar(scale);
  object.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

  const holder = new THREE.Group();
  holder.add(object);
  holder.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return holder;
}
