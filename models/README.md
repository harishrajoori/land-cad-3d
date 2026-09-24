# Saved Land Models

Each `.json` file here is one saved land/plot design you can review later.

## How it works

- In the app, enter a **plot name** and click **Save** to store the design in your browser (persists across refreshes).
- Click **Export .json** to download the current design as a file. Move it into this `models/` folder and commit it, so every plot you evaluate is versioned in git and reviewable later.
- Click **Import .json** to load any saved file back into the app.

## Model file format

```json
{
  "schema": "land-cad-3d/model",
  "version": 1,
  "name": "33x60 East",
  "savedAt": "2026-09-24T18:00:00.000Z",
  "config": {
    "front": 33, "rear": 33, "left": 60, "right": 60,
    "greenArea": 300,
    "facing": "E",
    "vaastuStrict": true,
    "showVaastu": true, "showGrid": false, "cutaway": true
  }
}
```

`config` fields:
- `front`, `rear`, `left`, `right` — plot side lengths in feet.
- `greenArea` — green-zone area in sq.ft.
- `facing` — direction the front of the plot faces: `"N"`, `"E"`, `"S"`, or `"W"`. Drives Vaastu room placement.
- `vaastuStrict` — when `true`, rooms are auto-placed per Vaastu (pooja NE, kitchen SE, master SW, etc.).
- `showVaastu`, `showGrid`, `cutaway` — view toggles.

Older model files without `facing`/`vaastuStrict` still load (defaults are used).

## Version 2 schema (rich requirements)

Model files can also carry `site`, `program`, `notes`, and `location` blocks that
capture real requirements (roads, corner status, G+1 structure, per-floor room
program, family split). The 3D engine currently renders only the single-floor
Vaastu layout from `config`, but these extra blocks are **preserved on save** and
serve as the documented spec to share with your engineer and Vaastu consultant.

```json
{
  "schema": "land-cad-3d/model",
  "version": 2,
  "name": "Property 1 — West 80x50",
  "location": "Karimnagar, Telangana",
  "config": { "front": 80, "rear": 80, "left": 50, "right": 50, "facing": "W", ... },
  "site": {
    "roads": [{ "side": "W", "widthFt": 20 }],
    "corner": false
  },
  "program": {
    "structure": "G+1",
    "familySplit": { "ground": "Self + family", "first": "Brother + family" },
    "shared": ["Garden", "Children play space"],
    "groundFloor": { "type": "3 BHK", "rooms": [ { "name": "Master Bedroom", "zone": "SW" }, ... ] },
    "firstFloor":  { "rooms": [ ... ] }
  }
}
```

Vaastu zones use: NE, E, SE, S, SW, W, NW, N, C (center/Brahmasthan).

### Included property files
- `property-1-west-80x50.json` — West-facing, 80 ft front × 50 ft depth, 20 ft road.
- `property-2-corner-wsw.json` — Corner plot, West side 39 ft (20 ft road) + South side 50 ft (30 ft road).
- `property-3-north-51x47.json` — North-facing, 51 ft front × 47 ft depth, 20 ft road.
- `33x60-east.json` — earlier example.
