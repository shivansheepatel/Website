## Data engine run `2026-09-28-adcbda7b`

Crawled **20** pages · **15** model calls · ~**$0.00** · **0** auto-applied · **7** need review · **0** to archive

### Dates in this PR

No date in this diff was written by the pipeline. Every date change is in the review queue below,
with the sentence from the source page that supports it. That is by design — see `docs/DATA-PIPELINE.md`.

### Needs review

Open `/admin/review` locally, or read them here:

<details><summary><strong>Shad</strong> — Shad Canada (45/100)</summary>

Source: https://shad.ca/

- New listing (confidence 45/100, low).
- Found via catalogue re-crawl.

Extractor notes:
- Application open date only given as "September 2026" without a specific day, so app_open_date set to null.
- No application deadline or program start/end dates provided on the page.

</details>

<details><summary><strong>DEEP Summer Academy 2023</strong> — Engineering Outreach, University of Toronto (0/100)</summary>

Source: https://outreach.engineering.utoronto.ca/series/deep-summer-academy-2023

- Extractor does not think this page is a single program.
- Found via catalogue re-crawl.
- Possible duplicate of "DEEP Summer Academy" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `DEEP Summer Academy` → `DEEP Summer Academy 2023` |
| organization | organization: `University of Toronto Engineering Outreach` → `Engineering Outreach, University of Toronto` |
| category | category: `STEM` → `Summer program` |
| cost_type | cost_type: `About $600 per two-week course; bursaries available` → `Unknown` |
| location_type | location_type: `In person and online options` → `Unknown` |
| summary | summary: `University-taught engineering and science courses across two-week summer blocks.` → `No program details are provided on this page.` |

Extractor notes:
- Page contains only a calendar placeholder with no program details; appears not to be an actual program listing.

</details>

<details><summary><strong>Canadian Computing Competition</strong> — CEMC, University of Waterloo (80/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/ccc

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Canadian Computing Competition (CCC)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Canadian Computing Competition (CCC)` → `Canadian Computing Competition` |
| category | category: `STEM` → `Computer science competition` |
| app_deadline | app_deadline: `2027-01-20` → `2027-02-11` |
| program_start_date | program_start_date: _(none)_ → `2027-02-17` |
| program_end_date | program_end_date: _(none)_ → `2027-02-18` |
| cost_type | cost_type: `Small school-set registration fee` → `Free` |
| location_type | location_type: `Written at your school` → `Remote` |
| location_note | location_note: `Ontario-wide` → `Students take the contest at their school using the CCC Online Grader` |
| summary | summary: `National programming contest and the entry point to Canada's IOI team.` → `The Canadian Computing Competition is an online programming contest for secondar` |
| eligibility | eligibility: `Any secondary school student. Your school must register you as a contest centre.` → `Participants have the option to compete at either the Junior or Senior level. In` |

Evidence:
- **app_deadline** = `2027-02-11` (labelled) — “Ordering deadline: Thursday, February 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-02-17` (labelled) — “North and South America: Wednesday, February 17, 2027”
- **program_end_date** = `2027-02-18` (labelled) — “Outside North and South America: Thursday, February 18, 2027”

Extractor notes:
- Ordering deadline is a school deadline, not an individual student deadline.
- Contest dates differ by region: Feb 17 for North and South America, Feb 18 for other regions.

</details>

<details><summary><strong>Euclid Contest</strong> — CEMC, University of Waterloo (75/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/euclid

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Euclid Mathematics Contest" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Euclid Mathematics Contest` → `Euclid Contest` |
| category | category: `STEM` → `Math contest` |
| program_start_date | program_start_date: _(none)_ → `2027-04-06` |
| cost_type | cost_type: `Registration fee set by your school` → `$18.00 contest fee per participant plus processing and shipping fees` |
| location_type | location_type: `Written at your school` → `In-Person` |
| location_note | location_note: `Ontario-wide` → `Administered in schools (North and South America: April 6, 2027; Outside NA: Apr` |
| summary | summary: `Senior math contest used in Waterloo admission and scholarship decisions.` → `Students take a 10‑question, 2.5‑hour math contest at their school, solving shor` |
| eligibility | eligibility: `Primarily Grade 12, open to any student who has covered the material.` → `Students in their final year of secondary school or CÉGEP students may enter; mo` |

Evidence:
- **program_start_date** = `2027-04-06` (labelled) — “North and South America: Tuesday, April 6, 2027”

Extractor notes:
- Ordering deadline of March 11, 2027 is for schools to place orders, not an individual student application deadline.
- Contest dates differ by region: April 6, 2027 in North and South America; April 7, 2027 elsewhere.

</details>

<details><summary><strong>Canada-Wide Science Fair</strong> — Youth Science Canada (34/100)</summary>

Source: https://youthscience.ca/science-fairs/cwsf

- Extractor does not think this page is a single program.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Science fair` |
| program_start_date | program_start_date: _(none)_ → `2025-06-01` |
| program_end_date | program_end_date: _(none)_ → `2025-06-06` |
| cost_type | cost_type: `Free for finalists; regional fair entry may have a small fee` → `Free` |
| location_type | location_type: `In person` → `In-Person` |
| location_note | location_note: `Rotating host city` → `Fredericton, New Brunswick` |
| summary | summary: `National science fair reached by winning your regional fair first.` → `The Canada-Wide Science Fair is a national competition where student finalists s` |
| eligibility | eligibility: `Students aged 12–20 who place at an affiliated regional fair.` → `Students in grades 7‑12 who are winners of their regional STEM fairs.` |

Evidence:
- **program_start_date** = `2025-06-01` (prose) — “June 1 to 6, 2025”
- **program_end_date** = `2025-06-06` (prose) — “June 1 to 6, 2025”

Extractor notes:
- Program dates are in 2025, which is past relative to current date 2026-09-28; no application information provided.
- All four grades listed — confirm the page really says 9-12 rather than being silent.

</details>

<details><summary><strong>Quantum School for Young Students</strong> — Institute for Quantum Computing (IQC), University of Waterloo (64/100)</summary>

Source: https://uwaterloo.ca/institute-for-quantum-computing/outreach/qsys

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Quantum School for Young Students (QSYS)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Quantum School for Young Students (QSYS)` → `Quantum School for Young Students` |
| organization | organization: `Institute for Quantum Computing, University of Waterloo` → `Institute for Quantum Computing (IQC), University of Waterloo` |
| category | category: `STEM` → `Quantum summer program` |
| program_start_date | program_start_date: _(none)_ → `2026-08-04` |
| program_end_date | program_end_date: _(none)_ → `2026-08-13` |
| cost_type | cost_type: `Tuition plus residence, with financial assistance available` → `Unknown` |
| location_type | location_type: `In person, residential` → `Hybrid` |
| location_note | location_note: `Waterloo` → `Online; optional in‑person lab day in Waterloo, Ontario` |
| summary | summary: `Intensive introduction to quantum information science.` → `Students attend a ten‑day online workshop of expert lectures, group discussions,` |
| eligibility | eligibility: `Students entering their final year of high school, selected by application.` → `High‑school students` |

Evidence:
- **program_start_date** = `2026-08-04` (prose) — “QSYS 2026 will take place online from August 4 to 13, 2026”
- **program_end_date** = `2026-08-13` (prose) — “QSYS 2026 will take place online from August 4 to 13, 2026”

Extractor notes:
- Cost information not provided on page.
- Application deadline and opening dates not stated; applications are closed.
- Optional in‑person lab day on August 17, 2026 is separate from the main online program.

</details>

<details><summary><strong>Go ENG Girl</strong> — Ontario Network of Women in Engineering (51/100)</summary>

Source: https://onwie.ca/programs/go-eng-girl

- Changes needing review: category, grade_levels, location_type, location_note, summary, eligibility.
- Confidence 51/100.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Engineering outreach` |
| grade_levels | grade_levels: `9,10,11,12` → `9,10` |
| location_type | location_type: `In person, one day` → `In-Person` |
| location_note | location_note: `Ontario universities` → `Various university campuses across Canada` |
| summary | summary: `One-day campus engineering event hosted across Ontario universities.` → `Go ENG Girl is a free annual event where girls and non-binary youth can explore ` |
| eligibility | eligibility: `Girls and gender-diverse students in Grades 7–12, with a parent or guardian.` → `girls and non-binary youth in grades 7-10` |

Extractor notes:
- No specific registration dates or application link are provided; the page says dates will be posted in fall 2026.
- Multiple host universities; location varies.

</details>

<details><summary>Discovery log</summary>

```
Needs verification: "Visions of Science Youth Programs" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
Needs verification: "STEM Fellowship Big Data Challenge" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
hub uoft-outreach: FAILED — HTTP 403
hub uwaterloo-outreach: 4 candidate links
hub mcmaster-youth: 0 candidate links
hub queens-enrichment: FAILED — disallowed by robots.txt
hub western-youth: 1 candidate links
hub youth-science-canada: 5 candidate links
hub cemc: 11 candidate links
hub skills-ontario: 4 candidate links
hub shad: 7 candidate links
hub ontario-jobs-youth: 9 candidate links
hub canada-summer-jobs: 13 candidate links
hub ted-rogers-volunteer: FAILED — HTTP 403
hub duke-of-ed: FAILED — HTTP 403
search: No search API key configured — hub crawl only.
discovery: 54 unique, 54 not already in the catalogue
```

</details>