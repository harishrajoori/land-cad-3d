# Design outputs

Store architecture options and generated images here by property and revision.

Recommended structure:

```text
designs/
  property-1/
    README.md
    options/       # Astra architecture options, coordinates, schedules
    approved/      # owner-approved plan/elevation/section source files
    images/        # Gemini plans, cutaways, exteriors, interiors
    reviews/       # option-specific audit reports
```

File naming:

`P1-R01-ground-plan.png`
`P1-R01-first-plan.pdf`
`P1-R01-west-exterior.png`
`P1-R01-living-interior.png`

Never move an image to `approved/` merely because it looks attractive. The corresponding dimensioned geometry and audit must share the same revision.
