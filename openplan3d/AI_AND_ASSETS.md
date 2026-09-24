# AI realism & assets — how to use

This app now has three ways to make your home look more real. All AI features use
**your own OpenAI API key** (Settings → AI), run from your browser, and are billed
to your OpenAI account. Nothing is sent to any server we host.

## A. Photoreal render (biggest realism win)

In the 3D view, open the **AI Render** panel. Pick a style / lighting / mood, then
render. The app captures the current 3D view and sends it to your OpenAI image
model, which returns a photorealistic version.

- The prompt is tuned to **preserve your exact layout, walls, windows, furniture,
  and camera** — it upgrades materials/lighting only, so the result stays faithful
  to your design.
- Capture resolution matches the render size (1536×1024) for sharper output.
- Use a Responses model that supports the image tool (e.g. **gpt-4.1**, or
  **gpt-5.2 / GPT Image 2.5** where available). GPT Image / DALL·E model ids cannot
  be used as the *Responses* model — the app will tell you if you pick one.

> Note: image models can still subtly reinterpret a scene. Treat renders as a
> realistic *impression* for decision-making, not a measured drawing.

## B. AI-generated materials (real-time)

In the sidebar **Objects** tab → **AI Materials (GPT Image)**, generate a seamless,
photoreal texture for each surface (wood, marble, porcelain, subway tile, brick,
stone, concrete). Generated textures are:

- Applied to the live 3D view immediately (not just stills).
- **Cached in your browser** so they persist and don't re-bill on reload.
- Revertible to the built-in texture with the ↺ button.

## C. Real furniture (CC0 3D models)

The sidebar **Objects** tab → **Custom model** lets you import `.glb` furniture and
place it in the plan. Good free / CC0 sources:

- **Poly Haven** (polyhaven.com) — CC0 models, textures, HDRIs.
- **ambientCG** (ambientcg.com) — CC0 materials/models.
- **Sketchfab** — filter by *Downloadable* + CC0/CC-BY license (check each model).
- **Khronos glTF sample assets** — permissively licensed test models.

Import as GLB, fill in the name and (for CC-BY) the attribution/source fields the
panel provides. Prefer small, embedded-texture GLBs for best performance.

## Honest scope

Real-time 3D here is "very good," not Coohom-level photoreal. The photoreal *stills*
(A) are where you get magazine-quality results. Use A for the "real feel," B to make
the live view nicer, and C to furnish with realistic models.
