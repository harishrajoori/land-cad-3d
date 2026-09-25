import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createFurnitureModel } from '$lib/utils/furnitureModels3d';
import { furnitureCatalog } from '$lib/utils/furnitureCatalog';
import { hasGLB, loadGLBFurniture } from './glbFurniture';
import { contains, length, type HouseConcept, type Rect, type Space } from './model';

export type FloorView = 'ground' | 'first' | 'both';
export type CameraView = 'overview' | 'plan' | 'street' | 'shrine' | 'walk';
export interface SceneOptions { floor: FloorView; cutaway: boolean; labels: boolean; }
const FT = 30.48;
function disposeTree(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  root.traverse(o => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
  });
  for (const material of materials) { (material as THREE.MeshStandardMaterial).map?.dispose(); material.dispose(); }
}
export function createHouseViewer(host: HTMLElement, onWalk: (walking: boolean) => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D house. Drag to orbit; in eye-level mode use arrow keys or WASD and drag to look.');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eeeae1');
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 1200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .09;
  controls.maxPolarAngle = Math.PI / 2 - .015; controls.minDistance = 8; controls.maxDistance = 350;
  scene.add(new THREE.HemisphereLight('#fff7e7', '#768a6e', 1.8));
  const sun = new THREE.DirectionalLight('#fff5de', 2.4);
  sun.position.set(-45, 100, -55); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, near: 1, far: 300 });
  sun.shadow.bias = -.0005; sun.shadow.normalBias = .08;
  scene.add(sun); scene.add(sun.target);
  let world = new THREE.Group(), labels = new THREE.Group();
  scene.add(world); scene.add(labels);
  let model: HouseConcept;
  let options: SceneOptions = { floor: 'ground', cutaway: true, labels: true };
  let currentView: CameraView = 'overview', walking = false, yaw = -Math.PI / 2, pitch = 0;
  let activeFloor = 0, frame = 0, lastTime = 0, dirty = true, disposed = false;
  const keys = new Set<string>();
  const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: .8, ...extra });
  function box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(parent: THREE.Object3D, x: number, y: number, z: number, r: number, h: number, color: string, r2 = r) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, h, 16), mat(color));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function text(parent: THREE.Object3D, content: string, x: number, y: number, z: number, width = 10, color = '#3c4d40') {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 112;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(255,253,247,.93)'; ctx.beginPath(); ctx.roundRect(4, 4, 632, 104, 18); ctx.fill();
    ctx.font = '500 33px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    ctx.fillText(content, 320, 56, 604);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: true, transparent: true, toneMapped: false }));
    sprite.position.set(x, y, z); sprite.userData.labelWidth = width; sprite.scale.set(width, width * 112 / 640, 1); sprite.renderOrder = 10; parent.add(sprite);
  }
  function garden(r: Rect) {
    box(world, r.x + r.w / 2, .03, r.z + r.d / 2, r.w, .1, r.d, '#8b9c72');
    // Stripes make the lawn readable without external textures.
    for (let x = r.x; x < r.x + r.w; x += 3) box(world, x + .7, .091, r.z + r.d / 2, Math.min(1.4, r.x + r.w - x), .015, r.d, '#92a47a');
  }
  function tree(x: number, z: number, scale = 1) {
    cylinder(world, x, 1.8 * scale, z, .16 * scale, 3.6 * scale, '#76644b');
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 * scale, 1), mat('#6c8655'));
    crown.position.set(x, 4.4 * scale, z); crown.castShadow = true; world.add(crown);
  }
  function wallSegment(w: HouseConcept['walls'][number], floorY: number, cutaway: boolean) {
    const group = new THREE.Group(); group.position.set(w.x1, floorY, w.z1);
    group.rotation.y = -Math.atan2(w.z2 - w.z1, w.x2 - w.x1); world.add(group);
    const len = length(w), height = cutaway ? 2.6 : model.floorHeight - .4;
    const terrace = w.rooms.includes('1-terrace');
    const limit = terrace && w.rooms.length === 1 ? Math.min(height, 3.1) : height;
    let cursor = 0;
    for (const o of [...w.openings].sort((a, b) => a.offset - b.offset)) {
      const start = o.offset - o.width / 2, end = o.offset + o.width / 2;
      if (start > cursor) box(group, (start + cursor) / 2, limit / 2, 0, start - cursor, limit, .5, '#f2ebdf');
      if (o.bottom > 0) box(group, o.offset, Math.min(o.bottom, limit) / 2, 0, o.width, Math.min(o.bottom, limit), .5, '#f2ebdf');
      if (limit > o.bottom + o.height) box(group, o.offset, (limit + o.bottom + o.height) / 2, 0, o.width, limit - o.bottom - o.height, .5, '#f2ebdf');
      if (!cutaway && o.kind === 'window' && !terrace) {
        const glass = new THREE.Mesh(new THREE.BoxGeometry(o.width - .12, o.height - .12, .06), mat('#abc7cb', { transparent: true, opacity: .38, metalness: .15 }));
        glass.position.set(o.offset, o.bottom + o.height / 2, 0); group.add(glass);
        for (const dx of [-o.width / 2, 0, o.width / 2]) box(group, o.offset + dx, o.bottom + o.height / 2, 0, .09, o.height, .25, '#59685b');
        for (const y of [o.bottom, o.bottom + o.height]) box(group, o.offset, y, 0, o.width + .15, .1, .3, '#59685b');
        box(group, o.offset, o.bottom + o.height + .18, 0, o.width + .7, .14, 1.5, '#c4b499');
      }
      if (o.kind === 'door') {
        const doorHeight = Math.min(limit, o.height);
        for (const dx of [-o.width / 2, o.width / 2]) box(group, o.offset + dx, doorHeight / 2, 0, .12, doorHeight, .55, '#8e6b49');
        if (!cutaway) box(group, o.offset, o.height, 0, o.width + .12, .14, .55, '#8e6b49');
        // Doors are shown open; the opening remains traversable.
        box(group, start + .08, doorHeight / 2, o.width / 2, .12, doorHeight, o.width, '#a98a64');
      }
      cursor = end;
    }
    if (cursor < len) box(group, (cursor + len) / 2, limit / 2, 0, len - cursor, limit, .5, '#f2ebdf');
    // A darker cap makes the wall topology clear in cutaway.
    if (cutaway && !w.openings.some(o => o.kind === 'door')) box(group, len / 2, limit + .025, 0, len, .05, .52, '#c2b19a');
  }
  function shrine(r: Space) {
    // Parametric shrine: platform, four pillars, canopy and offerings all derived
    // from the actual room size so it fits at any scale (no fixed overflow).
    const g = new THREE.Group(); g.name = 'Mallanna shrine — raised platform, four pillars and offerings'; world.add(g);
    const pad = 1;                                        // clearance from walls
    const platW = Math.min(6, r.w - 2 * pad);             // platform width, capped
    const platD = Math.min(4, r.d * 0.4);                 // platform depth = back portion
    const x = r.x + r.w / 2;                              // centred on room width
    const z = r.z + pad + platD / 2;                      // set against the back (front) wall
    const px = platW / 2 - 0.35, pz = platD / 2 - 0.35;   // pillar offsets inside the platform
    const canopyY = 5.2;

    box(g, x, .5, z, platW, 1, platD, '#d7bda0');                 // raised platform
    box(g, x, 1.02, z, platW + .1, .12, platD + .1, '#f1e1bf');   // platform top
    // Four decorated pillars + canopy, sized to the platform (shrine features, not columns).
    for (const dx of [-px, px]) for (const dz of [-pz, pz]) {
      cylinder(g, x + dx, canopyY / 2 + 1, z + dz, .13, canopyY, '#a57635');
      for (const y of [1.2, 1.5, canopyY + .6, canopyY + .9]) cylinder(g, x + dx, y, z + dz, .2, .14, '#d6b564');
    }
    box(g, x, canopyY + 1.15, z, platW + .5, .25, platD + .5, '#80522e');   // canopy
    box(g, x, canopyY + 1.4, z, platW + .1, .25, platD + .1, '#b1843c');
    // Garland across the front beam.
    for (let i = 0; i <= 20; i++) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 8), mat(i % 3 ? '#e8a323' : '#a55630'));
      bead.position.set(x - platW / 2 + i * platW / 20, canopyY + .9 - .3 * Math.sin(i / 20 * Math.PI * 3) ** 2, z + platD / 2 + .12); g.add(bead);
    }
    // Table-like shrine surface + framed deity placeholder at the back of the platform.
    const tblW = Math.min(3.5, platW - 1);
    box(g, x, 1.8, z - platD / 4, tblW, 1.5, Math.min(1.5, platD / 2), '#8c5c3b');
    box(g, x, 2.6, z - platD / 4, tblW + .2, .12, Math.min(1.7, platD / 2 + .2), '#c7a568');
    box(g, x, 3.7, z - platD / 2 + .1, Math.min(2.1, tblW), 2, .18, '#b78c3c');
    // Prasadam tray in front of the deity, on the platform.
    box(g, x, 1.25, z + platD / 4, Math.min(3.4, platW - 1), .12, Math.min(1, platD / 3), '#c09859');
    // Floor cushions for ~4 people, in the clear room space in front of the platform.
    const cushZ0 = r.z + platD + pad + 1;
    if (r.d - platD - pad > 3) for (const dx of [-1.5, 1.5]) for (const dz of [0, 2.2]) {
      if (cushZ0 + dz < r.z + r.d - 1) box(g, x + dx, .12, cushZ0 + dz, 1.6, .24, 1.6, '#b07b58');
    }
    text(labels, 'Mallanna · 4 people', x, canopyY + 2, z, Math.min(10, r.w * .9));
  }
  function stairs() {
    const s = model.stair, h = model.floorHeight, half = h / 2, run = 10, n = 9;
    box(world, s.x + 2, .08, s.z + 2, 4, .16, 4, '#c8bda9');
    box(world, s.x + s.w / 2, half - .18, s.z + 15.5, s.w, .36, 3, '#d4cbb9');
    for (let i = 0; i < n; i++) {
      const y = (i + 1) * half / n;
      box(world, s.x + 2, y / 2, s.z + 4 + (i + .5) * run / n, 4, y, run / n, '#ddd3c1');
      const y2 = half + (i + 1) * half / n;
      box(world, s.x + 7, y2 - .2, s.z + 14 - (i + .5) * run / n, 4, .4, run / n, '#ddd3c1');
    }
    // Top landing bridges to the first-floor foyer, independent of the home below.
    box(world, (s.x + 5 + model.house.x) / 2, h - .2, s.z + 2, model.house.x - s.x - 5, .4, 4, '#d4cbb9');
    for (const z of [s.z, s.z + 4]) {
      box(world, (s.x + 5 + model.house.x) / 2, h + 2.9, z, model.house.x - s.x - 5, .08, .08, '#56685d');
      for (let x = s.x + 5; x < model.house.x; x += 1) box(world, x, h + 1.5, z, .06, 3, .06, '#56685d');
    }
    // Stair handrails follow the two flights.
    for (const x of [s.x, s.x + 4, s.x + 5, s.x + 9]) {
      const returning = x >= s.x + 5;
      for (let i = 0; i <= n; i++) {
        const z = s.z + 4 + i * run / n;
        const y = returning ? h - i * half / n : i * half / n;
        box(world, x, y + 1.5, z, .055, 3, .055, '#56685d');
      }
      const rail = box(world, x, (returning ? half * 1.5 : half / 2) + 3, s.z + 9, .085, .085, Math.hypot(run, half), '#56685d');
      rail.rotation.x = returning ? Math.atan2(half, run) : -Math.atan2(half, run);
    }
    text(labels, 'Independent upstairs access', s.x + 6, h + 4, s.z + 10, 13);
  }
  function update(next: HouseConcept, nextOptions: SceneOptions) {
    model = next; options = nextOptions;
    scene.remove(world, labels); disposeTree(world); disposeTree(labels);
    world = new THREE.Group(); world.name = 'Family house concept'; labels = new THREE.Group(); scene.add(world, labels);
    if (!model.valid) { stopWalk(); invalidate(); return; }
    const W = model.input.depth, D = model.input.frontage;
    const shadowSize = Math.max(W, D) * .75;
    Object.assign(sun.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize });
    sun.shadow.camera.updateProjectionMatrix();
    sun.position.set(W / 2 - 45, 100, D / 2 - 55); sun.target.position.set(W / 2, 0, D / 2);
    box(world, W / 2, -.65, D / 2, W, 1.2, D, '#d2c8b5');
    box(world, -10, -.2, D / 2, 20, .2, D + 18, '#929991');
    for (let z = -5; z < D + 5; z += 10) box(world, -10, -.09, z, .3, .02, 5, '#e5e3d6');
    text(labels, 'WEST · 20 ft road', -10, .5, D / 2, 13);
    text(labels, 'N ↑', W + 4, .5, 2, 5);
    text(labels, `${D} ft frontage`, -1, .6, D + 5, 11);
    text(labels, `${W} ft depth`, W / 2, .6, D + 5, 10);
    for (const r of model.gardens) garden(r);
    for (const x of [7, W - 8]) tree(x, D - 5);
    tree(W - 1.5, 2, .65);
    text(labels, 'Garden & play', W / 2, .4, D - 5, 10);
    // Compound boundary with separate vehicle, pedestrian and stair access gaps.
    box(world, W, .8, D / 2, .3, 1.6, D, '#c5b498');
    box(world, W / 2, .8, 0, W, 1.6, .3, '#c5b498');
    box(world, W / 2, .8, D, W, 1.6, .3, '#c5b498');
    for (const [a, b] of [[0, 5], [15, 17], [27, 31], [35, model.stair.z], [model.stair.z + 4, D]]) if (b > a) box(world, 0, .8, (a + b) / 2, .3, 1.6, b - a, '#c5b498');
    const p = model.patnam;
    box(world, p.x + p.w / 2, .035, p.z + p.d / 2, p.w, .08, p.d, '#c6aa83');
    for (const dz of [0, p.d]) box(world, p.x + p.w / 2, .085, p.z + dz, p.w, .035, .12, '#f7e9d0');
    for (const dx of [0, p.w]) box(world, p.x + dx, .085, p.z + p.d / 2, .12, .035, p.d, '#f7e9d0');
    text(labels, 'Patnam · 12 × 12 ft', p.x + p.w / 2, .5, p.z + p.d / 2, 11);
    for (let i = 0; i < 2; i++) {
      const z = 10 + i * 12;
      for (const dz of [-5, 5]) box(world, 8.5, .02, z + dz, 16, .025, .1, '#f4efdd');
    }
    for (const path of model.paths) box(world, path.x + path.w / 2, .03, path.z + path.d / 2, path.w, .08, path.d, '#d2c5ad');
    const showFloor = (f: number) => options.floor === 'both' || f === (options.floor === 'ground' ? 0 : 1);
    for (const r of model.rooms.filter(r => showFloor(r.floor))) {
      const elevation = r.floor * model.floorHeight;
      box(world, r.x + r.w / 2, elevation - .2, r.z + r.d / 2, r.w, .4, r.d, r.color);
      // Subtle tile joints are physical lines, so exports retain the appearance.
      if (r.use !== 'bedroom') for (let x = r.x + 2; x < r.x + r.w; x += 2) box(world, x, elevation + .009, r.z + r.d / 2, .018, .015, r.d - .5, '#c6bfb0');
      if (r.use !== 'hall' && r.id !== '0-mallanna') text(labels, r.name, r.x + r.w / 2, elevation + .6, r.z + r.d / 2, Math.min(10, r.w * .9));
    }
    for (const w of model.walls.filter(w => showFloor(w.floor))) wallSegment(w, w.floor * model.floorHeight, options.cutaway && !walking);
    for (const item of model.furniture.filter(i => (i.x < model.house.x && i.floor === 0) || showFloor(i.floor))) {
      const def = furnitureCatalog.find(d => d.id === item.catalog); if (!def) continue;
      // Primitive placeholder shows instantly; a real GLB (if available) swaps in when loaded.
      const object = createFurnitureModel(item.catalog, { ...def, color: item.color ?? def.color });
      object.name = item.catalog; object.scale.setScalar(1 / FT); object.position.set(item.x, item.floor * model.floorHeight, item.z); object.rotation.y = -item.rotation * Math.PI / 180; world.add(object);
      if (hasGLB(item.catalog)) {
        const placeholder = object;
        void loadGLBFurniture(item.catalog).then((real) => {
          if (!real || disposed || placeholder.parent !== world) return;
          real.position.set(item.x, item.floor * model.floorHeight, item.z);
          real.rotation.y = -item.rotation * Math.PI / 180;
          world.remove(placeholder);
          disposeTree(placeholder);
          world.add(real);
          dirty = true;
        });
      }
    }
    if (showFloor(0)) shrine(model.rooms.find(r => r.id === '0-mallanna')!);
    stairs();
    if (walking) {
      for (const r of model.rooms.filter(r => showFloor(r.floor) && r.use !== 'outdoor')) box(world, r.x + r.w / 2, (r.floor + 1) * model.floorHeight - .2, r.z + r.d / 2, r.w, .4, r.d, '#e8e0d2');
    }
    if (options.floor === 'both' && !options.cutaway && !walking) {
      // A flat terrace roof with a parapet; the open terrace remains uncovered.
      for (const r of model.rooms.filter(r => r.floor === 1 && r.use !== 'outdoor')) box(world, r.x + r.w / 2, 2 * model.floorHeight - .2, r.z + r.d / 2, r.w, .4, r.d, '#d9cbb5');
      const h = model.house;
      box(world, h.x, 2 * model.floorHeight + 1.3, h.z + h.d / 2, .4, 2.6, h.d, '#e8dfcc');
      box(world, h.x + h.w, 2 * model.floorHeight + 1.3, h.z + h.d / 2, .4, 2.6, h.d, '#e8dfcc');
    }
    labels.visible = options.labels && !walking && currentView !== 'shrine';
    invalidate();
  }
  function preset(view: CameraView) {
    if (!model?.valid) return;
    currentView = view;
    if (view !== 'walk') stopWalk();
    const W = model.input.depth, D = model.input.frontage;
    const y = options.floor === 'first' ? model.floorHeight : 0;
    if (view === 'walk') {
      walking = true; controls.enabled = false; keys.clear(); activeFloor = options.floor === 'first' ? 1 : 0;
      const r = model.rooms.find(r => r.id === `${activeFloor}-${activeFloor ? 'entry' : 'living'}`)!;
      camera.position.set(r.x + 2, y + 5.5, activeFloor ? r.z + r.d / 2 : r.z + r.d - 2.5); yaw = -Math.PI / 2; pitch = 0;
      renderer.domElement.focus(); onWalk(true); update(model, options);
    } else {
      controls.enabled = true;
      controls.target.set(W / 2, y + 1, D / 2);
      if (view === 'plan') { camera.position.set(W / 2, Math.max(W, D) * 1.8, D / 2 + .01); }
      if (view === 'overview') camera.position.set(W / 2 - D * .92, D * .95, D / 2 + D * .8);
      if (view === 'street') { camera.position.set(-D * .95, 24, D * .6); controls.target.set(18, 8, D / 2); }
      if (view === 'shrine') {
        const r = model.rooms.find(r => r.id === '0-mallanna')!;
        controls.target.set(r.x + r.w / 2, 2.8, r.z + 3);
        camera.position.set(r.x + r.w / 2 - 6, 11, r.z + 18);
      }
      labels.visible = options.labels && view !== 'shrine';
      controls.update(); invalidate();
    }
  }
  function stopWalk() { if (!walking) return; walking = false; keys.clear(); controls.enabled = true; onWalk(false); if (model?.valid) update(model, options); }
  // Approximate wall collision at walking radius, with doors treated as openings.
  function canStand(x: number, z: number) {
    if (!contains({ x: .5, z: .5, w: model.input.depth - 1, d: model.input.frontage - 1 }, x, z)) return false;
    if (activeFloor === 1 && !contains(model.house, x, z, .3)) return false;
    for (const w of model.walls.filter(w => w.floor === activeFloor)) {
      const len = length(w), dx = (w.x2 - w.x1) / len, dz = (w.z2 - w.z1) / len;
      const t = (x - w.x1) * dx + (z - w.z1) * dz;
      const distance = Math.abs((x - w.x1) * dz - (z - w.z1) * dx);
      if (t >= -.35 && t <= len + .35 && distance < .55 && !w.openings.some(o => o.kind === 'door' && Math.abs(t - o.offset) < o.width / 2 - .35)) return false;
    }
    for (const item of model.furniture.filter(i => i.floor === activeFloor)) {
      const def = furnitureCatalog.find(d => d.id === item.catalog); if (!def) continue;
      const angle = item.rotation * Math.PI / 180;
      const w = (Math.abs(Math.cos(angle)) * def.width + Math.abs(Math.sin(angle)) * def.depth) / FT;
      const d = (Math.abs(Math.sin(angle)) * def.width + Math.abs(Math.cos(angle)) * def.depth) / FT;
      if (contains({ x: item.x - w / 2 - .2, z: item.z - d / 2 - .2, w: w + .4, d: d + .4 }, x, z)) return false;
    }
    if (activeFloor === 0) {
      const r = model.rooms.find(r => r.id === '0-mallanna')!;
      if (contains({ x: r.x + r.w / 2 - 3.2, z: r.z + .8, w: 6.4, d: 5.1 }, x, z)) return false;
      if (contains(model.stair, x, z)) return false;
    }
    return true;
  }
  function invalidate() { dirty = true; if (!frame && !disposed) frame = requestAnimationFrame(render); }
  function render(time: number) {
    frame = 0;
    const dt = Math.min((time - lastTime) / 1000 || 0, .05); lastTime = time;
    if (walking) {
      let forward = Number(keys.has('w') || keys.has('arrowup')) - Number(keys.has('s') || keys.has('arrowdown'));
      let side = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
      const norm = Math.hypot(forward, side); if (norm) { forward /= norm; side /= norm; }
      const dx = (-Math.sin(yaw) * forward + Math.cos(yaw) * side) * dt * 6;
      const dz = (-Math.cos(yaw) * forward - Math.sin(yaw) * side) * dt * 6;
      if (canStand(camera.position.x + dx, camera.position.z)) camera.position.x += dx;
      if (canStand(camera.position.x, camera.position.z + dz)) camera.position.z += dz;
      camera.rotation.order = 'YXZ'; camera.rotation.set(pitch, yaw, 0);
    }
    const moving = !walking && controls.update();
    if (dirty || moving || (walking && keys.size)) {
      for (const label of labels.children) {
        const width = Math.min(label.userData.labelWidth, camera.position.distanceTo(label.position) * .105);
        label.scale.set(width, width * 112 / 640, 1);
      }
      renderer.render(scene, camera);
    }
    dirty = false;
    if (moving || (walking && keys.size)) invalidate();
  }
  function keydown(e: KeyboardEvent) {
    if (!walking || document.activeElement !== renderer.domElement) return;
    const key = e.key.toLowerCase();
    if (key === 'escape') { preset('overview'); return; }
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { e.preventDefault(); keys.add(key); invalidate(); }
  }
  function keyup(e: KeyboardEvent) { keys.delete(e.key.toLowerCase()); }
  const resetKeys = () => keys.clear();
  let drag: { x: number; y: number } | null = null;
  function down(e: PointerEvent) { if (walking) { drag = { x: e.clientX, y: e.clientY }; renderer.domElement.setPointerCapture(e.pointerId); renderer.domElement.focus(); } }
  function move(e: PointerEvent) { if (walking && drag) { yaw -= (e.clientX - drag.x) * .006; pitch = THREE.MathUtils.clamp(pitch - (e.clientY - drag.y) * .004, -1.15, 1.15); drag = { x: e.clientX, y: e.clientY }; invalidate(); } }
  function up() { drag = null; }
  window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', resetKeys);
  document.addEventListener('visibilitychange', resetKeys); renderer.domElement.addEventListener('blur', resetKeys);
  renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointermove', move); renderer.domElement.addEventListener('pointerup', up); renderer.domElement.addEventListener('pointercancel', up);
  controls.addEventListener('change', invalidate);
  const observer = new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); invalidate();
  }); observer.observe(host);
  return {
    update, preset,
    step(direction: 'forward' | 'back' | 'left' | 'right') {
      if (!walking) return;
      const forward = direction === 'forward' ? 1 : direction === 'back' ? -1 : 0;
      const side = direction === 'right' ? 1 : direction === 'left' ? -1 : 0;
      const dx = (-Math.sin(yaw) * forward + Math.cos(yaw) * side) * .75;
      const dz = (-Math.cos(yaw) * forward - Math.sin(yaw) * side) * .75;
      if (canStand(camera.position.x + dx, camera.position.z)) camera.position.x += dx;
      if (canStand(camera.position.x, camera.position.z + dz)) camera.position.z += dz;
      invalidate();
    },
    capture: () => { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    async glb() {
      // Export the full building, independent of the current inspection controls.
      const previous = { ...options }, previousWalk = walking;
      walking = false; update(model, { ...options, floor: 'both', cutaway: false, labels: false });
      const exportScene = new THREE.Scene();
      const copy = world.clone(true); copy.scale.setScalar(.3048); exportScene.add(copy); // glTF metres
      try { return await new GLTFExporter().parseAsync(exportScene, { binary: true, onlyVisible: true }) as ArrayBuffer; }
      finally { walking = previousWalk; update(model, previous); }
    },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); disposeTree(world); disposeTree(labels); renderer.dispose(); renderer.domElement.remove();
      window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', resetKeys); document.removeEventListener('visibilitychange', resetKeys);
      renderer.domElement.removeEventListener('blur', resetKeys); renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', up);
    }
  };
}
