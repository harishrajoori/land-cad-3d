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
