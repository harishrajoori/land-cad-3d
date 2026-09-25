import { describe, it, expect } from 'vitest';
import { createConcept, defaultSite, overlaps, requirements, roomReachability, length, type SiteInput } from '../src/lib/houseDesign/model';
import { engineerReport, planSVG } from '../src/lib/houseDesign/report';

const SIZES: SiteInput[] = [
  { frontage: 90, depth: 60 },   // large
  { frontage: 80, depth: 50 },   // default-ish
  { frontage: 51, depth: 47 },   // Property 3
  { frontage: 40, depth: 38 },   // ~1520 sqft small plot
];

describe('proportional house concept', () => {
  it('generates a valid, fully connected G+1 plan across a range of plot sizes', () => {
    for (const input of SIZES) {
      const m = createConcept(input);
      expect(m.valid, `${input.frontage}x${input.depth}`).toBe(true);
      // Every room reachable from outside on both floors.
      expect(roomReachability(m, 0)).toEqual([]);
      expect(roomReachability(m, 1)).toEqual([]);
    }
  });

  it('keeps all rooms inside the plot, positive-sized, and non-overlapping', () => {
    for (const input of SIZES) {
      const m = createConcept(input);
      for (let i = 0; i < m.rooms.length; i++) {
        const r = m.rooms[i];
        expect(r.w, `${r.id} width`).toBeGreaterThan(0);
        expect(r.d, `${r.id} depth`).toBeGreaterThan(0);
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.z).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(input.depth + 1e-6);
        expect(r.z + r.d).toBeLessThanOrEqual(input.frontage + 1e-6);
        for (const other of m.rooms.slice(i + 1).filter(o => o.floor === r.floor)) {
          expect(overlaps(r, other), `${r.id}/${other.id}`).toBe(false);
        }
      }
    }
  });

  it('meets the fixed program on a comfortable plot (3+2 bedrooms, both pooja, full parking)', () => {
    const m = createConcept({ frontage: 90, depth: 60 });
    expect(m.rooms.filter(r => r.floor === 0 && r.use === 'bedroom')).toHaveLength(requirements.roomProgram.ground.bedrooms);
    expect(m.rooms.filter(r => r.floor === 1 && r.use === 'bedroom')).toHaveLength(requirements.roomProgram.first.bedrooms);
    expect(m.rooms.some(r => r.id === '0-daily')).toBe(true);       // separate daily pooja
    expect(m.rooms.some(r => r.id === '0-mallanna')).toBe(true);    // Mallanna room
    expect(m.parking).toEqual({ cars: 2, bikes: 2 });
    expect(m.decisions).toEqual([]);                                 // no degradation needed
  });

  it('degrades gracefully on a small (~1500 sqft) plot instead of compressing', () => {
    const m = createConcept({ frontage: 40, depth: 38 });
    expect(m.valid).toBe(true);
    // Daily pooja merged into the Mallanna/pooja space.
    expect(m.rooms.some(r => r.id === '0-daily')).toBe(false);
    expect(m.rooms.some(r => r.id === '0-mallanna')).toBe(true);
    // Parking reduced from the full 2+2.
    expect(m.parking.cars).toBeLessThan(2);
    expect(m.decisions.length).toBeGreaterThan(0);
    // Still a real 3-bedroom ground home.
    expect(m.rooms.filter(r => r.floor === 0 && r.use === 'bedroom').length).toBeGreaterThanOrEqual(3);
  });

  it('rejects plots that are too small or invalid, without a misleading miniature', () => {
    for (const input of [{ frontage: 30, depth: 30 }, { frontage: NaN, depth: 50 }, { frontage: 80, depth: Infinity }, { frontage: -80, depth: 50 }]) {
      const m = createConcept(input);
      expect(m.valid).toBe(false);
      expect(m.conflicts.length).toBeGreaterThan(0);
      expect(m.rooms).toHaveLength(0);
    }
  });

  it('parks vehicles inside the plot, clear of Patnam and pedestrian paths', () => {
    const m = createConcept();
    // dynamic import kept local to avoid loading the catalog when not needed
    return import('../src/lib/utils/furnitureCatalog').then(({ furnitureCatalog }) => {
      const vehicles = m.furniture.filter(f => /^(car_|motorcycle)/.test(f.catalog)).map(f => {
        const d = furnitureCatalog.find(d => d.id === f.catalog)!;
        const a = f.rotation * Math.PI / 180;
        const w = (Math.abs(Math.cos(a)) * d.width + Math.abs(Math.sin(a)) * d.depth) / 30.48;
        const depth = (Math.abs(Math.sin(a)) * d.width + Math.abs(Math.cos(a)) * d.depth) / 30.48;
        return { x: f.x - w / 2, z: f.z - depth / 2, w, d: depth };
      });
      for (const [i, v] of vehicles.entries()) {
        expect(v.x).toBeGreaterThanOrEqual(-1e-6);
        expect(v.z).toBeGreaterThanOrEqual(-1e-6);
        expect(overlaps(v, m.patnam)).toBe(false);
        for (const other of vehicles.slice(i + 1)) expect(overlaps(v, other)).toBe(false);
      }
    });
  });

  it('places openings fully inside their wall segment and keeps walls unique', () => {
    const m = createConcept();
    for (const wall of m.walls) for (const o of wall.openings) {
      expect(o.offset - o.width / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(o.offset + o.width / 2).toBeLessThanOrEqual(length(wall) + 1e-6);
    }
    const keys = m.walls.map(w => [w.floor, w.x1, w.z1, w.x2, w.z2].join(','));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('exports a report and SVG plans reflecting the concept', () => {
    const m = createConcept({ frontage: 90, depth: 60 });
    const report = engineerReport(m);
    expect(report).toContain('90 ft frontage × 60 ft depth');
    expect(report).toContain('four-pillar');
    for (const floor of [0, 1]) expect(planSVG(m, floor)).toContain('north up');
  });
});
