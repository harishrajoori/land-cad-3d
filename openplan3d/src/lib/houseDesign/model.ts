import profile from '../../../../requirements/home-requirements.json';

/**
 * Proportional generative house model.
 *
 * The same fixed requirements drive ANY plot size. Instead of hardcoded
 * coordinates, rooms are allocated proportionally into the buildable rectangle
 * with per-room minimum sizes, and the program degrades gracefully as space
 * shrinks (owner's rules):
 *   1) drop furniture that no longer fits its room
 *   2) shrink the Mallanna room toward its minimum
 *   3) below a threshold, merge the separate daily pooja into the Mallanna/pooja
 *   4) reduce parking (2 cars + 2 bikes -> 1 car -> bikes only)
 *   5) if the essential rooms cannot fit at minimum size, report it honestly
 *
 * Dimensions are feet; x runs east, z runs south; north is up (never rotates).
 */

export const requirements = profile.fixed;
export const REVISION = 'Concept 02 (proportional)';
export interface SiteInput { frontage: number; depth: number; }
export interface Rect { x: number; z: number; w: number; d: number; }
export interface Space extends Rect { id: string; name: string; floor: number; color: string; use: string; }
export interface Opening { offset: number; width: number; bottom: number; height: number; kind: 'door' | 'window'; }
export interface Segment { id: string; x1: number; z1: number; x2: number; z2: number; floor: number; rooms: string[]; openings: Opening[]; }
export interface Furnishing { id: string; catalog: string; x: number; z: number; floor: number; rotation: number; color?: string; }
export interface Connection { from: string; to: string; floor: number; }
export interface HouseConcept {
  input: SiteInput; valid: boolean; conflicts: string[]; assumptions: string[]; decisions: string[];
  rooms: Space[]; walls: Segment[]; furniture: Furnishing[]; connections: Connection[];
  house: Rect; patnam: Rect; stair: Rect; gardens: Rect[]; paths: Rect[];
  floorHeight: number; footprint: number; gardenArea: number;
  parking: { cars: number; bikes: number };
}
export const defaultSite: SiteInput = { frontage: 80, depth: 50 };
export const area = (r: Rect) => r.w * r.d;
export function contains(r: Rect, x: number, z: number, margin = 0) {
  return x >= r.x + margin && x <= r.x + r.w - margin && z >= r.z + margin && z <= r.z + r.d - margin;
}
export function overlaps(a: Rect, b: Rect) {
  return a.x < b.x + b.w - 1e-6 && a.x + a.w > b.x + 1e-6 && a.z < b.z + b.d - 1e-6 && a.z + a.d > b.z + 1e-6;
}
export const length = (s: Segment) => Math.hypot(s.x2 - s.x1, s.z2 - s.z1);
export const clearSize = (r: Space) => `${(r.w - .5).toFixed(1)} × ${(r.d - .5).toFixed(1)} ft`;

// ── Setbacks (feet). Front is the west road side; scale-independent. ──
const SETBACK = { front: 12, rear: 4, side: 3 };
// Minimum livable room sizes (feet). Below these we degrade rather than shrink further.
const MIN = {
  bedroomW: 9, bedroomD: 10, living: 11, dining: 8, kitchen: 7, bath: 5,
  pooja: 5, mallanna: 6, foyer: 4, hall: 3,
};
// Comfortable MAXIMUM footprint (feet). Rooms should be sized to function, not
// stretched to fill a large plot — surplus land becomes garden/verandah.
// These bound the total house envelope; individual rooms are proportioned within it.
const MAX = { houseW: 40, houseD: 52, corridor: 4, bandD: 14 };
const CORRIDOR = 3.5; // circulation spine width between the wings

/** Split a length into weighted parts, each at least its minimum. Returns cut positions. */
function allocate(total: number, weights: number[], mins: number[]): number[] | null {
  const minSum = mins.reduce((a, b) => a + b, 0);
  if (total < minSum - 1e-6) return null; // cannot fit even at minimums
  const extra = total - minSum;
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;
  const sizes = weights.map((w, i) => mins[i] + extra * (w / wSum));
  const cuts = [0];
  let acc = 0;
  for (const s of sizes) { acc += s; cuts.push(acc); }
  cuts[cuts.length - 1] = total;
  return cuts;
}

function makeRoom(rooms: Space[], id: string, name: string, floor: number, x: number, z: number, w: number, d: number, use: string, color: string) {
  rooms.push({ id: `${floor}-${id}`, name, floor, x, z, w, d, use, color });
}

export function createConcept(input: SiteInput = defaultSite): HouseConcept {
  const conflicts: string[] = [];
  const decisions: string[] = [];
  const okDims = [input.frontage, input.depth].every(n => Number.isFinite(n) && n > 0 && n <= 300);
  if (!okDims) conflicts.push('Enter positive plot dimensions up to 300 ft.');

  const model: HouseConcept = {
    input: { ...input }, valid: false, conflicts, decisions,
    rooms: [], walls: [], furniture: [], connections: [],
    house: { x: 0, z: 0, w: 0, d: 0 }, patnam: { x: 0, z: 0, w: 0, d: 0 }, stair: { x: 0, z: 0, w: 0, d: 0 },
    gardens: [], paths: [], floorHeight: 10.5, footprint: 0, gardenArea: 0,
    parking: { cars: 0, bikes: 0 },
    assumptions: [
      'Rectangular west-facing site; north is up. Other facings and irregular boundaries need a new layout.',
      `Setbacks used: ${SETBACK.front} ft front forecourt, ${SETBACK.rear} ft rear, ${SETBACK.side} ft sides. Design assumptions, not verified local rules.`,
      'Rooms are allocated proportionally to the plot with minimum livable sizes; furniture, the Mallanna room, the separate daily pooja and parking are reduced in that order when space is tight.',
      'Walls ~6 in; floor-to-floor 10 ft 6 in. Room schedule gives clear dimensions between wall faces.',
      'Mallanna shrine (raised platform, table, four decorated pillars) is generated from the actual room size. Heights, materials and deity facing need your review.',
      'Stair, structure, approvals, vehicle manoeuvring and accessibility need engineer review.',
    ],
  };
  if (!okDims) return model;

  // ── Buildable rectangle (the house footprint area within setbacks) ──
  // x: east across depth axis (plot depth runs E-W); z: south across frontage.
  const usableW = input.depth - SETBACK.front - SETBACK.side;   // east-west extent of the house
  const usableD = input.frontage - SETBACK.rear - SETBACK.side; // north-south extent
  const houseX = SETBACK.front, houseZ = SETBACK.rear;

  // Absolute minimum to hold the essential ground program in two side-by-side wings.
  const minW = MIN.living + MIN.bedroomW + 1;              // great room + bedroom wing columns
  const minD = MIN.foyer + MIN.living + MIN.bedroomD + 2;  // three depth bands
  if (usableW < minW || usableD < minD) {
    conflicts.push(`This plot (~${Math.round(input.frontage * input.depth)} sq ft) is too small for the full brief. Needs at least ~${Math.round((minW + SETBACK.front + SETBACK.side) * (minD + SETBACK.rear + SETBACK.side))} sq ft. A smaller home needs a reduced program, not compressed rooms.`);
    return model;
  }
  // Cap the house footprint so rooms are sized to function, not stretched across a
  // large plot. Extra land stays as garden/forecourt. The house is pushed to the
  // rear-east so the front (west road) keeps its forecourt + garden.
  const builtW = Math.min(usableW, MAX.houseW);
  const builtD = Math.min(usableD, MAX.houseD);
  const bHouseX = houseX; // keep against the front setback (forecourt is west of it)
  const bHouseZ = houseZ;
  model.house = { x: bHouseX, z: bHouseZ, w: builtW, d: builtD };

  // ── Degradation decisions based on the (capped) built floor area ──
  const areaSqft = builtW * builtD;
  // A corridor is only added when the plot is wide enough for both wings PLUS it.
  const hasCorridor = builtW >= MIN.living + CORRIDOR + MIN.bedroomW + 1;
  const corridorW = hasCorridor ? CORRIDOR : 0;
  // rule 3: merge daily pooja into the Mallanna/pooja space when tight OR when the
  // pooja wing is too narrow to hold both side by side.
  const poojaSplit = allocate(builtW - corridorW, [1.15, 1], [MIN.living, MIN.bedroomW]);
  const wingWForPooja = poojaSplit ? (builtW - corridorW - poojaSplit[1]) : 0;
  let sepDailyPooja = areaSqft >= 900 && wingWForPooja >= MIN.pooja + MIN.mallanna;
  if (!sepDailyPooja) decisions.push('Tight plot: the separate daily pooja is merged into the Mallanna/pooja space.');
  // rule 5: parking degrades with forecourt width (plot depth).
  if (input.depth >= 45) model.parking = { cars: 2, bikes: 2 };
  else if (input.depth >= 32) { model.parking = { cars: 1, bikes: 2 }; decisions.push('Reduced parking to 1 car + 2 two-wheelers for the narrower forecourt.'); }
  else { model.parking = { cars: 0, bikes: 2 }; decisions.push('Very tight forecourt: two-wheeler parking only.'); }

  // ── Structure ──
  //  columns (east-west): great-room wing | CORRIDOR spine | bedroom/pooja wing
  //  depth bands: front (foyer|bath || pooja) | middle (living || bed2) |
  //               near-rear (dining|kitchen || bed3) | rear master band
  // The corridor is a real circulation spine so every private room is reached
  // from it, not through another room.
  const masterD = Math.min(15, Math.max(MIN.bedroomD, builtD * 0.24));
  // Cap each of the three front bands to a comfortable depth so rooms don't become
  // over-deep on a large plot; any surplus depth is left as rear garden.
  const rawBodyD = builtD - masterD;
  const bodyD = Math.min(rawBodyD, 3 * MAX.bandD);
  const bands = allocate(bodyD, [0.85, 1.2, 1.0], [MIN.foyer, MIN.living, MIN.dining]);
  if (!bands) { conflicts.push('Plot depth is too small for the room bands at minimum sizes.'); return model; }
  // The house depth actually used (bands + master), which may be less than builtD.
  const usedD = bodyD + masterD;
  model.house = { x: bHouseX, z: bHouseZ, w: builtW, d: usedD };

  const cols = allocate(builtW - corridorW, [1.15, 1], [MIN.living, MIN.bedroomW]);
  if (!cols) { conflicts.push('Plot width is too small for both wings at minimum sizes.'); return model; }
  const gW = cols[1];                       // great-room wing width
  const corridorX = bHouseX + gW;           // corridor starts after the great-room wing
  const midX = corridorX + corridorW;       // bedroom wing starts after the corridor
  const wingW = builtW - gW - corridorW;    // bedroom/pooja wing width
  const houseXX = bHouseX;

  for (const f of [0, 1]) {
    const z0 = bHouseZ, z1 = bHouseZ + bands[1], z2 = bHouseZ + bands[2], z3 = bHouseZ + bodyD;
    const zMasterEnd = bHouseZ + usedD;
    const houseX = houseXX;
    const usableW = builtW;
    const terrace = f === 0 ? 'mallanna' : 'terrace';

    // Circulation spine (full depth of the front bands), linking foyer to the wing.
    if (hasCorridor) makeRoom(model.rooms, 'corr', 'Passage', f, corridorX, z0, corridorW, z3 - z0, 'hall', '#f1ebe1');

    // Great-room wing (west column). Front band: foyer + bath side by side if it
    // fits, else foyer only (bath moves to the pooja wing edge — degradation).
    // Front band: foyer takes most of the width; the common bath is capped to a
    // realistic ~6 ft (not stretched to fill the band).
    const bathW = Math.min(6.5, Math.max(MIN.bath, gW * 0.35));
    if (gW - bathW >= MIN.foyer) {
      makeRoom(model.rooms, 'foyer', f === 0 ? 'Entrance foyer' : 'Independent entry', f, houseX, z0, gW - bathW, z1 - z0, 'hall', '#ece5d8');
      makeRoom(model.rooms, 'bath', 'Common bathroom', f, houseX + gW - bathW, z0, bathW, z1 - z0, 'bath', '#cbdedc');
    } else {
      makeRoom(model.rooms, 'foyer', f === 0 ? 'Entrance foyer' : 'Independent entry', f, houseX, z0, gW * 0.55, z1 - z0, 'hall', '#ece5d8');
      makeRoom(model.rooms, 'bath', 'Common bathroom', f, houseX + gW * 0.55, z0, gW * 0.45, z1 - z0, 'bath', '#cbdedc');
    }
    makeRoom(model.rooms, 'living', 'Living', f, houseX, z1, gW, z2 - z1, 'living', '#e6d4bd');
    // Dining + kitchen side by side if the wing is wide enough, else stacked in the band.
    const dkCols = allocate(gW, [1, 1], [MIN.dining, MIN.kitchen]);
    if (dkCols) {
      makeRoom(model.rooms, 'dining', 'Dining', f, houseX, z2, dkCols[1], z3 - z2, 'dining', '#e9dac4');
      makeRoom(model.rooms, 'kitchen', 'Kitchen', f, houseX + dkCols[1], z2, gW - dkCols[1], z3 - z2, 'kitchen', '#d3d9c5');
    } else {
      const mid = z2 + (z3 - z2) * 0.5;
      makeRoom(model.rooms, 'dining', 'Dining', f, houseX, z2, gW, mid - z2, 'dining', '#e9dac4');
      makeRoom(model.rooms, 'kitchen', 'Kitchen', f, houseX, mid, gW, z3 - mid, 'kitchen', '#d3d9c5');
    }

    // Bedroom/pooja wing (east column). Front band = pooja(s).
    const pCols = sepDailyPooja ? allocate(wingW, [1, 1.3], [MIN.pooja, MIN.mallanna])! : null;
    if (sepDailyPooja && pCols) {
      makeRoom(model.rooms, 'daily', f === 0 ? 'Daily pooja' : 'Pooja / quiet', f, midX, z0, pCols[1], z1 - z0, 'pooja', '#efd6ab');
      makeRoom(model.rooms, terrace, f === 0 ? 'Mallanna pooja' : 'Open terrace', f, midX + pCols[1], z0, wingW - pCols[1], z1 - z0, f === 0 ? 'pooja' : 'outdoor', '#e6cda8');
    } else {
      makeRoom(model.rooms, terrace, f === 0 ? 'Pooja (Mallanna + daily)' : 'Open terrace', f, midX, z0, wingW, z1 - z0, f === 0 ? 'pooja' : 'outdoor', '#e6cda8');
    }
    // Middle band: bedroom 2 (opens off the corridor spine — no through-rooms).
    makeRoom(model.rooms, 'bed2', 'Bedroom 2', f, midX, z1, wingW, z2 - z1, 'bedroom', '#dfcfbd');
    // Near-rear band: bedroom 3 / study.
    makeRoom(model.rooms, f === 0 ? 'bed3' : 'utility', f === 0 ? 'Bedroom 3' : 'Study', f, midX, z2, wingW, z3 - z2, f === 0 ? 'bedroom' : 'utility', '#e1d6c6');
    // Rear band: master bedroom sized to ~14–16 ft wide (not full width) + attached
    // bath; the remaining rear width becomes a utility/store so no room is oversized.
    const masterD2 = zMasterEnd - z3;
    if (builtW >= 26 && masterD2 >= 8) {
      // Compute final widths first, then place master | mbath | store left-to-right.
      const bathW = Math.min(7, Math.max(MIN.bath, builtW * 0.2));
      const masterW = Math.min(16, Math.max(MIN.bedroomW + 3, usableW - bathW - 6));  // cap master ≈14–16 ft
      const storeW = usableW - bathW - masterW;                       // leftover -> store/wardrobe
      makeRoom(model.rooms, 'master', 'Master bedroom', f, houseX, z3, masterW, masterD2, 'bedroom', '#d8c6b0');
      makeRoom(model.rooms, 'mbath', f === 0 ? 'Master bath' : 'Bath', f, houseX + masterW, z3, bathW, masterD2, 'bath', '#cbdedc');
      if (storeW >= MIN.bath) makeRoom(model.rooms, 'store', f === 0 ? 'Store / wardrobe' : 'Store', f, houseX + masterW + bathW, z3, storeW, masterD2, 'utility', '#ded8cb');
    } else {
      makeRoom(model.rooms, 'master', 'Master bedroom', f, houseX, z3, usableW, masterD2, 'bedroom', '#d8c6b0');
    }
  }

  buildWalls(model);
  connectRooms(model, sepDailyPooja);
  placeWindows(model);
  placeFurniture(model);
  placeParkingAndOutdoor(model, input);

  model.footprint = area(model.house);
  model.gardenArea = model.gardens.reduce((n, r) => n + area(r), 0);
  model.valid = conflicts.length === 0 && roomReachability(model, 0).length === 0;
  if (!model.valid && conflicts.length === 0) conflicts.push('Could not connect every room on this plot; the layout needs manual review.');
  return model;
}

// ── Walls: split coincident room boundaries into shared segments ──
function buildWalls(model: HouseConcept) {
  for (const floor of [0, 1]) {
    const rooms = model.rooms.filter(r => r.floor === floor);
    const edges = rooms.flatMap(r => [
      { x1: r.x, z1: r.z, x2: r.x + r.w, z2: r.z, room: r.id },
      { x1: r.x, z1: r.z + r.d, x2: r.x + r.w, z2: r.z + r.d, room: r.id },
      { x1: r.x, z1: r.z, x2: r.x, z2: r.z + r.d, room: r.id },
      { x1: r.x + r.w, z1: r.z, x2: r.x + r.w, z2: r.z + r.d, room: r.id },
    ]);
    const unique = new Map<string, Segment>();
    for (const e of edges) {
      const horizontal = Math.abs(e.z1 - e.z2) < 1e-6;
      const min = horizontal ? e.x1 : e.z1, max = horizontal ? e.x2 : e.z2;
      const cuts = [...new Set(edges.flatMap(o => [{ x: o.x1, z: o.z1 }, { x: o.x2, z: o.z2 }])
        .filter(p => Math.abs(horizontal ? p.z - e.z1 : p.x - e.x1) < 1e-6)
        .map(p => horizontal ? p.x : p.z).filter(t => t >= min - 1e-6 && t <= max + 1e-6))].sort((a, b) => a - b);
      for (let i = 0; i < cuts.length - 1; i++) {
        const coords = horizontal ? [cuts[i], e.z1, cuts[i + 1], e.z2] : [e.x1, cuts[i], e.x2, cuts[i + 1]];
        const key = coords.map(v => v.toFixed(4)).join(',');
        const existing = unique.get(key);
        if (existing) { if (!existing.rooms.includes(e.room)) existing.rooms.push(e.room); }
        else unique.set(key, { id: `wall-${floor}-${unique.size}`, x1: coords[0], z1: coords[1], x2: coords[2], z2: coords[3], floor, rooms: [e.room], openings: [] });
      }
    }
    model.walls.push(...unique.values());
  }
}

// ── Doors: connect adjacent rooms that share a wall long enough ──
function connectRooms(model: HouseConcept, sepDailyPooja: boolean) {
  const connect = (floor: number, a: string, b: string, want = 3): boolean => {
    const from = `${floor}-${a}`, to = `${floor}-${b}`;
    const wall = model.walls.filter(w => w.rooms.includes(from) && w.rooms.includes(to) && !w.openings.length)
      .sort((p, q) => length(q) - length(p))[0];
    if (!wall) return false;
    const width = Math.min(want, length(wall) - 1);
    if (width < 2) return false;
    wall.openings.push({ offset: length(wall) / 2, width, bottom: 0, height: 7, kind: 'door' });
    model.connections.push({ from, to, floor });
    return true;
  };
  for (const f of [0, 1]) {
    const terrace = f === 0 ? 'mallanna' : 'terrace';
    const hasCorr = model.rooms.some(r => r.id === `${f}-corr`);
    const hub = hasCorr ? 'corr' : 'living';   // circulation hub for private rooms
    // Open-plan great room.
    connect(f, 'foyer', 'living', 4);
    connect(f, 'living', 'dining', 6);
    connect(f, 'dining', 'kitchen', 5);
    connect(f, 'foyer', 'bath', 2.5);
    // Corridor spine links the great room to the private wing.
    if (hasCorr) {
      connect(f, 'foyer', 'corr', 3) || connect(f, 'living', 'corr', 3);
      connect(f, 'living', 'corr', 3);
    }
    // Private rooms + pooja open off the hub (corridor, or living if no corridor).
    if (sepDailyPooja) {
      connect(f, terrace, 'daily', 3);
      connect(f, hub, 'daily', 3) || connect(f, 'daily', 'bath', 2.5) || connect(f, 'daily', 'bed2', 3);
      connect(f, hub, terrace, 3) || connect(f, terrace, 'bed2', 3);
    } else {
      connect(f, hub, terrace, 3) || connect(f, terrace, 'bath', 3) || connect(f, terrace, 'bed2', 3);
    }
    connect(f, hub, 'bed2', 3) || connect(f, 'living', 'bed2', 3);
    connect(f, hub, f === 0 ? 'bed3' : 'utility', 3) || connect(f, 'bed2', f === 0 ? 'bed3' : 'utility', 3);
    connect(f, hub, 'master', 3) || connect(f, 'master', 'dining', 3) || connect(f, 'master', 'kitchen', 3) || connect(f, 'master', f === 0 ? 'bed3' : 'utility', 3);
    // Master's attached bath + store open off the master.
    connect(f, 'master', 'mbath', 2.5);
    connect(f, 'master', 'store', 2.5) || connect(f, 'mbath', 'store', 2.5) || connect(f, hub, 'store', 2.5);
    // Front entrance: a door on any exterior wall of the foyer (prefer the west road side).
    const entryId = `${f}-foyer`;
    const foyerExt = model.walls.filter(w => w.rooms.length === 1 && w.rooms[0] === entryId && length(w) > 2.5);
    const entrance = foyerExt.sort((a, b) => {
      const aWest = Math.abs(a.x1 - model.house.x) < 1e-6 && Math.abs(a.x2 - model.house.x) < 1e-6 ? 1 : 0;
      const bWest = Math.abs(b.x1 - model.house.x) < 1e-6 && Math.abs(b.x2 - model.house.x) < 1e-6 ? 1 : 0;
      return (bWest - aWest) || (length(b) - length(a));
    })[0];
    if (entrance) {
      entrance.openings.push({ offset: length(entrance) / 2, width: Math.min(3.5, length(entrance) - 1), bottom: 0, height: 7.5, kind: 'door' });
      model.connections.push({ from: 'outside', to: entryId, floor: f });
    }
  }
}

// ── Windows on exterior room walls ──
function placeWindows(model: HouseConcept) {
  for (const f of [0, 1]) {
    for (const r of model.rooms.filter(r => r.floor === f && r.use !== 'hall')) {
      const wall = model.walls.filter(w => w.rooms.length === 1 && w.rooms[0] === r.id && !w.openings.length && length(w) > 4)
        .sort((a, b) => length(b) - length(a))[0];
      if (wall) {
        const bath = r.use === 'bath';
        wall.openings.push({ offset: length(wall) / 2, width: Math.min(bath ? 2 : 4, length(wall) - 1), bottom: bath ? 6 : 3, height: bath ? 2 : 4, kind: 'window' });
      }
    }
  }
}

// ── Parametric furniture: sized to a fraction of the room, dropped if it won't fit ──
function placeFurniture(model: HouseConcept) {
  let serial = 0;
  const add = (catalog: string, x: number, z: number, floor: number, rotation = 0, color?: string) =>
    model.furniture.push({ id: `f-${serial++}`, catalog, x, z, floor, rotation, color });
  // A piece fits only if the room has room for it plus clearance.
  const fits = (r: Space, needW: number, needD: number) => r.w >= needW + 1 && r.d >= needD + 1;

  for (const r of model.rooms) {
    const cx = r.x + r.w / 2, f = r.floor;
    if (r.use === 'bedroom') {
      const isMaster = r.id.endsWith('master');
      if (fits(r, isMaster ? 6.5 : 5, isMaster ? 7 : 6.5)) add('bed_queen', cx, r.z + (isMaster ? 4.5 : 4), f, 0, '#b79271');
      if (fits(r, 9, 9)) add('wardrobe', r.x + 2, r.z + r.d - 1.6, f, 0, '#80664e');       // only if there's spare wall
      if (fits(r, 7, 7)) add('nightstand', r.x + r.w - 1.4, r.z + 3, f);
    } else if (r.use === 'living') {
      if (fits(r, 6.5, 4)) add('sofa', cx, r.z + 2.2, f, 0, '#728776');
      if (fits(r, 9, 9)) add('coffee_table', cx, r.z + 6, f);
    } else if (r.use === 'dining') {
      if (fits(r, 5, 5)) {
        add('dining_table', cx, r.z + r.d / 2, f);
        if (fits(r, 8, 8)) for (const dx of [-2.4, 2.4]) for (const dz of [-1.4, 1.4]) add('dining_chair', cx + dx, r.z + r.d / 2 + dz, f, dx > 0 ? -90 : 90);
      }
    } else if (r.use === 'kitchen') {
      if (fits(r, 6, 6)) { add('counter', r.x + r.w - 1.3, r.z + 3, f, 90, '#718170'); add('stove', r.x + r.w - 1.3, r.z + r.d - 2, f, 90); add('fridge', r.x + 2, r.z + r.d - 2, f); }
    } else if (r.use === 'bath') {
      if (fits(r, 4, 4)) { add('toilet', r.x + 1.4, r.z + 2, f); add('sink_b', r.x + r.w - 1.3, r.z + 1.3, f); if (fits(r, 6, 6)) add('shower', r.x + r.w - 1.6, r.z + r.d - 2, f); }
    } else if (r.use === 'utility') {
      if (fits(r, 5, 5)) add(f === 0 ? 'washer_dryer' : 'desk', r.x + r.w - 2.5, r.z + 2, f);
    }
    // Pooja rooms: shrine handled parametrically in the scene; a small table if room allows.
    if (r.id === '0-daily' && fits(r, 4, 4)) add('side_table', cx, r.z + 1.5, f);
  }
}

// ── Outdoor: forecourt parking (per degraded counts), Patnam, gardens, stair, paths ──
function placeParkingAndOutdoor(model: HouseConcept, input: SiteInput) {
  let serial = model.furniture.length;
  const add = (catalog: string, x: number, z: number, rotation = 0, color?: string) =>
    model.furniture.push({ id: `p-${serial++}`, catalog, x, z, floor: 0, rotation, color });

  const forecourtW = SETBACK.front;        // west forecourt depth (x 0..front)
  const frontage = input.frontage;
  // Cars nose-in in the west car lane (x≈1..7); each ~6 ft wide × ~16 ft deep,
  // stacked along z with clearance. Bikes sit in a separate lane (x≈8.5..11) at a
  // z band clear of the cars. Everything stays west of the entrance walkway.
  const carLaneX = Math.max(3, forecourtW / 2 - 2);
  for (let i = 0; i < model.parking.cars; i++) add(i === 0 ? 'car_suv' : 'car_sedan', carLaneX, 9 + i * 18, 0, i === 0 ? '#f0ede5' : '#496579');
  const bikeZ = 9 + model.parking.cars * 18 + 3;   // start bikes past the last car
  for (let i = 0; i < model.parking.bikes; i++) add('motorcycle', carLaneX - 1.5 + i * 3.2, bikeZ, 0);

  // Patnam: outdoor drawing space in front, sized to the forecourt but capped.
  const pSize = Math.min(12, forecourtW - 2, frontage * 0.2);
  model.patnam = { x: 1, z: frontage - SETBACK.rear - pSize - 4, w: pSize, d: pSize };

  // Dedicated external stair to the first floor, in the forecourt, clear of Patnam.
  model.stair = { x: 2, z: 1, w: Math.min(9, forecourtW - 4), d: 16 };

  model.gardens = [
    { x: 0, z: frontage - SETBACK.rear, w: input.depth, d: SETBACK.rear },                 // rear strip (north)
    { x: model.house.x + model.house.w, z: SETBACK.rear, w: SETBACK.side, d: model.house.d }, // east side strip
  ].filter(g => g.w > 0.5 && g.d > 0.5);

  const foyer = model.rooms.find(r => r.id === '0-foyer');
  const foyerZ = foyer ? foyer.z + foyer.d / 2 : 8;
  model.paths = [
    { x: model.house.x - 3, z: 1, w: 3, d: Math.max(3, foyerZ) },  // walkway to the front door
    { x: 0, z: model.stair.z, w: model.stair.w, d: 1 },            // stair approach
  ];
}

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
