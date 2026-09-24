<script lang="ts">
  import { AI_TEXTURE_PROMPTS, generateAITexture, hasCachedAITexture, removeAITexture } from '$lib/utils/aiTextures';

  // Materials the user can regenerate with AI. Ids match the texture system.
  const MATERIALS: { id: string; label: string }[] = [
    { id: 'wood-panel', label: 'Wood floor' },
    { id: 'marble-white', label: 'White marble' },
    { id: 'marble-dark', label: 'Dark marble' },
    { id: 'porcelain', label: 'Porcelain tile' },
    { id: 'subway-tile', label: 'Subway tile' },
    { id: 'red-brick', label: 'Brick' },
    { id: 'stone', label: 'Stone' },
    { id: 'concrete-block', label: 'Concrete' },
  ];

  let busyId = $state<string | null>(null);
  let error = $state('');
  let status = $state('');
  let controller: AbortController | null = null;

  async function generate(id: string) {
    if (busyId) return;
    error = ''; status = '';
    busyId = id;
    controller = new AbortController();
    try {
      await generateAITexture(id, AI_TEXTURE_PROMPTS[id], controller.signal);
      status = `Generated ${id}. Applied to the 3D view.`;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Texture generation failed.';
    } finally {
      busyId = null;
      controller = null;
    }
  }

  function reset(id: string) {
    removeAITexture(id);
    status = `Reverted ${id} to the built-in texture.`;
  }
</script>

<section class="space-y-2 rounded-lg border border-gray-200 p-2" aria-label="AI textures">
  <h3 class="text-sm font-semibold">AI Materials (GPT Image)</h3>
  <p class="text-xs text-gray-500">Generate a photoreal, seamless texture for each surface using your OpenAI key (Settings → AI). Uses your key and is billed to your account. Results are cached in this browser.</p>
  <div class="grid grid-cols-2 gap-1.5">
    {#each MATERIALS as m}
      <div class="flex items-center justify-between gap-1 rounded border border-gray-200 px-2 py-1 text-xs">
        <span class="truncate">{m.label}{#if hasCachedAITexture(m.id)} ✓{/if}</span>
        <span class="flex gap-1">
          <button type="button" class="text-blue-600 disabled:opacity-40" disabled={busyId !== null} onclick={() => generate(m.id)}>
            {busyId === m.id ? '…' : 'AI'}
          </button>
          {#if hasCachedAITexture(m.id)}
            <button type="button" class="text-gray-500" onclick={() => reset(m.id)}>↺</button>
          {/if}
        </span>
      </div>
    {/each}
  </div>
  {#if status}<p class="text-xs text-emerald-600">{status}</p>{/if}
  {#if error}<p class="text-xs text-red-600" role="alert">{error}</p>{/if}
</section>
