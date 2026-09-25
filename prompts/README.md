# Minimal AI workflow commands

All recurring requirements live in [`requirements/COMMON-DESIGN-RULES.md`](../requirements/COMMON-DESIGN-RULES.md). Kiro/GPT-6 Astra receives them automatically through `.kiro/steering/home-design.md` whenever the request concerns this house.

## In Kiro / GPT-6 Astra

You can simply ask:

- **“Design Property 1.”**
- **“Design a 40 × 60 ft plot with west road and north-facing door.”**
- **“Audit Property 1 option R01.”**
- **“Apply the accepted corrections and prepare the owner concept pack.”**

The files below are optional short workflow commands:

1. [`01-GPT6-ASTRA-ARCHITECTURE.md`](01-GPT6-ASTRA-ARCHITECTURE.md)
2. [`02-GPT6-ASTRA-AUDIT.md`](02-GPT6-ASTRA-AUDIT.md)
3. [`03-GEMINI-VISUALIZATION.md`](03-GEMINI-VISUALIZATION.md)

## In external Gemini

Gemini cannot see local steering automatically. Create a Gemini Gem/project once and attach:

- `requirements/COMMON-DESIGN-RULES.md`
- `DESIGN-BRIEF.md`
- selected `properties/*.md`
- approved dimensioned plans
- material/style board

Then use Prompt 03 for each view.
