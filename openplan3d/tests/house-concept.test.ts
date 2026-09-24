import { describe, it, expect } from 'vitest';
import { createConcept, defaultSite, overlaps, requirements, roomReachability, length } from '../src/lib/houseDesign/model';
import { engineerReport, planSVG } from '../src/lib/houseDesign/report';

describe('family house concept', () => {
  it('keeps the fixed room and parking program across supported plot changes', () => {
    for (const input of [defaultSite, { frontage: 90, depth: 60 }, { frontage: 100, depth: 55 }]) {
      const m = createConcept(input);
      expect(m.valid).toBe(true);
      expect(m.rooms.filter(r => r.floor === 0 && r.use === 'bedroom')).toHaveLength(requirements.roomProgram.ground.bedrooms);
      expect(m.rooms.filter(r => r.floor === 1 && r.use === 'bedroom')).toHaveLength(requirements.roomProgram.first.bedrooms);
      expect(m.furniture.filter(f => f.catalog.startsWith('car_'))).toHaveLength(requirements.parking.cars);
      expect(m.furniture.filter(f => f.catalog === 'motorcycle')).toHaveLength(requirements.parking.twoWheelers);
      expect(m.rooms.some(r => r.id === '0-daily')).toBe(true);
      expect(m.rooms.some(r => r.id === '0-mallanna')).toBe(true);
    }
  });
  it('rejects infeasible and invalid dimensions without generating a misleading miniature house', () => {
    for (const input of [{ frontage: 39, depth: 50 }, { frontage: 80, depth: 40 }, { frontage: NaN, depth: 50 }, { frontage: 80, depth: Infinity }, { frontage: -80, depth: 50 }]) {
      const m = createConcept(input);
      expect(m.valid).toBe(false); expect(m.conflicts.length).toBeGreaterThan(0); expect(m.rooms).toHaveLength(0);
    }
  });
  it('provides independent entry and a connected route to every room on each floor', () => {
    const m = createConcept();
    expect(roomReachability(m, 0)).toEqual([]); expect(roomReachability(m, 1)).toEqual([]);
    expect(m.connections.filter(c => c.from === 'outside')).toEqual([
      { from: 'outside', to: '0-foyer', floor: 0 }, { from: 'outside', to: '1-foyer', floor: 1 }
    ]);
    expect(m.stair.x + m.stair.w).toBeLessThan(m.house.x);
  });
  it('keeps room footprints non-overlapping and outdoor ritual space separate from stairs and gardens', () => {
    for (const input of [defaultSite, { frontage: 95, depth: 60 }]) {
      const m = createConcept(input);
      for (let i = 0; i < m.rooms.length; i++) {
        const r = m.rooms[i];
        expect(r.x).toBeGreaterThanOrEqual(0); expect(r.z).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(input.depth); expect(r.z + r.d).toBeLessThanOrEqual(input.frontage);
        for (const other of m.rooms.slice(i + 1).filter(o => o.floor === r.floor)) expect(overlaps(r, other), `${r.id}/${other.id}`).toBe(false);
      }
      expect(overlaps(m.patnam, m.house)).toBe(false); expect(overlaps(m.patnam, m.stair)).toBe(false);
      for (const g of m.gardens) { expect(overlaps(g, m.house)).toBe(false); expect(overlaps(g, m.patnam)).toBe(false); expect(overlaps(g, m.stair)).toBe(false); }
    }
  });
  it('places openings fully inside their wall segment without overlaps', () => {
    const m = createConcept();
    for (const wall of m.walls) for (const opening of wall.openings) {
      expect(opening.offset - opening.width / 2).toBeGreaterThanOrEqual(.25);
      expect(opening.offset + opening.width / 2).toBeLessThanOrEqual(length(wall) - .25);
    }
    const keys = m.walls.map(w => [w.floor, w.x1, w.z1, w.x2, w.z2].join(','));
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('exports the same dimensions and assumptions shown in the concept', () => {
    const m = createConcept({ frontage: 90, depth: 60 });
    const report = engineerReport(m);
    expect(report).toContain('90 ft frontage × 60 ft depth');
    expect(report).toContain('12 × 12 ft'); expect(report).toContain('four-pillar');
    expect(report).toContain('Open-plan great room');
    for (const floor of [0, 1]) expect(planSVG(m, floor)).toContain('north up');
  });
});

import { furnitureCatalog } from '../src/lib/utils/furnitureCatalog';
it('keeps vehicles inside the plot and clear of Patnam, pedestrian paths and each other', () => {
  const m = createConcept();
  const vehicles = m.furniture.filter(f => /^(car_|motorcycle)/.test(f.catalog)).map(f => {
    const d = furnitureCatalog.find(d => d.id === f.catalog)!;
    const angle = f.rotation * Math.PI / 180;
    const w = (Math.abs(Math.cos(angle)) * d.width + Math.abs(Math.sin(angle)) * d.depth) / 30.48;
    const depth = (Math.abs(Math.sin(angle)) * d.width + Math.abs(Math.cos(angle)) * d.depth) / 30.48;
    return { x: f.x - w / 2, z: f.z - depth / 2, w, d: depth };
  });
  for (const [i, vehicle] of vehicles.entries()) {
    expect(vehicle.x).toBeGreaterThanOrEqual(0); expect(vehicle.z).toBeGreaterThanOrEqual(0);
    expect(vehicle.x + vehicle.w).toBeLessThanOrEqual(m.input.depth);
    expect(overlaps(vehicle, m.patnam)).toBe(false);
    for (const path of m.paths) expect(overlaps(vehicle, path)).toBe(false);
    for (const other of vehicles.slice(i + 1)) expect(overlaps(vehicle, other)).toBe(false);
  }
  for (const path of m.paths) expect(overlaps(path, m.patnam)).toBe(false);
});
