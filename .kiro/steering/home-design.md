---
inclusion: auto
name: karimnagar-home-design
description: Apply when creating, reviewing, comparing or visualizing house plans, property options, Vaastu layouts, room designs, exteriors, interiors, stairs, parking or engineer handoff material for this family-home repository.
---

# Karimnagar family-home design steering

Before house-design work, use these repository references:

#[[file:DESIGN-BRIEF.md]]
#[[file:requirements/home-requirements.json]]
#[[file:requirements/COMMON-DESIGN-RULES.md]]
#[[file:reviews/DECISION-LOG.md]]
#[[file:reviews/DESIGN-CHECKLIST.md]]
#[[file:knowledge/VAASTU-KNOWLEDGE.md]]
#[[file:knowledge/TELUGU-TELANGANA-VAASTU.md]]
#[[file:properties/README.md]]
#[[file:properties/NEW-PROPERTY-TEMPLATE.md]]

## Authority and precedence

1. Latest dated owner decision.
2. Current owner brief / machine-readable requirements.
3. Surveyed/legal/engineering constraints.
4. Canonical Vaastu source synthesis plus family-selected consultant decisions.
5. Proposed architecture.
6. Visualization style.

Do not treat old generated plans, images or superseded models as authority.

## Required behavior

- Select/read the factual property file, or parse arbitrary dimensions/roads using the new-property template.
- If dimensions and road/access side are sufficient, proceed without asking the user to repeat common requirements.
- Use Karimnagar and the common family programme by default unless explicitly overridden; disclose assumptions.
- Keep road side, gate position and house-door facing separate.
- Distinguish hard owner requirements, design targets, source guidance and professional hold points.
- Internally generate at least three materially different architecture options and score them using the common rules.
- Self-audit the top option against the acceptance checklist and correct blockers/majors before showing it.
- Present one strongest complete concept first; summarize why alternatives ranked lower instead of forcing repeated option-by-option reviews.
- Include area budget, room schedule, adjacency/access graph, furniture fit, parking/stair, daylight/ventilation, structure, services and G+1 stacking.
- Avoid rigid grids, oversized rooms and hotel-style corridors.
- Do not declare infeasibility from one failed packing arrangement.
- Mark exact entrance pada, toilet sub-zone, survey, municipal and structural status unresolved until reviewed.
- Never claim legal, structural or final Vaastu certification.
- Use image generation only after dimensioned geometry is owner-approved.
- Record decisions and revision IDs; do not silently alter requirements.

## Default output for “design this property”

1. Parsed property facts and disclosed assumptions.
2. One recommended, internally scored/self-audited architecture concept.
3. North-up site and dimensioned floor-plan artifact(s).
4. Room/area schedule and room-by-room access directions.
5. Parking/stair/furniture, ventilation, structural/service and G+1 checks.
6. Vaastu PASS / PREFERENCE / CONSULT matrix.
7. Concise alternatives considered and why they ranked lower.
8. Professional hold points and owner decisions—not repeated generic warnings.

Ask a question only when plot geometry or road access is missing/contradictory. Otherwise finish the first concept in the same turn.
