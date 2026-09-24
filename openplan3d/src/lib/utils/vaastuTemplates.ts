import type { Project, Floor, Wall, Door, Window, FurnitureItem, Stair } from '$lib/models/types';
import type { HouseTemplate } from './houseTemplates';

/**
 * Vaastu house templates.
 *
 * Generates G+1 (ground + first floor) plans with rooms auto-placed by the
 * traditional Vastu Purush Mandala. All coordinates in centimetres.
 *
 * Coordinate convention (matches openPlan3D screen space):
 *   +x = East (right), -x = West (left)
 *   +y = South (down),  -y = North (up)   → North is at the TOP of the plan.
 *
 * Vaastu zones are ABSOLUTE compass directions, so a kitchen always lands in the
 * real South-East corner regardless of which way the plot faces. The plot's
 * `facing` only decides which exterior wall carries the main entrance (the road side).
 */

const FT = 30.48; // 1 foot in cm

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export type Zone = 'NW' | 'N' | 'NE' | 'W' | 'C' | 'E' | 'SW' | 'S' | 'SE';
export type Facing = 'N' | 'E' | 'S' | 'W';

/** Absolute zone -> grid cell [col, row]; col 0=West..2=East, row 0=North..2=South. */
const ZONE_CELL: Record<Zone, [number, number]> = {
  NW: [0, 0], N: [1, 0], NE: [2, 0],
  W:  [0, 1], C: [1, 1], E:  [2, 1],
  SW: [0, 2], S: [1, 2], SE: [2, 2],
};

export interface RoomSpec {
  name: string;
  zone: Zone;
  /** Furniture catalog ids to place in the room centre. */
  furniture?: string[];
  /** Floor finish label (metadata / room color hint). */
  kind?: 'bedroom' | 'kitchen' | 'living' | 'dining' | 'pooja' | 'bath' | 'stair' | 'open';
}

export interface PropertySpec {
  name: string;
  facing: Facing;
  /** Plot dimensions in feet. widthFt runs East-West, depthFt runs North-South. */
  widthFt: number;
  depthFt: number;
  location?: string;
  ground: RoomSpec[];
  first: RoomSpec[];
}

function wall(x1: number, y1: number, x2: number, y2: number, thickness = 15, height = 280): Wall {
  return {
    id: uid(), start: { x: x1, y: y1 }, end: { x: x2, y: y2 },
    thickness, height, startHeight: height, endHeight: height, color: '#444444',
  };
}

function door(wallId: string, position: number, type: Door['type'] = 'single', width = 90): Door {
  return { id: uid(), wallId, position, width, height: 210, type, swingDirection: 'left', flipSide: false };
}

function win(wallId: string, position: number, type: Window['type'] = 'standard', width = 120): Window {
  return { id: uid(), wallId, position, width, height: 120, sillHeight: 90, type };
}

function furniture(catalogId: string, x: number, y: number, rotation = 0): FurnitureItem {
  return { id: uid(), catalogId, position: { x, y }, rotation, scale: { x: 1, y: 1, z: 1 } };
}

/**
 * Build one floor's geometry from a room program.
 * The buildable rectangle spans [0..W] x [0..H] (W east-west, H north-south),
 * split into a 3x3 grid. Each room occupies its Vaastu zone's cell.
 * A room may be omitted (that cell is left open / merged into circulation).
 */
function buildFloor(
  name: string,
  level: number,
  W: number,
  H: number,
  rooms: RoomSpec[],
  facing: Facing,
  includeStair: boolean,
): Floor {
  // Weighted grid instead of equal thirds. This keeps rooms in sensible
  // proportions on narrow plots (e.g. a 50x39 corner) rather than long thin strips.
  // Columns W->E; rows N->S. South band is largest (master SW + kitchen SE need
  // area); the North service band (pooja/bath) is smallest.
  const colWeights = [0.36, 0.30, 0.34]; // West, Centre, East
  const rowWeights = [0.30, 0.32, 0.38]; // North, Centre, South
  const cumulative = (weights: number[], total: number): number[] => {
    const sum = weights.reduce((a, b) => a + b, 0);
    const out = [0];
    let acc = 0;
    for (const w of weights) { acc += (w / sum) * total; out.push(acc); }
    out[out.length - 1] = total; // guard against float drift
    return out;
  };
  const colX = cumulative(colWeights, W);
  const rowY = cumulative(rowWeights, H);

  const walls: Wall[] = [];
  const doors: Door[] = [];
  const windows: Window[] = [];
  const furn: FurnitureItem[] = [];

  // Outer boundary walls, kept as references for door/window placement.
  const north = wall(0, 0, W, 0);          // top edge (North)
  const east  = wall(W, 0, W, H);          // right edge (East)
  const south = wall(W, H, 0, H);          // bottom edge (South)
  const west  = wall(0, H, 0, 0);          // left edge (West)
  walls.push(north, east, south, west);

  // Interior grid lines (2 vertical + 2 horizontal) to form the 3x3 cells.
  for (let c = 1; c <= 2; c++) walls.push(wall(colX[c], 0, colX[c], H));
  for (let r = 1; r <= 2; r++) walls.push(wall(0, rowY[r], W, rowY[r]));

  // Place rooms + furniture per zone cell.
  const occupied = new Set<string>();
  for (const room of rooms) {
    const [col, row] = ZONE_CELL[room.zone];
    occupied.add(`${col},${row}`);
    const cx = (colX[col] + colX[col + 1]) / 2;
    const cy = (rowY[row] + rowY[row + 1]) / 2;
    for (const f of room.furniture ?? []) furn.push(furniture(f, cx, cy));
    if (includeStair && room.kind === 'stair') {
      // handled below via stairs array
    }
  }

  // Main entrance on the facing (road) side, offset toward the auspicious end.
  // Vaastu: N-facing -> door toward NE; E-facing -> toward NE; S-facing -> toward SE;
  // W-facing -> toward NW. Position is 0..1 along the wall's start->end direction.
  const entranceWall = { N: north, E: east, S: south, W: west }[facing];
  const entrancePos = { N: 0.75, E: 0.25, S: 0.25, W: 0.75 }[facing];
  doors.push(door(entranceWall.id, entrancePos, 'double', 150));

  // A few exterior windows on the non-entrance sides for light (esp. N & E).
  windows.push(win(north.id, 0.35, 'standard', 150));
  windows.push(win(east.id, 0.6, 'standard', 120));
  if (facing !== 'W') windows.push(win(west.id, 0.4, 'standard', 120));
  if (facing !== 'S') windows.push(win(south.id, 0.65, 'standard', 120));

  const stairs: Stair[] = [];
  if (includeStair) {
    // Staircase in the South (Vaastu-preferred S/W). Place in the S-centre cell.
    const sx = (colX[1] + colX[2]) / 2;
    const sy = (rowY[2] + rowY[3]) / 2;
    stairs.push({
      id: uid(), position: { x: sx, y: sy }, rotation: 0,
      width: 100, depth: 300, riserCount: 16, direction: 'up', stairType: 'straight',
    });
  }

  return {
    id: uid(), name, level,
    walls, rooms: [], doors, windows, furniture: furn,
    stairs, columns: [], guides: [], measurements: [],
    annotations: [], textAnnotations: [], groups: [],
  };
}

function makeProject(spec: PropertySpec): Project {
  const W = spec.widthFt * FT;
  const H = spec.depthFt * FT;

  const ground = buildFloor('Ground Floor', 0, W, H, spec.ground, spec.facing, true);
  const first = buildFloor('First Floor', 1, W, H, spec.first, spec.facing, true);
  first.elevation = 300; // 3 m above ground

  return {
    id: uid(),
    name: spec.name,
    description: `${spec.facing}-facing · ${spec.widthFt}×${spec.depthFt} ft · Vaastu G+1${spec.location ? ' · ' + spec.location : ''}`,
    floors: [ground, first],
    activeFloorId: ground.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ── Shared room programs ─────────────────────────────────────────────
// Ground floor: self + family. 3 BHK, daily pooja + large occasional pooja,
// common bathroom, kitchen SE, master SW, living N, dining W.
function groundProgram(): RoomSpec[] {
  return [
    { name: 'Master Bedroom', zone: 'SW', kind: 'bedroom', furniture: ['bed_queen', 'wardrobe'] },
    { name: 'Bedroom 2', zone: 'W', kind: 'bedroom', furniture: ['bed_queen'] },
    { name: 'Bedroom 3', zone: 'S', kind: 'bedroom', furniture: ['bed_twin'] },
    { name: 'Living / Hall', zone: 'N', kind: 'living', furniture: ['sofa'] },
    { name: 'Kitchen', zone: 'SE', kind: 'kitchen', furniture: ['dining_table'] },
    { name: 'Dining', zone: 'E', kind: 'dining', furniture: ['dining_table'] },
    { name: 'Daily Pooja', zone: 'NE', kind: 'pooja' },
    // Large occasional pooja shares the auspicious NE band via the N-centre cell.
    { name: 'Special Pooja (occasional)', zone: 'C', kind: 'pooja' },
    { name: 'Common Bathroom', zone: 'NW', kind: 'bath', furniture: ['toilet', 'sink_b'] },
  ];
}

// First floor: brother + family (compact unit).
function firstProgram(): RoomSpec[] {
  return [
    { name: 'Master Bedroom', zone: 'SW', kind: 'bedroom', furniture: ['bed_queen', 'wardrobe'] },
    { name: 'Bedroom 2', zone: 'W', kind: 'bedroom', furniture: ['bed_queen'] },
    { name: 'Living / Hall', zone: 'N', kind: 'living', furniture: ['sofa'] },
    { name: 'Kitchen', zone: 'SE', kind: 'kitchen', furniture: ['dining_table'] },
    { name: 'Pooja', zone: 'NE', kind: 'pooja' },
    { name: 'Bathroom', zone: 'NW', kind: 'bath', furniture: ['toilet', 'sink_b'] },
  ];
}

// ── The three real properties ────────────────────────────────────────
const PROPERTIES: PropertySpec[] = [
  {
    name: 'Property 1 — West 80×50 (Vaastu)',
    // West frontage is 80 ft (N-S); its 50 ft depth runs E-W.
    facing: 'W', widthFt: 50, depthFt: 80, location: 'Karimnagar',
    ground: groundProgram(), first: firstProgram(),
  },
  {
    name: 'Property 2 — Corner W+S 50×39 (Vaastu)',
    // West edge 39 ft (N-S), South edge 50 ft (E-W) → width(E-W)=50, depth(N-S)=39.
    facing: 'W', widthFt: 50, depthFt: 39, location: 'Karimnagar (corner: W 20ft + S 30ft roads)',
    ground: groundProgram(), first: firstProgram(),
  },
  {
    name: 'Property 3 — North 51×47 (Vaastu)',
    facing: 'N', widthFt: 51, depthFt: 47, location: 'Karimnagar',
    ground: groundProgram(), first: firstProgram(),
  },
];

export const vaastuTemplates: HouseTemplate[] = PROPERTIES.map((spec) => ({
  name: spec.name,
  description: `${spec.facing}-facing G+1 · Vaastu-placed rooms (kitchen SE, master SW, pooja NE)`,
  icon: '🕉️',
  area: `${spec.widthFt}×${spec.depthFt} ft`,
  tags: ['vaastu', 'g+1', 'karimnagar', spec.facing.toLowerCase()],
  create: () => makeProject(spec),
}));

/** Exposed for unit testing the zone mapping. */
export const __test = { ZONE_CELL };
