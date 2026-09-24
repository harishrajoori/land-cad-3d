# Land CAD 3D — Vaastu Home Design & Walkthrough

Tools to explore plots, auto-lay-out a Vaastu-compliant home (G+1), walk through
it in 3D, and export plans for your engineer and Vaastu consultant.

This repo now has **two parts**:

## 1. `openplan3d/` — the main app (recommended)

A full 2D/3D floor-plan editor (SvelteKit + Three.js), adopted from the MIT-licensed
[openPlan3D](https://github.com/laanlabs/openPlan3D) and **extended with a Vaastu layer**.

What it gives us out of the box: a real 2D editor, instant 3D view, **first-person
walkthrough**, **multiple floors (G+1)**, doors/windows/stairs/furniture, materials
and lighting, and exports to **DXF, PDF, SVG, PNG, JSON** — plus an optional
**AI photoreal render** (OpenAI Responses / Gemini, browser-only keys).

Our additions:
- `src/lib/utils/vaastuTemplates.ts` — generates **G+1 Vaastu house plans** with
  rooms auto-placed by the Vastu Purush Mandala (kitchen SE, master SW, pooja NE,
  living N, toilets NW, staircase S). Registered in the template picker.
- Three ready templates for the real Karimnagar properties:
  - **Property 1** — West-facing 80×50 ft
  - **Property 2** — Corner (W+S roads) 50×39 ft
  - **Property 3** — North-facing 51×47 ft
- Each generates a two-floor plan: ground = 3 BHK + daily pooja (NE) + large
  occasional pooja + common bath; first floor = brother's unit.

### Run it

```
cd openplan3d
npm install
npm run dev        # http://localhost:5173
```

Open the app, click **New Project → Templates**, and pick one of the 🕉️ Vaastu
templates. Toggle 3D and walkthrough, add a second floor, and export for your
engineer. For photoreal renders, add an OpenAI key in Settings → AI (use a
Responses model such as gpt-4.1, or GPT Image 2.5 where supported).

### Vaastu logic

Vaastu zones are **absolute** compass directions (North is up in the plan), so a
kitchen always lands in the real South-East corner regardless of facing. The plot's
`facing` decides which road-side wall carries the main entrance. Zone→cell mapping
and the G+1 generator are covered by `tests/vaastu-templates.test.ts`.

## 2. `index.html` — the original single-file prototype

The earlier zero-dependency Three.js prototype (parametric plot + Vaastu overlay +
walkthrough + DXF + reports + GPT Image hook). Kept as reference. See `models/` for
the property spec files.

## Honest scope

Both are **decision/exploration** tools. Layouts are Vaastu-correct in placement and
scale-accurate, but schematic — not structurally engineered, and not photorealistic
on their own. Validate structure, plumbing, and local codes with a professional, and
confirm Vaastu specifics with a local Karimnagar consultant, before building.

## Licenses & attribution

`openplan3d/` retains its MIT `LICENSE` (© the openPlan3D authors). Our additions are
under the same terms.
