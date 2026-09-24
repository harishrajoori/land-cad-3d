import { describe, it, expect } from 'vitest';
import { AI_TEXTURE_PROMPTS } from '../src/lib/utils/aiTextures';
import { registerTextureOverride, clearTextureOverride, hasTextureOverride, getFloorTextureCanvas, getWallTextureCanvas } from '../src/lib/utils/textureGenerator';

// Node-environment tests: cover the pure logic. DOM/localStorage behaviour is
// exercised by the Playwright browser suite, not here.
describe('AI textures', () => {
  it('has seamless-tiling prompts for the common materials', () => {
    for (const id of ['wood-panel', 'marble-white', 'porcelain', 'subway-tile', 'red-brick']) {
      expect(AI_TEXTURE_PROMPTS[id]).toMatch(/seamless/i);
      expect(AI_TEXTURE_PROMPTS[id]).toMatch(/tileable/i);
    }
  });

  it('override registry takes precedence for floor and wall material ids', () => {
    // A plain object is enough — the registry only stores and returns the reference.
    const fake = { width: 8, height: 8 } as unknown as HTMLCanvasElement;
    expect(hasTextureOverride('wood-panel')).toBe(false);
    registerTextureOverride('wood-panel', fake);
    expect(hasTextureOverride('wood-panel')).toBe(true);
    expect(getFloorTextureCanvas('wood-panel')).toBe(fake);
    expect(getWallTextureCanvas('wood-panel', '#ffffff')).toBe(fake);
    clearTextureOverride('wood-panel');
    expect(hasTextureOverride('wood-panel')).toBe(false);
  });
});
