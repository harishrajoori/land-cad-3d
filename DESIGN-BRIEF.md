# Family home — fixed requirements and engineer discussion brief

Status: preliminary requirements brief, 25 September 2026. This is not a completed floor plan or construction drawing.

## Purpose

Explore a house on the actual land, compare room arrangements, experience its scale through a 3D walkthrough, and give the engineer a clear starting point for discussion. The design should reflect the owner's local style and chosen Vaastu preferences. Core planning, editing, walkthrough, saving, and exports should work without a paid AI service.

## Fixed requirements and changing plots

The owner confirmed that the house requirements stay the same when property dimensions change. The reusable baseline is saved in [requirements/home-requirements.json](requirements/home-requirements.json). Property 1 is the current example site, not a restriction on the brief.

Keep the G+1 household program, independent entrances and upstairs stair, two-car/two-two-wheeler parking, separate daily pooja, four-person Mallanna room with its raised platform/table and decorated four-pillar pandal, prasadam space, outdoor Patnam in front of the home, garden/play space, and local-style/Vaastu approach across property options. Details not yet decided remain open; they are not converted into fixed requirements.

Plot measurements, shape, facing, roads, setbacks, room sizes, and placement are separate inputs. The current 800 sq ft garden allocation is a Property 1 target, not a fixed minimum for every property. Outdoor Patnam follows the front of the home; it is not permanently assigned to the west. Vaastu preferences use actual compass directions.

Changing a plot should trigger a new fit assessment. If the full brief cannot fit, identify the conflict and discuss alternatives with the owner instead of silently removing a room, reducing parking or worship capacity, or merging the households' access.

This separation is currently recorded in the requirements files. The existing renderers do not yet load or enforce the reusable profile automatically. Property files retain inline program snapshots for compatibility.

## Current example land — Property 1

The owner selected Property 1 in this conversation: **west-facing, 80 ft frontage × 50 ft depth**.

| Item | Value | Basis |
| --- | --- | --- |
| West frontage, north–south | 80 ft | Owner confirmed |
| Plot depth, east–west | 50 ft | Owner confirmed |
| Rectangular area | 4,000 sq ft | Calculated; assumes rectangular boundaries |
| Location | Karimnagar, Telangana | Saved property file; confirm exact site |
| Road | West, 20 ft wide | Saved property file; confirm surveyed width |
| Garden target | 800 sq ft | Saved property file; provisional |
| North | Up in the plan | Drawing convention; actual surveyed bearing pending |

The 800 sq ft garden target is 20% of the assumed plot area. The remaining 3,200 sq ft is **not** an approved building footprint: access, parking, setbacks, and other open areas still need allocation. No local setback, coverage, or height limits have been assumed.

Record a survey drawing or boundary coordinates before producing an exact site model. Four side lengths alone do not establish the shape of an irregular plot.

## Household and room requirements

The existing room program is retained in the reusable baseline and in `models/property-1-west-80x50.json`. Extra rooms and detailed dimensions remain undecided. The owner has confirmed **independent access with separate entrances and a dedicated staircase for the upstairs household, with no shared internal access**.

| Floor | Occupants | Recorded spaces |
| --- | --- | --- |
| Ground | Owner and family | Three bedrooms, living/hall, kitchen, dining, daily pooja, dedicated occasional Mallanna pooja room for four people, common bathroom; separate entrance |
| First | Brother and family | Two bedrooms, living/hall, kitchen, bathroom; saved description requests a similar arrangement where possible |
| Upstairs access | Brother and family | Dedicated staircase reached from outside without entering the ground-floor home |
| Parking, confirmed | Both households combined | Two cars and two two-wheelers; allocation and covered/open arrangement undecided |
| Outdoor Patnam, confirmed | Mallanna worship | Clear space outside in front of the home for drawing Patnam; dimensions undecided |
| Outside | Both families | Garden and children's play space; sizes and sharing arrangements remain unconfirmed |

The first-floor access route must remain usable when the ground-floor home is locked. Reserve a separate stair footprint and landing, outside the ground-floor home's private circulation. Stair enclosure, exact position, and separate versus common site gates remain design decisions. The access decision does not establish how garden, parking, or utilities will be shared.

Decisions needed before a useful first layout:

- Vehicle sizes, parking allocation between households, covered/open parking, and gate location; total capacity is confirmed as two cars and two two-wheelers.
- Attached bathrooms, utility/wash area, storage, balcony/terrace, and any future lift provision.
- Mallanna shrine/platform dimensions and outdoor Patnam area; the indoor arrangement is confirmed below. Whether the four-person capacity includes a pujari remains open.
- Step-free ground-floor access and any elderly family members' needs.
- If a property cannot fit the fixed brief, which design alternatives or explicit requirement changes the owner will accept.
- Overall construction budget and whether both floors will be built together.

## Local style and Vaastu preferences

“Local style” is an owner requirement; its visual and practical details are still open. Discuss verandah/sit-out, courtyard preference, roof and terrace use, privacy from the road, materials, shading, and two or three reference houses the owner likes. Do not assume a generic decorative style represents a Telangana home.

The saved brief requests these Vaastu positions:

| Space | Recorded preference |
| --- | --- |
| Master bedroom | South-west |
| Kitchen | South-east |
| Daily and occasional pooja | North-east |
| Living/hall | North |
| Common bathroom | North-west |
| Stair | South; notes also allow south/west |
| Dining and second bedroom | West |
| Third bedroom | South |
| Main entry | West road, toward the north-west/west part of the frontage |

These are the owner's recorded cultural design preferences, not a verified compliance assessment. Confirm which are essential, which are flexible, and the reference point and entrance rules to use with the owner's Vaastu consultant.

Several spaces request the same direction. They need separate usable footprints within those areas; assigning one room to each square of a nine-cell grid cannot satisfy this brief. Any compromise should be visible and discussed, rather than silently relocating a room.

### Mallanna pooja room — confirmed purpose and research

The owner identified the occasional pooja room as specifically for **Mallanna**, with space for **four people**. This clarifies the earlier generic “large occasional pooja” requirement; a large gathering hall should not be assumed. The separate daily pooja space remains in the saved program.

The owner subsequently clarified the arrangement:

| Element | Confirmed requirement |
| --- | --- |
| Patnam | Outside the room, in front of the home; reserve floor space to draw it |
| Indoor capacity | Usable space for four people, in addition to the shrine and offerings |
| Shrine base | Elevated floor/platform and a table-like surface |
| Pandal | Four pillars with decoration |
| Prasadam | Offered in front of the deity; reserve an accessible offering space |

The four pandal pillars are part of the shrine arrangement; do not count them as building structural columns. Platform height, table arrangement, pillar spacing, canopy height, deity facing, and materials remain to be designed. Keep the four-person worship space clear of the platform and pillar footprints.

For this west-facing plot, interpret “in front of the home” as the west frontage for the initial concept. Allocate the outdoor Patnam area within the plot and coordinate it with vehicle parking, gates, and the independent upstairs access. Its footprint and any temporary parking relocation during rituals remain unresolved; do not silently count the same space for simultaneous parking and Patnam use.

The Ministry of Tourism's [Komuravelli Mallanna Jaathara reference](https://utsav.gov.in/view-event/komuravelli-mallanna-jaathara), consulted on 25 September 2026, describes Mallanna as Mallikarjuna Swamy, a form of Shiva. It documents Oggu Pujaris creating **Patnam**, a ritual floor design, during worship at the temple and its verandah. This is a reference for the Komuravelli tradition, not confirmation of this family's specific practice or a prescription for a domestic pooja room.

Additional planning considerations, rather than established ritual requirements:

- Obtain the required outdoor Patnam drawing dimensions and space around it from the family or pujari.
- Allow indoor space for four people, prasadam offerings, and access to the raised shrine; confirm whether the four includes a pujari.
- Discuss a cleanable floor, storage for worship items, and ventilation appropriate to the actual use of lamps/incense.
- Confirm the family's image/idol dimensions before fixing the platform and decorated pandal footprint or facing.

No standard Mallanna home-room dimensions or universally required domestic arrangement were established by this source. The family's description above governs this concept; keep dimensions provisional until its required clearances are established. The recorded north-east preference comes from the saved brief, not from this temple reference. These requirements are recorded in the brief and property file; they are not yet represented in the generated 3D template.

## What the repository currently supports

The `openplan3d/` app supplies a 2D editor, 3D viewer and first-person navigation, multiple floors, furniture, and PDF/DXF/SVG/PNG/JSON export code. Vaastu templates are registered in its template picker. This is the practical foundation to extend.

The older root `index.html` prototype includes plot controls and saved property requirements, but its model format is different from an OpenPlan3D project. The rich site and family brief needs an explicit bridge into the main editor; a property JSON file should not be treated as a ready-to-import editor project.

AI image rendering is optional and separate from the editable plan. An attractive generated image does not establish that room dimensions, openings, or structural features match the model. Conversational design changes should modify and validate the actual plan, then show a proposed revision for review.

## Findings from the template review

| Finding | Effect | Status |
| --- | --- | --- |
| Property 1 used 80 ft east–west and 50 ft north–south | West frontage was transposed | Corrected to 50 ft east–west and 80 ft north–south; regression test added |
| Exterior house walls span the whole plot | No explicit garden, road, setbacks, or parking within the site model | Open |
| Interior grid walls have no internal doors | Room-to-room access is not designed | Open |
| Ground-floor stair and third bedroom occupy the south cell | Overlapping uses | Open |
| Template does not provide the confirmed independent upstairs access | Brother's household needs a dedicated route from outside, separate from the ground-floor home | Open; requirement recorded, geometry not yet implemented |
| Furniture in a room shares a centre point | Items such as bed/wardrobe and toilet/sink overlap | Open |
| Room names are not emitted by the template as named room records or annotations | Intended room use is not reliably communicated by the generated sketch | Open |
| Occasional pooja is moved to the centre and dining to the east | Template differs from saved preferences | Open |
| Template data is duplicated separately from saved site requirements | Roads, garden targets, and family details can drift | Open |

The five current Vaastu template tests pass after the frontage fix. They check template structure, coordinate validity, basic zone mapping, and Property 1 orientation. They do not establish circulation, room fit, local compliance, or satisfactory Vaastu design. The review was of source and focused tests, not a complete visual acceptance test of the editor.

## Implementation order

1. **Site and brief:** connect the reusable house requirements to each editable project, keeping plot geometry, north bearing, roads, user-entered setbacks, and site-specific area targets separate. Preserve the fixed requirements when site inputs change and keep unknown values visibly unresolved.
2. **Usable concept layout:** replace the rigid grid with named, dimensioned spaces, connected doors and circulation, separate stairs, correctly sized furniture, and an actual open-space allocation. Produce two alternatives only after the essential household decisions are settled.
3. **Inspection:** use the same geometry for 2D and 3D; show north, plot boundary, roads, dimensions, both floors, and human-scale walkthrough views. Make it easy to inspect entry, kitchen, bedrooms, garden, and upstairs access.
4. **Preference review:** evaluate chosen Vaastu preferences and geometry constraints after every edit. Explain conflicts with specific rooms; retain owner-approved exceptions.
5. **Engineer handoff:** export a coordinated discussion pack and editable model. Preserve a revision identifier so plans, screenshots, and notes refer to the same design.
6. **Conversational assistance:** translate requests such as “make the kitchen larger but retain the garden” into proposed model edits; preview the changes, flag affected constraints, and support undo. Keep the core editor usable without an AI key. A local-model integration can be evaluated once hardware is known.

## Engineer discussion pack to produce from the chosen concept

- Site plan with measured boundaries, north, roads, proposed setbacks, footprint, garden, parking, and access.
- Ground- and first-floor plans with clear room names, internal dimensions, wall thicknesses, doors, windows, stairs, and floor levels.
- Area schedule distinguishing plot area, footprint, each floor's area, garden, and other open areas.
- 3D views from the street, garden, and key rooms, linked to the same model revision.
- Household requirements, local-style references, Vaastu preferences and agreed exceptions.
- Open decisions for the engineer: final circulation, stair arrangement and headroom, structure, foundations/soil information, service routing, drainage, and local approvals.
- PDF for discussion, DXF for drawing exchange, and project JSON for returning to this editable concept.

The engineer should develop and approve the final technical design from the chosen concept. This brief intentionally leaves engineering dimensions and local statutory requirements unresolved until verified for the site.

## First concept acceptance criteria

- Fixed house requirements persist across changes to plot dimensions. Conflicts are reported explicitly; a smaller plot must not silently reduce the household program, independent access, parking, or worship capacity.
- The west boundary is 80 ft and the east–west depth is 50 ft; the road appears on the west.
- The proposed building sits within the entered buildable envelope, with the chosen garden and parking allocation accounted for.
- Parking accommodates two cars and two two-wheelers, with access to both entrances and the dedicated upstairs staircase kept clear when all four vehicles are parked. Check vehicle manoeuvring space using the chosen vehicle sizes.
- Both household programs are explicitly represented; missing or compromised requirements are listed.
- The indoor Mallanna room shows four-person worship space, a raised shrine/table-like surface, a decorated four-pillar pandal, and prasadam space in front of the deity. Patnam is shown separately outside in front of the home, with its use coordinated with parking and access.
- Every habitable room has a designed access route; furniture and stairs do not overlap other uses.
- The upstairs household can reach its own entrance by a dedicated staircase while the ground-floor home is locked; no access route passes through the other household's private rooms.
- 2D plans, 3D views, room schedules, and exports describe the same revision.
- The owner can compare options and walk through them; the engineer can identify assumptions and decisions requiring review.
