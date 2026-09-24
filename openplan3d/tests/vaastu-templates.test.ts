import { describe, it, expect } from 'vitest';
import { vaastuTemplates, __test } from '../src/lib/utils/vaastuTemplates';

describe('vaastu templates', () => {
  it('registers three property templates', () => {
    expect(vaastuTemplates).toHaveLength(3);
    for (const t of vaastuTemplates) {
      expect(typeof t.create).toBe('function');
      expect(t.name).toMatch(/Vaastu/);
    }
  });

  it('generates a valid G+1 project with geometry on both floors', () => {
    for (const t of vaastuTemplates) {
      const p = t.create();
      expect(p.floors).toHaveLength(2);
      const [ground, first] = p.floors;
      expect(p.activeFloorId).toBe(ground.id);
      expect(ground.level).toBe(0);
      expect(first.level).toBe(1);
      expect(first.elevation).toBe(300);

      // Outer 4 walls + 4 interior grid lines = 8 walls minimum.
      expect(ground.walls.length).toBeGreaterThanOrEqual(8);
      expect(first.walls.length).toBeGreaterThanOrEqual(8);

      // Furniture placed on both floors.
      expect(ground.furniture.length).toBeGreaterThan(0);
      expect(first.furniture.length).toBeGreaterThan(0);

      // Staircase on both floors (G+1 connection).
      expect(ground.stairs.length).toBe(1);
      expect(first.stairs.length).toBe(1);

      // Exactly one main entrance (double door).
      const entrances = ground.doors.filter((d) => d.type === 'double');
      expect(entrances).toHaveLength(1);
    }
  });

  it('places rooms in correct absolute zone cells', () => {
    // NE must be top-right, SW bottom-left, SE bottom-right, NW top-left.
    // (col 0=West..2=East, row 0=North..2=South; +y is South.)
    expect(__test.ZONE_CELL.NE).toEqual([2, 0]);
    expect(__test.ZONE_CELL.SW).toEqual([0, 2]);
    expect(__test.ZONE_CELL.SE).toEqual([2, 2]);
    expect(__test.ZONE_CELL.NW).toEqual([0, 0]);
    expect(__test.ZONE_CELL.C).toEqual([1, 1]);
  });

  it('all wall coordinates are finite numbers', () => {
    for (const t of vaastuTemplates) {
      const p = t.create();
      for (const floor of p.floors) {
        for (const w of floor.walls) {
          expect(Number.isFinite(w.start.x)).toBe(true);
          expect(Number.isFinite(w.start.y)).toBe(true);
          expect(Number.isFinite(w.end.x)).toBe(true);
          expect(Number.isFinite(w.end.y)).toBe(true);
        }
      }
    }
  });
});
