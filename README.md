# Land CAD 3D — Vaastu Home Design & Walkthrough

A single-file, local, browser-based tool to explore a plot, auto-lay-out a
Vaastu-compliant home, walk through it in 3D, and export plans for discussion
with your engineer and Vaastu consultant.

No server, no build step, no subscription. Open `index.html` in a browser.

## Features

- **Plot input** — front / rear / left / right dimensions (feet), supports
  irregular 4-corner plots, plus a green/setback zone.
- **Facing direction** (N/E/S/W) — drives Vaastu placement; rotating the facing
  rotates the whole layout so rooms stay in the correct absolute compass corner.
- **Vaastu-driven auto-layout** — rooms placed per the Vastu Purush Mandala:
  Pooja NE, Kitchen SE, Master SW, Living N, Dining S, Bath/Utility NW,
  Brahmasthan (center) kept open.
- **Two view modes:**
  - **Dollhouse** — orbit + cutaway, 16-zone Vaastu Chakra overlay, structural
    column grid.
  - **Walk Through** — first-person (WASD + mouse look, Shift to run), full-height
    walls, wall collision. Walk from outside into the home.
- **Save / load land models** — name and store designs in the browser, plus
  export/import as `.json` files committed under `models/` for review later.
- **Exports for discussion:**
  - Engineer CAD `.DXF` (boundaries, rooms, labels, columns)
  - Engineer summary sheet (dimensions + room areas, print to PDF)
  - Vaastu placement/compliance report (print to PDF)
  - Save the current 3D view as `.png`
- **Photoreal render (optional)** — send the current view + a prompt to OpenAI
  GPT Image 2.5 using your own API key (stored only in your browser).

## Run it

Open `index.html` directly, or serve the folder:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Saved models

See `models/README.md` for the file format. Export a design as `.json`, drop it
in `models/`, and commit it to keep a reviewable history of every plot.

## Honest scope

This is a **decision-and-exploration** tool. The layout is Vaastu-correct in
placement and scale-accurate, but it is a schematic — not a structurally
engineered plan, and not photorealistic on its own. Use the exports to have
sharp conversations with your architect/engineer and Vaastu consultant, and
validate structure, plumbing, and local building codes with a professional
before building.

## Privacy

Everything runs locally. The only feature that sends data off your machine is
the optional photoreal render, which calls OpenAI directly with your own key.
API keys and secrets are gitignored.
