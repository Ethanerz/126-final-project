# RateUPV product research and MVP direction

Research date: 2026-10-18. Evidence: repository README and `docs/REFACTOR_PLAN.md`, plus the primary sources linked below. This is desk research, not student validation. No students were interviewed, production usage was not measured, and no university partnership was established.

## Product decision

**Help a UPV student find the right place or service and arrive prepared.** Start with the Miagao campus as a pilot assumption, preserving any existing other-campus content. Student reviews supply firsthand context after practical information has answered the immediate task.

The core journey should be: choose a task or search a familiar office/building name → find the relevant service → understand purpose, location, contact, requirements and uncertainty → open directions or the official service page → optionally contribute an experience or correction.

This is a product hypothesis. It is stronger than “Rate My Professors for buildings” because a required university office is often not interchangeable. A student can benefit from knowing what to bring even when its rating cannot change their choice. A directory that remains useful before its first review also has a better cold-start proposition. These are inferences to test, not observed student outcomes.

## What the evidence establishes

- UPV already publishes a student handbook containing library service information and directs students to the library website and Facebook page. An earlier handbook also contains a Miagao facilities map. Official information therefore exists; RateUPV must help students reach and use it, with source links and freshness, rather than claim it invented campus discovery. [UPV 2024–2025 student handbook](https://our.upv.edu.ph/media/attachments/2025/06/02/upv-student-handbook-for-ay-2024-2025.pdf), [UPV 2023–2024 handbook and campus guide](https://www.upv.edu.ph/files/upv-student-handbook-2023-2024.pdf).
- A 2026 first-year orientation announcement introduces key offices and welfare services, and explicitly announces a venue change between campuses. This supports the need to distinguish campuses and changing information. It does not prove that students want a new application. [OUR orientation announcement, 6 August 2026](https://our.upv.edu.ph/index.php/bulletin/orientation-program-for-first-year-students-and-parents).
- The 2025 Citizen’s Charter documents feedback submission and university routing through PACD/IPO/OVCA and concerned units. A public RateUPV review cannot honestly promise that route or its response expectations without an agreement. Provide an official-channel link and clearly explain the difference between a content report, a correction and a university complaint. [UPV 2025 Citizen’s Charter, feedback and complaints](https://www.upv.edu.ph/files/upv-citizens-charter-2025.pdf).
- Google Maps already supports place reviews, updates, helpful reactions and content reporting; its help page states that reviews are public and cannot be anonymous. RateUPV’s distinction must be more specific than “reviews on a map.” [Google Maps review help](https://support.google.com/maps/answer/6230175).

Some UPV PDF URLs timed out on direct retrieval, although the official search-indexed document excerpts were available. Treat those as publication evidence, not a live confirmation of every phone number, opening time or requirement. A historical handbook is not evidence that a service is open today.

## Competitors and substitutes

| Alternative | What it already does | How RateUPV could earn a place |
| --- | --- | --- |
| Official handbook, OUR and office pages | Authoritative procedures, contacts, policies and announcements | Task-based discovery, concise preparation, direct source links, explicit source date and corrections. Keep official procedures authoritative. |
| Google Maps | General place discovery, navigation, ratings and community updates | Campus service vocabulary, eligibility/requirements, campus-specific firsthand experience and clearer separation of maintained facts from observations. Do not rebuild general navigation. |
| Room TBA and its UPV fork | Upstream is a campus room/class finder with mapping, routes, services and correction tools; its maintainers list `andrianllmm/upv-room-tba` as the UP Visayas fork | Focus on service preparation and student experience. Consider links or cooperation if useful; a new map canvas is weak differentiation. |
| Official Facebook pages | UPV itself directs students to some office pages, including the library and OSA | Link directly to the relevant official page and organize information by task, rather than making students search through disconnected announcements. |
| Friends, group chats and community groups | Plausible informal advice substitutes | Test whether a stable, shareable answer saves repeated questions. Actual UPV group usage, reach and pain points were not verified in this research. |

Room TBA’s own site reports its UPLB tools, names a UPV fork and describes a donation-supported student project. The upstream README describes room/course search, schedules, campus services, edit suggestions and offline behavior. **Those are upstream capabilities and first-party claims; the UPV fork’s deployment, current completeness and adoption were not independently verified.** Do not transfer UPLB usage figures to UPV. [uplb.tools](https://www.uplb.tools/), [Room TBA upstream README](https://github.com/uplbtools/room-tba).

An additional project name, UPdiKo, appeared in a secondary search result. Its first-party repository could not be fetched, so it is an investigation lead, not a verified competitor claim.

This search is not exhaustive. No evidence here establishes that RateUPV is the only UPV review product, that alternatives are inadequate, or that any application has university endorsement.

## Narrow MVP

1. **Useful browsing before sign-in:** search names, acronyms and tasks; filter by campus and a small category set such as study, documents, food, health/support, housing and recreation. Choose relevant or name ordering instead of defaulting every place to highest stars. Include unreviewed places.
2. **Preparation on each detail page:** what the service is for; building/landmark and campus; useful official contact/link; hours and requirements when actually sourced; source and date; clear unknown states. Keep official facts and student tips visibly distinct. Do not infer opening hours, fees, accessibility, wait times or exact pins from a generic description.
3. **Honest student evidence:** firsthand review with rating, visit month where supported, public display name, review count and recency. One current review per author/place is sufficient. Show sparse evidence honestly and avoid “best” badges justified by one review. A university email confirms mailbox access, not present enrollment, UPV affiliation or that a visit occurred.
4. **Contribution with an exit:** eligible account sign-in, create/update/delete own review, recover from failed submissions, preserve a draft through sign-in. Existing real contributions and URLs should survive migration.
5. **Maintenance:** suggest a correction/missing place, report inappropriate content, and give operators a queue with statuses. A report must reach durable storage and a person’s workflow; an inert button or local-only success message is not an operational report feature.
6. **Map as support:** lazy-load the map; synchronize visible places with filters; show unknown coordinates honestly; offer a list when the map fails and external directions when a location is known.

Defer a social feed, review streaks, downvote expansion, AI concierge, detailed multi-axis scores, indoor navigation and an institution-wide case management promise. These increase operation and evidence requirements without completing the first task better.

## Map decision

Map libraries and hosted map data are separate choices. MapLibre and Leaflet do not make production tiles, geocoding, routing or local data accuracy free.

| Choice | Primary-source facts | Recommendation for this MVP |
| --- | --- | --- |
| Existing MapTiler SDK + MapTiler Cloud | Cloud meters sessions or requests; third-party clients use request accounting. Free-tier limits can suspend maps when exhausted. | Keep initially because it is already integrated. Lazy-load only where needed; restrict public keys, preserve attribution and monitor actual quota. A change of library alone need not reduce the bill. |
| MapLibre GL JS + a tile provider | Open-source TypeScript/WebGL vector rendering and configurable styles/sources | Good future option when vector styling or provider flexibility is demonstrated to matter. Requires a deliberate production tile/style provider and budget. |
| Leaflet + a tile provider | Open-source, mobile-oriented mapping with markers, GeoJSON and tile layers; its homepage reports roughly 42 kB gzipped JavaScript | Appropriate simpler replacement for a small 2D marker map if measured bundle/mobile costs justify migration. Maintain tile licensing and provider terms; no need for 3D here. |
| Google Maps JavaScript API | Requires an API key or token and enabled billing; maps and additional Places services have separate SKUs | Choose only after testing whether its campus coverage or workflow produces a meaningful gain. Do not add paid Places search merely to search RateUPV’s small own catalog. |
| Google Maps URLs | Cross-platform search/directions links require no API key | Use as a practical directions handoff regardless of embedded renderer. A coordinate pin does not establish that Google has accurate campus paths or entrances. |

Sources: [MapTiler session/request accounting](https://docs.maptiler.com/guides/account/sessions-vs-requests/), [MapTiler current pricing](https://www.maptiler.com/cloud/pricing/), [MapLibre GL JS](https://maplibre.org/projects/gl-js/), [Leaflet](https://leafletjs.com/), [Google Maps JavaScript billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing), [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).

Do not silently replace an unavailable MapTiler key with unlimited reliance on public OpenStreetMap tiles. OSMF’s public raster service has limited capacity, best-effort availability without an SLA, attribution/cache/referrer requirements and restrictions on prefetch/offline use. An explicit, compliant small pilot may use it; production readiness requires a provider decision. A map failure must not take down the directory. [OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/).

No map provider’s UPV coverage was compared through a field walk. Avoid claiming a vendor is more accurate or accessible until entrances, paths and important places are checked on campus. Keep catalog coordinates and aliases under RateUPV’s control with provenance; do not scrape Google reviews or reuse third-party place datasets without permission.

## Cold start and operating plan

**Proposed launch plan, not completed outreach:**

- Choose five common tasks with real students, then prepare roughly 15–25 useful entries covering them. Examples to validate: find a study space; contact the right office for a document; locate student support; understand a residence service; find food between classes. Do not invent student interviews or publish fabricated reviews to fill cards.
- Assign one catalog steward and a backup moderator before public contributions are promoted. Record sources, what was checked, by whom and when. Prioritize high-consequence changes and semester opening; archive retired places rather than erase their history.
- Invite a small mix of first-year, continuing and commuting/resident students to test actual recent tasks. Ask what they used last time, what was missing, whether RateUPV helped them proceed and where they still had to ask someone.
- Recruit firsthand review contributors across multiple places and experiences. Request honest accounts rather than positive ratings. Do not reward sentiment or let an office buy a favorable position. Google’s own policy also distinguishes genuine experience from incentivized or manipulated engagement. [Google contribution policy](https://support.google.com/contributionpolicy/answer/7400114).
- Use QR links at orientation and student organization channels only after permission from their owners. Keep individual place links easy to share. No outreach, placement permission or partnership is implied by this document.
- Publish simple rules, public identity behavior, reporting expectations and operator contact. Reduce personal information collection. A pseudonym is public identity protection, not a promise of anonymity from platform operators.

## Viability and success measures

For one campus, the plausible initial model is a maintained student utility supported by a department, organization, project budget or donations. Paid student subscriptions are a weak starting assumption for a directory with free substitutes. Advertising and sponsored local listings could be investigated later, but campus demand, willingness to pay and university permission are unknown. Never sell ranking or suppression of complaints; editorial independence is central to the proposed value.

Sustainability depends on recurring stewardship as much as hosting cost. Record monthly infrastructure costs, editor/moderator hours and handover ownership. Avoid building a commercial cost base before recurring use and an operating sponsor exist. Room TBA’s first-party site describes donations and volunteer/open-source participation; that is a relevant model, not proof it will fund RateUPV. [uplb.tools](https://www.uplb.tools/).

Suggested pilot gates below are **proposed decision rules, not achieved results or externally validated benchmarks**:

| Measure | Pilot gate to test |
| --- | --- |
| Task success | At least 8 of 10 participants find the correct service and enough information to proceed on two representative tasks, without coaching. Compare with their usual method. |
| Preparation quality | Every priority entry has a useful purpose, campus, official source/contact and explicit known/unknown freshness. Maintain an item-level check log. |
| Catalog mistakes | Investigate all reported consequential errors; measure correction time and whether the same failure recurs. |
| Review usefulness | Ask readers whether a review changed preparation; collect visit recency and firsthand detail. Raw review totals are supporting evidence. |
| Trust operations | Every report has a stored state and accountable operator; measure time to triage and decisions. Set a public response target only when someone can meet it. |
| Repeat utility | Observe return use across several weeks outside launch promotion. Track aggregate searches, result selection, official-link/directions use and failed searches; clicks alone do not prove completed real-world tasks. |
| Sustainability | Named steward and backup, recurring maintenance performed, costs documented, next-semester handover possible. |

Ship a usable technical MVP autonomously, but call it a pilot until student outcomes, catalog verification and operating ownership are demonstrated. A polished interface cannot establish product-market fit.

## Unresolved evidence

- Which campus/tasks generate the most repeated uncertainty, and how often does uncertainty cause a wasted trip?
- What factual catalog data and reviews are already valid in the actual production project?
- How useful and current is the UPV Room TBA fork? Is linking/cooperation preferable to duplicating discovery?
- Can anyone commit to ongoing source checks and moderation after the course/project ends?
- Are public pseudonyms acceptable to students and operators, and does current backend exposure support the promised identity model?
- Are mobile connectivity, map performance, campus path coverage and accessibility needs limiting real use?
- Is any office willing to provide verified updates? No official endorsement or service-resolution integration should be claimed until established.

