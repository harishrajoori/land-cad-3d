# Karimnagar Family Home — AI Design Workspace

A focused repository for developing, reviewing and visualizing a family-home concept using GPT-6 Astra, Gemini, professional architects/engineers and the family's Vaastu consultant.

This repository contains **knowledge, requirements, factual property records, prompts, review checklists and design outputs**. It no longer contains the experimental 3D application or generated model engine.

## Start here

1. Read the current [Owner Design Brief](DESIGN-BRIEF.md).
2. Use the [Common Design Rules](requirements/COMMON-DESIGN-RULES.md) for all recurring architecture, access, Vaastu, civil and visualization requirements.
3. Read the [Owner Decision Log](reviews/DECISION-LOG.md); later decisions override old generated content.
4. Read the selected factual property record in [`properties/`](properties/README.md).
5. Use [`knowledge/VAASTU-KNOWLEDGE.md`](knowledge/VAASTU-KNOWLEDGE.md) as the canonical Vaastu/source reference.
6. Ask GPT-6 Astra for the strongest self-audited architecture concept with [`prompts/01-GPT6-ASTRA-ARCHITECTURE.md`](prompts/01-GPT6-ASTRA-ARCHITECTURE.md). Astra internally compares alternatives before presenting its recommendation.
7. Audit the selected option once with [`prompts/02-GPT6-ASTRA-AUDIT.md`](prompts/02-GPT6-ASTRA-AUDIT.md) and [`reviews/DESIGN-CHECKLIST.md`](reviews/DESIGN-CHECKLIST.md).
8. After owner approval, use [`prompts/03-GEMINI-VISUALIZATION.md`](prompts/03-GEMINI-VISUALIZATION.md) for plans, cutaways, exteriors and interiors.
9. Store outputs under [`designs/`](designs/README.md) with one revision identifier.

## Current project basis

- Selected site: Property 1, 50 ft E–W × 80 ft N–S, west road recorded at 20 ft.
- G+1, independent households and external first-floor stair.
- Ground floor: two bedrooms plus office.
- Property 1 ground main door: north-facing, approached from the west/NW gate through the north side.
- Separate daily and Mallanna pooja rooms in NE; no bathroom shared wall.
- Kitchen SE; master sleeping zone SW; Bedroom 2 W/NW; office N/NW.
- One car + two two-wheelers.
- Garden and children's play/open space.
- No dedicated/permanent Patnam area.
- First-floor detailed programme is flexible; independent 2BHK is the current default direction.

The machine-readable version is [`requirements/home-requirements.json`](requirements/home-requirements.json).

## Repository map

```text
README.md
DESIGN-BRIEF.md
requirements/
  COMMON-DESIGN-RULES.md
  home-requirements.json
properties/
  README.md
  PROPERTY-1-WEST-80x50.md
  PROPERTY-2-CORNER-WEST-SOUTH-50x39.md
  PROPERTY-3-NORTH-51x47.md
knowledge/
  VAASTU-KNOWLEDGE.md                 # canonical
  TELUGU-TELANGANA-VAASTU.md          # supplementary checklist
  sources/                            # locally preserved reference PDFs
prompts/
  README.md
  01-GPT6-ASTRA-ARCHITECTURE.md
  02-GPT6-ASTRA-AUDIT.md
  03-GEMINI-VISUALIZATION.md
reviews/
  DECISION-LOG.md
  DESIGN-CHECKLIST.md
designs/
  README.md
  property-1/README.md
.kiro/steering/
  home-design.md                      # auto-context for Kiro/Astra
```

## Working principles

- An AI-generated image is not architecture or construction proof.
- Generate multiple concept options, select one, then perform one independent audit.
- Use dimensioned geometry as the source of truth for every later image.
- Do not ask Gemini to invent/certify floor-plan geometry.
- Separate owner requirements, source guidance, design proposals and professional hold points.
- Do not silently change room counts, access, parking, pooja arrangement or entrance facing.
- Survey, municipal, structural, services and consultant review remain mandatory before construction.

## Professional handoff

The selected owner concept should eventually include a surveyed/legal site plan, dimensioned ground/first/roof plans, elevations, sections, room and opening schedules, parking/stair geometry, column/service concept, Vaastu decisions/exceptions and coordinated visualization references.

Professionals may adjust columns, wall thicknesses, shafts, stair geometry, doors/windows and local wall positions. Major changes to entrance facing, room programme, kitchen/master/pooja zones or household independence require owner approval.

## Current status

Knowledge and requirements are consolidated. No floor plan is currently marked owner-approved. Start a fresh architecture-options cycle using Prompt 01 rather than repairing old generated images.
