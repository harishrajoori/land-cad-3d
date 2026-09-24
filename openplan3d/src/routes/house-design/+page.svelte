<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { createConcept, defaultSite, requirements, clearSize, REVISION, type SiteInput } from '$lib/houseDesign/model';
  import { planSVG, engineerReport } from '$lib/houseDesign/report';
  import type { createHouseViewer, FloorView, CameraView } from '$lib/houseDesign/scene';

  let frontage = $state(defaultSite.frontage), depth = $state(defaultSite.depth);
  let model = $state(createConcept());
  let floor = $state<FloorView>('ground'), cutaway = $state(true), labels = $state(true);
  let view = $state<CameraView>('overview'), twoD = $state(false), walking = $state(false);
  let ready = $state(false), error = $state(''), notice = $state(''), busy = $state(false);
  let host: HTMLDivElement;
  let viewer: ReturnType<typeof createHouseViewer> | undefined;
  let inspectionFloor = $derived(floor === 'first' ? 1 : 0);
  const storageKey = 'land-cad-family-concept-v1';
  function saveBlob(data: BlobPart, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function sync() { if (viewer) viewer.update(model, { floor, cutaway, labels }); }
  function applySite() {
    model = createConcept({ frontage: Number(frontage), depth: Number(depth) });
    walking = false; view = 'overview'; sync(); viewer?.preset('overview');
    if (model.valid) {
      try { localStorage.setItem(storageKey, JSON.stringify(model.input)); notice = 'Plot updated. Your fixed requirements are retained.'; }
      catch { notice = 'Plot updated. Browser saving is unavailable; download the concept to keep a copy.'; }
    } else notice = '';
  }
  function chooseFloor(value: FloorView) {
    if (walking) viewer?.preset('overview');
    walking = false; floor = value; view = 'overview'; sync(); viewer?.preset('overview');
  }
  function chooseView(value: CameraView) {
    if (value === 'shrine') { floor = 'ground'; cutaway = true; }
    if (value === 'street') { floor = 'both'; cutaway = false; }
    if (value === 'walk' && floor === 'both') floor = 'ground';
    twoD = false; view = value; sync(); viewer?.preset(value);
  }
  function saveConcept() {
    saveBlob(JSON.stringify({ schema: 'land-cad-3d/family-concept', version: 1, revision: REVISION, site: model.input, requirements, assumptions: model.assumptions }, null, 2), 'family-home-concept.json', 'application/json');
    notice = 'Concept saved with plot inputs, fixed requirements and assumptions.';
  }
  async function loadConcept(event: Event) {
    const input = event.currentTarget as HTMLInputElement, file = input.files?.[0]; if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error('Choose a concept file smaller than 1 MB.');
      const data = JSON.parse(await file.text());
      if (data.schema !== 'land-cad-3d/family-concept' || data.version !== 1 || typeof data.site?.frontage !== 'number' || typeof data.site?.depth !== 'number') throw new Error('Choose a saved family-home concept JSON file.');
      if (JSON.stringify(data.requirements) !== JSON.stringify(requirements)) throw new Error('This file has a different house brief. Keep it for review; it cannot replace your fixed requirements here.');
      const candidate = createConcept(data.site as SiteInput); if (!candidate.valid) throw new Error(candidate.conflicts.join(' '));
      frontage = candidate.input.frontage; depth = candidate.input.depth; applySite(); error = ''; notice = 'Saved concept restored.';
    } catch (e) { error = e instanceof Error ? e.message : 'Could not read this concept.'; }
    input.value = '';
  }
  function saveView() {
    if (!viewer) return;
    const a = document.createElement('a'); a.href = viewer.capture(); a.download = 'family-home-view.png'; a.click();
    notice = 'Current 3D view saved as an image.';
  }
  async function exportGLB() {
    if (!viewer) return; busy = true; error = '';
    try { saveBlob(await viewer.glb(), 'family-home-full-model.glb', 'model/gltf-binary'); notice = 'Full 3D model exported in metres for Blender or a GLB viewer.'; }
    catch (e) { error = e instanceof Error ? e.message : 'Could not export the model.'; }
    finally { busy = false; }
  }
  function report() {
    saveBlob(engineerReport(model, viewer?.capture()), 'family-home-engineer-brief.html', 'text/html');
    notice = 'Engineer brief downloaded. Open it and choose Print / Save as PDF.';
  }
  onMount(() => {
    let canceled = false;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const input = JSON.parse(raw);
        if (typeof input.frontage === 'number' && typeof input.depth === 'number') {
          const saved = createConcept(input);
          if (saved.valid) { model = saved; frontage = input.frontage; depth = input.depth; }
        }
      }
    } catch { notice = 'Starting with Property 1. Saved browser settings could not be read.'; }
    void import('$lib/houseDesign/scene').then(({ createHouseViewer }) => {
      if (canceled) return;
      viewer = createHouseViewer(host, value => { walking = value; if (!value && view === 'walk') view = 'overview'; });
      sync(); viewer.preset('overview'); ready = true;
    }).catch(e => { error = `3D could not start. The 2D plans and brief are still available. ${e.message}`; twoD = true; });
    return () => { canceled = true; viewer?.dispose(); };
  });
</script>

<svelte:head><title>Your family home · Land CAD 3D</title><meta name="description" content="Explore your family's west-facing house concept, with independent homes, Mallanna shrine and outdoor Patnam space." /></svelte:head>
<div class="studio">
  <header>
    <a class="brand" href={`${base}/`} aria-label="Back to project library"><span class="brand-mark">⌂</span><span>LAND & HOME<small>A place for your family.</small></span></a>
    <div class="project-title"><span class="status-dot"></span>Family home <span class="revision">{REVISION}</span></div>
    <button class="report" onclick={report} disabled={!model.valid || busy}>Engineer brief <span>↗</span></button>
  </header>
  <main>
    <aside>
      <div class="eyebrow">YOUR LAND. YOUR WAY OF LIVING.</div>
      <h1>Make room<br />for what matters.</h1>
      <p class="intro">Two independent homes. One considered plan. Explore the spaces before you build.</p>
      <form onsubmit={(event) => { event.preventDefault(); applySite(); }}>
        <div class="section-title">The property <span>WEST-FACING</span></div>
        <div class="inputs"><label>Road frontage <div><input type="number" min="1" max="200" step="0.5" bind:value={frontage} required disabled={busy} aria-label="Road frontage in feet" /><span>ft</span></div></label><label>Plot depth <div><input type="number" min="1" max="200" step="0.5" bind:value={depth} required disabled={busy} aria-label="Plot depth in feet" /><span>ft</span></div></label></div>
        <p class="hint">Frontage runs north–south. Depth runs east–west.</p>
        <button class="apply" type="submit" disabled={busy}>Update the plot <span>→</span></button>
      </form>
      <section>
        <div class="section-title">Your fixed brief <span class="locked">LOCKED IN</span></div>
        <ul class="brief">
          <li><span>01</span><div>Independent living<small>3 bedrooms below · 2 above · own stair</small></div></li>
          <li><span>02</span><div>Space to arrive<small>{requirements.parking.cars} cars · {requirements.parking.twoWheelers} two-wheelers</small></div></li>
          <li><span>03</span><div>Mallanna pooja<small>4 people · raised shrine · four-pillar pandal</small></div></li>
          <li><span>04</span><div>Life outdoors<small>Patnam in front · garden & play</small></div></li>
        </ul>
        <p class="hint">A smaller plot never silently removes a requirement.</p>
      </section>
      <section>
        <div class="section-title">Take a closer look</div>
        <div class="focus-buttons">
          <button onclick={() => chooseView('shrine')} disabled={!ready || !model.valid || busy}>Mallanna shrine <span>↗</span></button>
          <button onclick={() => chooseView('street')} disabled={!ready || !model.valid || busy}>View from the road <span>↗</span></button>
        </div>
        <p class="hint">The shrine frame is a placeholder for your chosen Mallanna image.</p>
      </section>
      <details><summary>Dimensions & assumptions <span>+</span></summary><p class="hint">This is a discussion concept. Setbacks, shrine dimensions and structure need review.</p><ul class="assumptions">{#each model.assumptions as assumption}<li>{assumption}</li>{/each}</ul></details>
      <details><summary>Room schedule <span>+</span></summary>{#each model.rooms.filter(r => r.floor === inspectionFloor && r.use !== 'hall') as room}<div class="room-row"><span>{room.name}</span><strong>{clearSize(room)}</strong></div>{/each}<p class="hint">Clear dimensions between wall faces.</p></details>
      <section class="exports">
        <div class="section-title">Keep this concept</div>
        <button onclick={saveConcept} disabled={!model.valid || busy}>Save concept <span>↓ JSON</span></button>
        <label class="load">Open saved concept<input type="file" accept=".json,application/json" onchange={loadConcept} disabled={busy} /></label>
        <button onclick={saveView} disabled={!ready || !model.valid || busy || twoD}>Save this view <span>↓ PNG</span></button>
        <button onclick={exportGLB} disabled={!ready || !model.valid || busy}>{busy ? 'Preparing model…' : 'Download full 3D model'} <span>↓ GLB</span></button>
      </section>
      <a class="library" href={`${base}/`}>← Open floor-plan editor library</a>
    </aside>
    <div class="workspace">
      <div class="toolbar">
        <div class="floor-tabs" aria-label="Floor views">
          {#each [['ground', 'Ground floor'], ['first', 'First floor'], ['both', 'Whole home']] as [value, label]}<button class:active={floor === value} aria-pressed={floor === value} onclick={() => chooseFloor(value as FloorView)} disabled={busy}>{label}</button>{/each}
        </div>
        <div class="view-tabs"><button class:active={!twoD} aria-pressed={!twoD} onclick={() => { twoD = false; sync(); viewer?.preset('overview'); view = 'overview'; }} disabled={!ready || busy}>3D</button><button class:active={twoD} aria-pressed={twoD} onclick={() => { viewer?.preset('overview'); walking = false; twoD = true; }} disabled={busy}>2D plan</button></div>
      </div>
      <div class="viewport" class:plan-mode={twoD}>
        <div class="canvas-host" class:hidden={twoD || !model.valid} bind:this={host}></div>
        {#if twoD && model.valid}<div class="plan" aria-label="House floor plan">{@html planSVG(model, inspectionFloor)}</div>{/if}
        {#if !model.valid}<div class="fit-message" role="alert"><span>LET’S FIND THE RIGHT FIT</span><h2>Your brief stays.<br />This layout needs more space.</h2>{#each model.conflicts as conflict}<p>{conflict}</p>{/each}<p>No rooms or requirements have been removed. Try 80 × 50 ft to return to Property 1.</p></div>{/if}
        {#if model.valid}<div class="scene-caption"><span class="status-dot"></span>{twoD ? (inspectionFloor ? 'First-floor plan' : 'Ground-floor plan') : walking ? 'Eye-level exploration' : view === 'shrine' ? 'The Mallanna shrine' : 'Property 1 · family home'}<small>{model.input.frontage} × {model.input.depth} ft · North stays north</small></div>{/if}
        {#if !ready && !error && model.valid}<div class="loading" role="status">Building your home in 3D…</div>{/if}
        {#if walking}<div class="walk-pad" aria-label="Eye-level movement">
          <button aria-label="Step forward" onclick={() => viewer?.step('forward')}>↑</button>
          <div><button aria-label="Step left" onclick={() => viewer?.step('left')}>←</button><button aria-label="Step back" onclick={() => viewer?.step('back')}>↓</button><button aria-label="Step right" onclick={() => viewer?.step('right')}>→</button></div>
        </div>{/if}
        {#if ready && model.valid && !twoD}<div class="scene-controls">
          <button onclick={() => chooseView('overview')} disabled={busy} title="Reset camera">↺ <span>Reset view</span></button>
          <button onclick={() => chooseView('plan')} disabled={busy}>⌑ <span>Top view</span></button>
          <button class:chosen={walking} onclick={() => chooseView(walking ? 'overview' : 'walk')} disabled={busy}>↟ <span>{walking ? 'Exit eye level' : 'Eye level'}</span></button>
          <label><input type="checkbox" bind:checked={cutaway} onchange={() => { if (walking) chooseView('overview'); sync(); }} disabled={busy || walking} /> Cutaway</label>
          <label><input type="checkbox" bind:checked={labels} onchange={sync} disabled={busy} /> Labels</label>
        </div>{/if}
        {#if model.valid}<div class="gestures">{twoD ? 'North up · doors shown as gaps · blue marks are windows' : walking ? 'Click the scene · WASD / arrows to move · drag to look · Esc to leave · choose floors above' : 'Drag to orbit · scroll to zoom · right-drag to pan'}</div>{/if}
      </div>
      <div class="bottom-bar"><div><strong>{model.valid ? (model.input.frontage * model.input.depth).toLocaleString() : '—'}</strong><span>sq ft plot</span></div><div><strong>{model.valid ? Math.round(model.footprint).toLocaleString() : '—'}</strong><span>sq ft footprint</span></div><div><strong>{model.valid ? Math.round(model.gardenArea) : '—'}</strong><span>sq ft garden patches</span></div><p>Concept, not construction drawings.<br /><span>Warm plaster · timber accents · shaded openings</span></p></div>
      {#if error}<div class="feedback error" role="alert">{error}<button onclick={() => error = ''} aria-label="Dismiss error">×</button></div>{/if}
      {#if notice}<div class="feedback" role="status">{notice}<button onclick={() => notice = ''} aria-label="Dismiss notification">×</button></div>{/if}
    </div>
  </main>
</div>
<style>
  :global(body){margin:0}.studio{height:100dvh;display:flex;flex-direction:column;background:#f8f7f2;color:#293f34;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:13px}header{height:78px;flex-shrink:0;padding:0 30px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #deded2;background:#fcfbf6}.brand{display:flex;gap:12px;align-items:center;text-decoration:none;color:#284a38;letter-spacing:1.6px;font-size:13px;font-weight:650}.brand-mark{font-size:38px;font-weight:400;line-height:1}.brand small{display:block;letter-spacing:0;font-size:10px;font-weight:400;color:#7a8277;margin-top:3px}.project-title{display:flex;align-items:center;gap:9px;font-size:12px;color:#536050}.revision{border-left:1px solid #d1d6c8;padding-left:12px;margin-left:5px;color:#929689;font-size:11px}.status-dot{width:6px;height:6px;display:inline-block;border-radius:50%;background:#788e60}.report{background:#335841;color:#fff;border:0;border-radius:5px;padding:12px 16px;font-size:12px;display:flex;gap:22px;align-items:center}.report span{font-size:18px}main{display:flex;flex:1;min-height:0}aside{width:300px;padding:28px 24px 22px;flex-shrink:0;overflow:auto;border-right:1px solid #dcded1}.eyebrow{font-size:8px;letter-spacing:1.6px;color:#88927c;font-weight:600}h1{font-family:Georgia,serif;font-weight:400;font-size:34px;line-height:1.13;letter-spacing:-1px;margin:17px 0 15px}.intro{font-size:11px;line-height:1.8;color:#7c8276;margin:0 0 22px}.section-title{display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:600;margin-bottom:13px}.section-title>span{font-size:8px;letter-spacing:.8px;color:#8b9380}.section-title .locked{background:#e8eddf;padding:4px 6px;border-radius:3px;color:#647b4e}form,section{border-top:1px solid #dedfd3;padding:19px 0}.inputs{display:flex;gap:10px}.inputs>label{flex:1;min-width:0;font-size:10px;color:#78836e}.inputs label>div{display:flex;align-items:center;border:1px solid #d3d9c9;border-radius:5px;background:#fffef9;margin-top:7px}.inputs input{width:100%;min-width:0;border:0;background:transparent;padding:9px 0 9px 10px;font-size:18px;color:#344b36;outline-offset:2px}.inputs label>div>span{padding-right:9px;color:#98a28d}.hint{font-size:9px;color:#89917f;line-height:1.6;margin:9px 0 0}.apply{width:100%;margin-top:13px;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid #c5ceba;background:#eef1e7;color:#526d3e;border-radius:4px;font-size:11px}.brief{list-style:none;margin:0;padding:0;display:grid;gap:15px}.brief li{display:flex;align-items:flex-start;gap:12px;font-size:11px}.brief li>span{font-family:Georgia,serif;font-size:13px;color:#9aab87;line-height:1.3}.brief small{display:block;font-size:9px;color:#8b9380;line-height:1.5;margin-top:3px}.focus-buttons{display:grid;gap:7px}.focus-buttons button,.exports button{display:flex;justify-content:space-between;align-items:center;width:100%;background:#fffef9;border:1px solid #d8ddcd;color:#596d4d;padding:10px;border-radius:4px;font-size:10px}details{border-top:1px solid #dedfd3;padding:15px 0}summary{display:flex;justify-content:space-between;font-size:11px;cursor:pointer;list-style:none}summary span{color:#819072}.assumptions{padding-left:16px;font-size:10px;line-height:1.7;color:#7b8272}.assumptions li{margin-bottom:10px}.room-row{display:flex;justify-content:space-between;gap:8px;padding-top:12px;font-size:9px;color:#7c8771}.room-row strong{font-weight:500;white-space:nowrap;color:#4b6340}.exports{display:grid;gap:8px}.exports .section-title{margin-bottom:4px}.exports button span{font-size:8px;letter-spacing:.5px;color:#8b9680}.load{position:relative;display:block;overflow:hidden;text-align:center;border:1px dashed #cfd7c4;padding:9px;font-size:10px;color:#7f8b72;border-radius:4px;cursor:pointer}.load input{position:absolute;inset:0;opacity:0;width:100%;cursor:pointer}.library{font-size:9px;color:#8d987e;text-decoration:none}.workspace{flex:1;min-width:0;display:flex;flex-direction:column;position:relative}.toolbar{height:61px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;border-bottom:1px solid #deded2;gap:10px}.floor-tabs,.view-tabs{display:flex;gap:4px}.floor-tabs button,.view-tabs button{font-size:11px;border:0;background:none;color:#929a88;padding:9px 13px;border-radius:4px}.floor-tabs button.active{background:#e8ecdf;color:#3e603f}.view-tabs{border:1px solid #d8ddcd;border-radius:5px;padding:2px}.view-tabs button{padding:6px 10px;font-size:10px}.view-tabs button.active{background:#fffefa;color:#456440;box-shadow:0 1px 4px #354d3520}.viewport{flex:1;min-height:300px;position:relative;background:#eeeae1;overflow:hidden}.canvas-host{position:absolute;inset:0}.canvas-host.hidden{visibility:hidden}.canvas-host :global(canvas){display:block;width:100%;height:100%;touch-action:none;outline-offset:-3px}.scene-caption{position:absolute;left:24px;top:21px;font-size:11px;color:#4b5e46;pointer-events:none}.scene-caption .status-dot{margin-right:8px}.scene-caption small{display:block;margin:5px 0 0 15px;font-size:9px;color:#8e9485}.scene-controls{position:absolute;bottom:46px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;background:#fffdf5ed;backdrop-filter:blur(8px);border:1px solid #dedfce;border-radius:7px;padding:6px;box-shadow:0 5px 20px #5a654415;white-space:nowrap}.scene-controls button{border:0;background:transparent;padding:7px;font-size:16px;color:#657953;border-radius:3px}.scene-controls button span{font-size:9px;margin-left:4px}.scene-controls button.chosen{background:#e8edde}.scene-controls label{font-size:9px;color:#7b896a;display:flex;gap:4px;align-items:center;padding:0 6px}.scene-controls input{accent-color:#688052;width:12px;height:12px}.gestures{position:absolute;bottom:16px;left:12px;right:12px;text-align:center;font-size:9px;color:#8a927f;pointer-events:none}.bottom-bar{height:76px;flex-shrink:0;border-top:1px solid #d9ddce;display:flex;align-items:center;padding:0 26px;gap:32px;background:#faf9f3}.bottom-bar>div strong{font-family:Georgia,serif;font-size:23px;font-weight:400;display:block;line-height:1.1}.bottom-bar>div span{font-size:8px;color:#8f9685}.bottom-bar p{margin-left:auto;font-size:9px;color:#829073;line-height:1.8;text-align:right}.bottom-bar p span{font-size:8px;color:#a0a58f}.plan{position:absolute;inset:50px 20px 38px;display:flex;align-items:center;justify-content:center}.plan :global(svg){width:100%;height:100%}.fit-message{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;color:#6a684d}.fit-message>span{font-size:9px;letter-spacing:2px}.fit-message h2{font:32px/1.2 Georgia,serif;margin:20px 0}.fit-message p{max-width:450px;font-size:12px;line-height:1.8}.loading{position:absolute;inset:0;display:grid;place-items:center;background:#eeeae1;font-size:12px;color:#8a957e}.feedback{position:absolute;bottom:88px;right:16px;max-width:390px;background:#f4f7ed;border:1px solid #c8d4b9;color:#476235;font-size:11px;padding:12px 32px 12px 14px;border-radius:5px;box-shadow:0 5px 25px #0001;z-index:20}.feedback.error{background:#fff1e4;border-color:#d9bb97;color:#8c5b32}.feedback button{position:absolute;right:9px;top:6px;border:0;background:transparent;color:inherit;font-size:18px}button{cursor:pointer;transition:background .15s}button:hover:not(:disabled){filter:brightness(.95)}button:disabled{opacity:.45;cursor:not-allowed}button:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid #789269;outline-offset:3px}
  .walk-pad{position:absolute;right:20px;bottom:105px;text-align:center}.walk-pad>div{display:flex;gap:4px;margin-top:4px}.walk-pad button{background:#fffdf0e8;color:#566f48;border:1px solid #c5cfb7;border-radius:5px;width:38px;height:36px;font-size:20px}
  @media(min-width:1500px){aside{width:326px;padding:34px 28px}h1{font-size:38px}.intro{font-size:12px}.brief li{font-size:12px}.brief small{font-size:10px}}
  @media(max-width:950px){header{padding:0 18px}.project-title{display:none}aside{width:250px;padding:22px 18px}h1{font-size:29px}.toolbar{padding:0 12px}.floor-tabs button{padding:8px;font-size:10px}.bottom-bar{gap:20px;padding:0 18px}.bottom-bar p{display:none}.scene-controls button span{display:none}}
  @media(max-width:650px){.studio{height:auto;min-height:100dvh}header{height:66px}.brand{font-size:11px}.brand-mark{font-size:30px}.report{padding:9px 12px;font-size:10px}main{flex-direction:column}.workspace{order:-1;height:70dvh;min-height:490px;flex:none}.toolbar{height:50px}.floor-tabs button{font-size:9px;padding:7px}.view-tabs button{font-size:9px;padding:6px}aside{width:100%;border-right:0;overflow:visible;padding:25px}.eyebrow{font-size:9px}h1{font-size:32px}.intro{font-size:12px}.bottom-bar{height:60px;justify-content:space-around}.bottom-bar>div strong{font-size:20px}.scene-caption{left:15px;top:14px}.scene-controls{bottom:40px}.gestures{font-size:8px}.scene-controls label{padding:0 3px}.feedback{bottom:70px;max-width:calc(100% - 32px)}.plan{inset:45px 10px 30px}}
</style>
