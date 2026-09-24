import profile from '../../../../requirements/home-requirements.json';

/** Concept dimensions are feet; x runs east and z runs south. North never rotates. */
export const requirements = profile.fixed;
export const REVISION = 'Concept 01';
export interface SiteInput { frontage: number; depth: number; }
export interface Rect { x: number; z: number; w: number; d: number; }
export interface Space extends Rect { id: string; name: string; floor: number; color: string; use: string; }
export interface Opening { offset: number; width: number; bottom: number; height: number; kind: 'door' | 'window'; }
export interface Segment { id: string; x1: number; z1: number; x2: number; z2: number; floor: number; rooms: string[]; openings: Opening[]; }
export interface Furnishing { id: string; catalog: string; x: number; z: number; floor: number; rotation: number; color?: string; }
export interface Connection { from: string; to: string; floor: number; }
export interface HouseConcept {
  input: SiteInput; valid: boolean; conflicts: string[]; assumptions: string[];
  rooms: Space[]; walls: Segment[]; furniture: Furnishing[]; connections: Connection[];
  house: Rect; patnam: Rect; stair: Rect; gardens: Rect[]; paths: Rect[];
  floorHeight: number; footprint: number; gardenArea: number;
}
export const defaultSite: SiteInput = { frontage: 80, depth: 50 };
export const area = (r: Rect) => r.w * r.d;
export function contains(r: Rect, x: number, z: number, margin = 0) {
  return x >= r.x + margin && x <= r.x + r.w - margin && z >= r.z + margin && z <= r.z + r.d - margin;
}
export function overlaps(a: Rect, b: Rect) {
  return a.x < b.x + b.w - 1e-6 && a.x + a.w > b.x + 1e-6 && a.z < b.z + b.d - 1e-6 && a.z + a.d > b.z + 1e-6;
}
export function createConcept(input: SiteInput = defaultSite): HouseConcept {
  const conflicts: string[] = [];
  if (![input.frontage, input.depth].every(n => Number.isFinite(n) && n > 0 && n <= 200)) conflicts.push('Enter positive plot dimensions up to 200 ft.');
  if (input.frontage < 80 || input.depth < 50) conflicts.push('This arrangement needs at least 80 ft west frontage × 50 ft depth. Your requirements are retained; a smaller site needs a different layout, not scaled-down rooms.');
  const model: HouseConcept = {
    input: { ...input }, valid: !conflicts.length, conflicts, rooms: [], walls: [], furniture: [], connections: [],
    house: { x: 18, z: 4, w: input.depth - 21, d: input.frontage - 14 },
    patnam: { x: 1, z: 35, w: 12, d: 12 }, stair: { x: 3, z: 53, w: 9, d: 17 },
    gardens: [], paths: [], floorHeight: 10.5, footprint: 0, gardenArea: 0,
    assumptions: [
      'Rectangular west-facing site; north is up. Other facings and irregular boundaries need a new layout.',
      'Concept offsets: 18 ft front forecourt, 3 ft east, 4 ft north and 10 ft south. These are design assumptions, not verified local setbacks.',
      'Walls are 6 in thick; floor-to-floor height is 10 ft 6 in. Room schedule gives clear dimensions between wall faces.',
      'Outdoor Patnam reserve: 12 × 12 ft, with its west edge inside the plot. Confirm the ritual footprint with your pujari.',
      'Mallanna shrine: 6 × 4 ft raised platform, 1 ft high; four decorated pillars and a canopy. Dimensions and deity facing need your review; no deity likeness is invented.',
      'Open-plan great room: living, dining and kitchen flow together in the west/front half, entered through a foyer — a home layout, not room-off-a-corridor. Bedrooms form a private rear wing off a short hall. Review room directions against your Vaastu consultant.',
      'First floor mirrors the ground shell: two bedrooms, the open living/dining/kitchen, bath and a study; the dedicated external stair enters its own foyer.',
      'Stair geometry, structure, approvals, vehicle manoeuvring and accessibility need engineer review. Eye-level exploration is a visual inspection, not a stair or clearance certification.'
    ]
  };
  if (!model.valid) return model;
  const A = 18, D = input.depth - 3, B = A + (D - A - 4) / 2, C = B + 4;
  const Y = (y: number) => 4 + (y - 4) * (input.frontage - 14) / 66;
  const room = (id: string, name: string, floor: number, x1: number, z1: number, x2: number, z2: number, use: string, color: string) => {
    model.rooms.push({ id: `${floor}-${id}`, name, floor, x: x1, z: Y(z1), w: x2 - x1, d: Y(z2) - Y(z1), use, color });
  };
  for (const f of [0, 1]) {
    // Home-style, not hotel: a compact front foyer opens into a large connected
    // living+dining+kitchen "great room" (the west/front half). Bedrooms sit in a
    // private rear wing served by a SHORT hall — no full-length spine corridor.
    // Vaastu intent kept: kitchen SE, master SW/rear, pooja NE band.
    room('foyer', f === 0 ? 'Entrance foyer' : 'Independent entry', f, A, 4, A + 9, 14, 'hall', '#ece5d8');
    room('bath', 'Common bathroom', f, A + 9, 4, B, 14, 'bath', '#cbdedc');
    room('daily', f === 0 ? 'Daily pooja' : 'Pooja / quiet', f, B, 4, C, 14, 'pooja', '#efd6ab');
    room('living', 'Living', f, A, 14, B, 34, 'living', '#e6d4bd');
    room('dining', 'Dining', f, A, 34, B, 52, 'dining', '#e9dac4');
    room('kitchen', 'Kitchen', f, B, 34, C, 52, 'kitchen', '#d3d9c5');
    room(f === 0 ? 'mallanna' : 'terrace', f === 0 ? 'Mallanna pooja' : 'Open terrace', f, B, 14, C, 34, f === 0 ? 'pooja' : 'outdoor', '#e6cda8');
    room('hall', 'Hall', f, C, 14, D, 24, 'hall', '#f1ebe1');
    room('bed2', 'Bedroom 2', f, C, 4, D, 14, 'bedroom', '#dfcfbd');
    // Ground floor: 3 bedrooms (master, bed2, bed3). First floor: 2 bedrooms
    // (master, bed2) — bed3's slot becomes a study/utility upstairs.
    room(f === 0 ? 'bed3' : 'utility', f === 0 ? 'Bedroom 3' : 'Study', f, C, 24, D, 40, f === 0 ? 'bedroom' : 'utility', '#e1d6c6');
    room('master', 'Master bedroom', f, A, 52, C, 70, 'bedroom', '#d8c6b0');
    room(f === 0 ? 'store' : 'store', f === 0 ? 'Store / dressing' : 'Store', f, C, 40, D, 70, 'utility', '#ded8cb');
  }
  // Split all coincident boundaries at room corners, yielding one wall per shared segment.
  for (const floor of [0, 1]) {
    const rooms = model.rooms.filter(r => r.floor === floor);
    const edges = rooms.flatMap(r => [
      { x1: r.x, z1: r.z, x2: r.x + r.w, z2: r.z, room: r.id },
      { x1: r.x, z1: r.z + r.d, x2: r.x + r.w, z2: r.z + r.d, room: r.id },
      { x1: r.x, z1: r.z, x2: r.x, z2: r.z + r.d, room: r.id },
      { x1: r.x + r.w, z1: r.z, x2: r.x + r.w, z2: r.z + r.d, room: r.id }
    ]);
    const unique = new Map<string, Segment>();
    for (const e of edges) {
      const horizontal = e.z1 === e.z2;
      const min = horizontal ? e.x1 : e.z1, max = horizontal ? e.x2 : e.z2;
      const cuts = [...new Set(edges.flatMap(o => [{ x: o.x1, z: o.z1 }, { x: o.x2, z: o.z2 }])
        .filter(p => Math.abs((horizontal ? p.z - e.z1 : p.x - e.x1)) < 1e-6)
        .map(p => horizontal ? p.x : p.z).filter(t => t >= min && t <= max))].sort((a, b) => a - b);
      for (let i = 0; i < cuts.length - 1; i++) {
        const coords = horizontal ? [cuts[i], e.z1, cuts[i + 1], e.z2] : [e.x1, cuts[i], e.x2, cuts[i + 1]];
        const key = coords.map(v => v.toFixed(5)).join(',');
        const existing = unique.get(key);
        if (existing) { if (!existing.rooms.includes(e.room)) existing.rooms.push(e.room); }
        else unique.set(key, { id: `wall-${floor}-${unique.size}`, x1: coords[0], z1: coords[1], x2: coords[2], z2: coords[3], floor, rooms: [e.room], openings: [] });
      }
    }
    model.walls.push(...unique.values());
  }
  const connect = (floor: number, a: string, b: string, width = 3) => {
    const from = `${floor}-${a}`, to = `${floor}-${b}`;
    const wall = model.walls.filter(w => w.rooms.includes(from) && w.rooms.includes(to)).sort((a, b) => length(b) - length(a))[0];
    if (!wall || length(wall) < width + .6) throw new Error(`No room for ${a} → ${b} door`);
    wall.openings.push({ offset: length(wall) / 2, width, bottom: 0, height: 7, kind: 'door' });
    model.connections.push({ from, to, floor });
  };
  for (const f of [0, 1]) {
    // Connections use only real shared edges. Open-plan great room: the
    // living<->dining<->kitchen openings are wide so they read as one space.
    const terrace = f === 0 ? 'mallanna' : 'terrace';
    connect(f, 'foyer', 'living', 4);       // foyer|living  (9)
    connect(f, 'living', 'dining', 8);      // wide open plan (12.5)
    connect(f, 'dining', 'kitchen', 6);     // (18)
    connect(f, 'foyer', 'bath', 2.5);       // (10)
    connect(f, 'bath', 'daily', 3);         // (10)
    connect(f, 'living', terrace, 4);       // living|mallanna (20)
    connect(f, terrace, 'hall', 3.5);       // mallanna|hall (10) -> gateway to bedroom wing
    connect(f, 'hall', 'bed2', 3);          // (12.5)
    connect(f, 'hall', f === 0 ? 'bed3' : 'utility', 3); // hall|bed3 (12.5)
    connect(f, 'dining', 'master', 3);      // (12.5)
    connect(f, 'master', 'store', 3);       // master|store share x=C (18)
    const entryId = `${f}-foyer`;
    const entrance = model.walls.find(w => w.rooms.length === 1 && w.rooms[0] === entryId && w.x1 === A && w.x2 === A)!;
    entrance.openings.push({ offset: length(entrance) / 2, width: 3.5, bottom: 0, height: 7.5, kind: 'door' });
    model.connections.push({ from: 'outside', to: entryId, floor: f });
    for (const r of model.rooms.filter(r => r.floor === f && r.use !== 'hall')) {
      const candidates = model.walls.filter(w => w.rooms.length === 1 && w.rooms[0] === r.id && !w.openings.length && length(w) > 4);
      const w = candidates.sort((a, b) => length(b) - length(a))[0];
      if (w) w.openings.push({ offset: length(w) / 2, width: r.use === 'bath' ? 2 : 4, bottom: r.use === 'bath' ? 6 : 3, height: r.use === 'bath' ? 2 : 4, kind: 'window' });
    }
  }
  let serial = 0;
  const furniture = (catalog: string, x: number, z: number, floor: number, rotation = 0, color?: string) => model.furniture.push({ id: `f-${serial++}`, catalog, x, z, floor, rotation, color });
  for (const r of model.rooms) {
    const x = r.x, z = r.z, f = r.floor;
    if (r.use === 'bedroom') {
      furniture('bed_queen', x + r.w / 2, z + 4.3, f, 0, '#b79271');
      furniture('wardrobe', x + 3, z + r.d - 1.4, f, 0, '#80664e');
      furniture('nightstand', x + r.w - 1.5, z + 3.2, f);
    } else if (r.use === 'living') {
      furniture('sofa', x + r.w / 2, z + 2, f, 0, '#728776');
      furniture('coffee_table', x + r.w / 2, z + 6, f);
      furniture('tv_stand', x + r.w / 2, z + r.d - 1.2, f);
    } else if (r.use === 'dining') {
      furniture('dining_table', x + r.w / 2, z + r.d / 2, f);
      for (const dx of [-2.6, 2.6]) for (const dz of [-1.5, 1.5]) furniture('dining_chair', x + r.w / 2 + dx, z + r.d / 2 + dz, f, dx > 0 ? -90 : 90);
    } else if (r.use === 'kitchen') {
      furniture('counter', x + r.w - 1.3, z + 3, f, 90, '#718170');
      furniture('sink_k', x + r.w - 1.3, z + 6.1, f, 90);
      furniture('counter', x + r.w - 1.3, z + 9.2, f, 90, '#718170');
      furniture('stove', x + r.w - 1.3, z + r.d - 2, f, 90);
      furniture('fridge', x + 2, z + r.d - 2, f);
    } else if (r.use === 'bath') {
      furniture('toilet', x + 1.5, z + 2, f);
      furniture('sink_b', x + r.w - 1.4, z + 1.3, f);
      furniture('shower', x + r.w - 1.8, z + r.d - 2, f);
    } else if (r.id.endsWith('utility')) {
      furniture(f === 0 ? 'washer_dryer' : 'desk', x + r.w - 2.5, z + 2, f);
    } else if (r.id.endsWith('daily')) {
      furniture('side_table', x + r.w / 2, z + 1.5, f);
    }
  }
  // Park nose-in (rotation 0) so each car is ~6 ft wide × ~16 ft deep and sits in a
  // tidy column near the west boundary, leaving the x=15 entrance walkway clear.
  for (let i = 0; i < requirements.parking.cars; i++) furniture(i === 0 ? 'car_suv' : 'car_sedan', 6.5, 9 + i * 17, 0, 0, i === 0 ? '#f0ede5' : '#496579');
  // Two-wheelers park nose-in (each ~2.6 ft wide) in the narrow lane between the
  // car column (x≈3..10) and the entrance walkway (x=15), north of the Patnam reserve.
  for (let i = 0; i < requirements.parking.twoWheelers; i++) furniture('motorcycle', 11 + i * 2.9, 20, 0, 0);
  model.gardens = [
    { x: 0, z: input.frontage - 10, w: input.depth, d: 10 },
    { x: 18, z: 0, w: input.depth - 18, d: 4 },
    { x: input.depth - 3, z: 4, w: 3, d: input.frontage - 14 }
  ];
  model.gardenArea = model.gardens.reduce((n, r) => n + area(r), 0);
  model.footprint = area(model.house);
  // Stairs keep their full tread sizes; bridge tracks the upper foyer on longer sites.
  const entry = model.rooms.find(r => r.id === '1-foyer')!;
  model.stair.z = entry.z + entry.d / 2 - 2;
  const foyer = model.rooms.find(r => r.id === '0-foyer')!;
  const foyerZ = foyer.z + foyer.d / 2; // walkway meets the foyer door
  // Entrance walkway hugs the house (x 15..18) so it stays clear of the forecourt
  // parking (cars at x≈8.5, two-wheelers at x≈3.8/11.2). A short spur reaches the stair.
  model.paths = [
    { x: 15, z: 1, w: 3, d: Math.max(3, foyerZ) + 1.5 },
    { x: 0, z: model.stair.z - 1, w: 3, d: model.stair.d + 2 }
  ];
  return model;
}
export const length = (s: Segment) => Math.hypot(s.x2 - s.x1, s.z2 - s.z1);
export const clearSize = (r: Space) => `${(r.w - .5).toFixed(1)} × ${(r.d - .5).toFixed(1)} ft`;
export function roomReachability(model: HouseConcept, floor: number) {
  const seen = new Set(['outside']);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of model.connections.filter(c => c.floor === floor)) {
      if (seen.has(c.from) && !seen.has(c.to)) { seen.add(c.to); changed = true; }
      if (seen.has(c.to) && !seen.has(c.from)) { seen.add(c.from); changed = true; }
    }
  }
  return model.rooms.filter(r => r.floor === floor && !seen.has(r.id)).map(r => r.name);
}
