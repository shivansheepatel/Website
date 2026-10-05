## Data engine run `2026-10-05-c04e402f`

Crawled **20** pages · **14** model calls · ~**$0.00** · **0** auto-applied · **6** need review · **0** to archive

### Dates in this PR

No date in this diff was written by the pipeline. Every date change is in the review queue below,
with the sentence from the source page that supports it. That is by design — see `docs/DATA-PIPELINE.md`.

### Needs review

Open `/admin/review` locally, or read them here:

<details><summary><strong>DEEP Summer Academy 2023</strong> — Engineering Outreach, University of Toronto (38/100)</summary>

Source: https://outreach.engineering.utoronto.ca/series/deep-summer-academy-2023

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "DEEP Summer Academy" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `DEEP Summer Academy` → `DEEP Summer Academy 2023` |
| organization | organization: `University of Toronto Engineering Outreach` → `Engineering Outreach, University of Toronto` |
| category | category: `STEM` → `Engineering outreach event` |
| cost_type | cost_type: `About $600 per two-week course; bursaries available` → `Unknown` |
| location_type | location_type: `In person and online options` → `Unknown` |
| application_link | application_link: `https://outreach.engineering.utoronto.ca/deep-summer-academy/` → `https://outreach.engineering.utoronto.ca/deep-summer-academy` |
| summary | summary: `University-taught engineering and science courses across two-week summer blocks.` → `Information about the program is not provided on this page.` |

Extractor notes:
- Page contains no details about program dates, eligibility, cost, location, or required documents.

</details>

<details><summary><strong>Canadian Computing Competition</strong> — Canadian Educational Computing Competition (CEMC), University of Waterloo (77/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/ccc

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Canadian Computing Competition (CCC)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Canadian Computing Competition (CCC)` → `Canadian Computing Competition` |
| organization | organization: `CEMC, University of Waterloo` → `Canadian Educational Computing Competition (CEMC), University of Waterloo` |
| category | category: `STEM` → `Programming competition` |
| app_deadline | app_deadline: `2027-01-20` → `2027-02-11` |
| program_start_date | program_start_date: _(none)_ → `2027-02-17` |
| cost_type | cost_type: `Small school-set registration fee` → `Free` |
| location_type | location_type: `Written at your school` → `Hybrid` |
| location_note | location_note: `Ontario-wide` → `Students write at their school using the online grader` |
| summary | summary: `National programming contest and the entry point to Canada's IOI team.` → `High school students take a three‑hour, five‑question programming contest admini` |
| eligibility | eligibility: `Any secondary school student. Your school must register you as a contest centre.` → `Open to all secondary school students; participants may choose Junior or Senior ` |

Evidence:
- **app_deadline** = `2027-02-11` (labelled) — “Ordering deadline: Thursday, February 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-02-17` (labelled) — “North and South America: Wednesday, February 17, 2027”

Extractor notes:
- Contest dates differ by region: Feb 17, 2027 for North/South America, Feb 18, 2027 elsewhere.
- Ordering deadline is for schools to order contest materials.

</details>

<details><summary><strong>Euclid Contest</strong> — CEMC (University of Waterloo) (69/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/euclid

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Euclid Mathematics Contest" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Euclid Mathematics Contest` → `Euclid Contest` |
| organization | organization: `CEMC, University of Waterloo` → `CEMC (University of Waterloo)` |
| category | category: `STEM` → `Math contest` |
| app_deadline | app_deadline: `2027-03-25` → `2027-03-11` |
| cost_type | cost_type: `Registration fee set by your school` → `$18.00 contest fee per participant, plus $5.00 processing fee and shipping fees` |
| location_type | location_type: `Written at your school` → `In-Person` |
| location_note | location_note: `Ontario-wide` → `Administered in schools; participants write individually on paper.` |
| summary | summary: `Senior math contest used in Waterloo admission and scholarship decisions.` → `The Euclid Contest is a 10‑question, 2.5‑hour mathematics competition that senio` |
| eligibility | eligibility: `Primarily Grade 12, open to any student who has covered the material.` → `Students in their final year of secondary school or CÉGEP students. Motivated st` |

Evidence:
- **app_deadline** = `2027-03-11` (labelled) — “Ordering deadline: Thursday, March 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**

Extractor notes:
- Two contest dates for different regions; start date not a single value
- Ordering deadline applies to schools, not individual students
- Cost includes additional processing and shipping fees

</details>

<details><summary><strong>Canada-Wide Science Fair</strong> — Youth Science Canada (72/100)</summary>

Source: https://youthscience.ca/science-fairs/cwsf

- Date change detected — program_start_date: null → 2025-06-01; program_end_date: null → 2025-06-06. Dates never auto-publish.
- Changes needing review: category, cost_type, location_type, location_note, summary, eligibility.
- Confidence 72/100.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Science fair` |
| program_start_date | program_start_date: _(none)_ → `2025-06-01` |
| program_end_date | program_end_date: _(none)_ → `2025-06-06` |
| cost_type | cost_type: `Free for finalists; regional fair entry may have a small fee` → `Unknown` |
| location_type | location_type: `In person` → `In-Person` |
| location_note | location_note: `Rotating host city` → `Fredericton, New Brunswick` |
| summary | summary: `National science fair reached by winning your regional fair first.` → `Students present their STEM projects at the Canada-Wide Science Fair, competing ` |
| eligibility | eligibility: `Students aged 12–20 who place at an affiliated regional fair.` → `Students in grades 7‑12 who are winners of their regional STEM fairs.` |

Evidence:
- **program_start_date** = `2025-06-01` (prose) — “from June 1 to 6, 2025”
- **program_end_date** = `2025-06-06` (prose) — “from June 1 to 6, 2025”

Extractor notes:
- Program dates listed are for the 2025 fair, which is in the past relative to today (2026‑10‑05). No application deadline or link is provided on the page.
- All four grades listed — confirm the page really says 9-12 rather than being silent.

</details>

<details><summary><strong>Quantum School for Young Students</strong> — Institute for Quantum Computing, University of Waterloo (70/100)</summary>

Source: https://uwaterloo.ca/institute-for-quantum-computing/outreach/qsys

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Quantum School for Young Students (QSYS)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Quantum School for Young Students (QSYS)` → `Quantum School for Young Students` |
| category | category: `STEM` → `Quantum enrichment program` |
| program_start_date | program_start_date: _(none)_ → `2026-08-04` |
| program_end_date | program_end_date: _(none)_ → `2026-08-13` |
| cost_type | cost_type: `Tuition plus residence, with financial assistance available` → `Unknown` |
| location_type | location_type: `In person, residential` → `Hybrid` |
| location_note | location_note: `Waterloo` → `Online with optional in-person lab day in Waterloo region` |
| summary | summary: `Intensive introduction to quantum information science.` → `Students join an online workshop of lectures, discussions, problem‑solving sessi` |
| eligibility | eligibility: `Students entering their final year of high school, selected by application.` → `High-school students` |

Evidence:
- **program_start_date** = `2026-08-04` (prose) — “QSYS 2026 will take place online from August 4 to 13, 2026”
- **program_end_date** = `2026-08-13` (prose) — “QSYS 2026 will take place online from August 4 to 13, 2026”

Extractor notes:
- Applications are closed; no application deadline or open date provided on the page.
- Optional in-person lab day on August 17, 2026 is not part of the core online program dates.

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
| location_note | location_note: `Ontario universities` → `Various host universities across Canada` |
| summary | summary: `One-day campus engineering event hosted across Ontario universities.` → `Students attend a free, one‑day event at a host university where they can try ha` |
| eligibility | eligibility: `Girls and gender-diverse students in Grades 7–12, with a parent or guardian.` → `Girls and non‑binary youth in grades 7‑10.` |

Extractor notes:
- Multiple event dates at different host universities; no single program start or end date listed.
- No application deadline or registration link provided on the page.

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
hub youth-science-canada: 6 candidate links
hub cemc: 11 candidate links
hub skills-ontario: 2 candidate links
hub shad: 7 candidate links
hub ontario-jobs-youth: 9 candidate links
hub canada-summer-jobs: 13 candidate links
hub ted-rogers-volunteer: FAILED — HTTP 403
hub duke-of-ed: FAILED — HTTP 403
search: No search API key configured — hub crawl only.
discovery: 53 unique, 53 not already in the catalogue
```

</details>