/**
 * AI-generated PBR textures.
 *
 * Generates a seamless, tileable material texture from a prompt using the user's
 * OpenAI image model, caches the result in localStorage (so it persists and does
 * not re-bill), and registers it as an override in the texture system so the
 * real-time 3D view uses it for the matching material id.
 *
 * All calls use the user's own browser-stored API key and are billed to them.
 */
import { get } from 'svelte/store';
import { openAISettings } from '$lib/stores/aiKeys';
import { generateOpenAITexture, validateOpenAIConfig } from './openaiClient';
import { registerTextureOverride, clearTextureOverride } from './textureGenerator';

const STORE_PREFIX = 'o3d_ai_texture_';

/** Good default prompts per material id, tuned for seamless tiling. */
export const AI_TEXTURE_PROMPTS: Record<string, string> = {
  'wood-panel': 'Seamless tileable photorealistic oak wood flooring texture, top-down, even lighting, no shadows, no perspective, high detail wood grain, PBR albedo map',
  'marble-white': 'Seamless tileable photorealistic white Carrara marble tile texture, top-down flat, subtle grey veining, even lighting, no shadows, PBR albedo map',
  'marble-dark': 'Seamless tileable photorealistic dark marble tile texture, top-down flat, elegant veining, even lighting, no shadows, PBR albedo map',
  'porcelain': 'Seamless tileable photorealistic large-format polished porcelain floor tile, top-down flat, light grey, thin grout lines, even lighting, PBR albedo map',
  'subway-tile': 'Seamless tileable photorealistic white ceramic subway tile wall, flat front view, light grey grout, even lighting, no shadows, PBR albedo map',
  'red-brick': 'Seamless tileable photorealistic red brick wall texture, flat front view, mortar joints, even lighting, no shadows, PBR albedo map',
  'stone': 'Seamless tileable photorealistic natural stone cladding texture, flat front view, even lighting, no shadows, PBR albedo map',
  'concrete-block': 'Seamless tileable photorealistic smooth concrete wall texture, flat front view, subtle stains, even lighting, no shadows, PBR albedo map',
};

function storeKey(id: string): string {
  return `${STORE_PREFIX}${id}`;
}

/** Load a data URL into an HTMLCanvasElement. */
function dataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || 1024;
      c.height = img.naturalHeight || 1024;
      const cx = c.getContext('2d');
      if (!cx) { reject(new Error('Canvas 2D context unavailable.')); return; }
      cx.drawImage(img, 0, 0);
      resolve(c);
    };
    img.onerror = () => reject(new Error('Could not decode the generated texture image.'));
    img.src = dataUrl;
  });
}

/** Register a cached AI texture (if present) for a material id at startup. */
export async function restoreAITexture(id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const dataUrl = localStorage.getItem(storeKey(id));
  if (!dataUrl) return false;
  try {
    registerTextureOverride(id, await dataUrlToCanvas(dataUrl));
    return true;
  } catch {
    return false;
  }
}

/** Restore every cached AI texture. Call once on app/editor startup. */
export async function restoreAllAITextures(): Promise<void> {
  if (typeof window === 'undefined') return;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORE_PREFIX)) {
      await restoreAITexture(key.slice(STORE_PREFIX.length));
    }
  }
}

export function hasCachedAITexture(id: string): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem(storeKey(id));
}

/** Generate a new AI texture for a material id, cache it, and apply it live. */
export async function generateAITexture(id: string, promptOverride?: string, signal?: AbortSignal): Promise<void> {
  const config = { ...get(openAISettings) };
  validateOpenAIConfig(config); // throws a helpful message if key/model missing
  const prompt = promptOverride?.trim() || AI_TEXTURE_PROMPTS[id]
    || `Seamless tileable photorealistic ${id} material texture, flat top-down, even lighting, no shadows, PBR albedo map`;
  const dataUrl = await generateOpenAITexture(config, prompt, fetch, signal);
  try {
    localStorage.setItem(storeKey(id), dataUrl);
  } catch {
    // Storage full or unavailable: still apply for this session.
  }
  registerTextureOverride(id, await dataUrlToCanvas(dataUrl));
}

/** Remove a generated texture and revert to the bundled one. */
export function removeAITexture(id: string): void {
  if (typeof window !== 'undefined') localStorage.removeItem(storeKey(id));
  clearTextureOverride(id);
}
