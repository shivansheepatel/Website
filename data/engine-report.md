## Data engine run `2026-10-26-14bdf256`

Crawled **20** pages · **14** model calls · ~**$0.00** · **0** auto-applied · **6** need review · **0** to archive

### Dates in this PR

No date in this diff was written by the pipeline. Every date change is in the review queue below,
with the sentence from the source page that supports it. That is by design — see `docs/DATA-PIPELINE.md`.

### Needs review

Open `/admin/review` locally, or read them here:

<details><summary><strong>Shad</strong> — Shad Canada (41/100)</summary>

Source: https://shad.ca/

- New listing (confidence 41/100, low).
- Found via catalogue re-crawl.

Extractor notes:
- Application open date mentioned without a day – ambiguous, set to null.
- No application deadline provided on the page.
- Cost details not specified; financial assistance mentioned but no fee amount.

</details>

<details><summary><strong>Canadian Computing Competition</strong> — CEMC, University of Waterloo (83/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/ccc

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Canadian Computing Competition (CCC)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Canadian Computing Competition (CCC)` → `Canadian Computing Competition` |
| category | category: `STEM` → `Computer science competition` |
| program_start_date | program_start_date: _(none)_ → `2027-02-17` |
| cost_type | cost_type: `Small school-set registration fee` → `Unknown` |
| location_type | location_type: `Written at your school` → `In-Person` |
| location_note | location_note: `Ontario-wide` → `Students take the contest at their own school` |
| application_link | application_link: `https://www.cemc.uwaterloo.ca/contests/computing.html` → `https://cemc.uwaterloo.ca/contests/computing.html` |
| summary | summary: `National programming contest and the entry point to Canada's IOI team.` → `Students take a three‑hour programming contest at their school, solving five alg` |
| eligibility | eligibility: `Any secondary school student. Your school must register you as a contest centre.` → `Secondary school students of any grade; participants choose Junior or Senior lev` |

Evidence:
- **program_start_date** = `2027-02-17` (labelled) — “North and South America: Wednesday, February 17, 2027”
  ⚠️ **Two possible contest dates; this is the North and South America date**

Extractor notes:
- Ordering deadline (Thursday, February 11, 2027) applies to schools, not individual student applications.
- Contest date differs by region: North and South America on Feb 17, 2027; elsewhere on Feb 18, 2027.

</details>

<details><summary><strong>Euclid Contest</strong> — CEMC, University of Waterloo (79/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/euclid

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Euclid Mathematics Contest" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Euclid Mathematics Contest` → `Euclid Contest` |
| category | category: `STEM` → `Math contest` |
| grade_levels | grade_levels: `11,12` → `9,10,11,12` |
| app_deadline | app_deadline: `2027-03-25` → `2027-03-11` |
| program_start_date | program_start_date: _(none)_ → `2027-04-06` |
| cost_type | cost_type: `Registration fee set by your school` → `$18.00 contest fee per participant, plus $5.00 processing fee and shipping fees` |
| location_type | location_type: `Written at your school` → `In-Person` |
| location_note | location_note: `Ontario-wide` → `Administered at participants' schools` |
| summary | summary: `Senior math contest used in Waterloo admission and scholarship decisions.` → `Students take a 10‑question, 2.5‑hour mathematics contest on paper at their scho` |
| eligibility | eligibility: `Primarily Grade 12, open to any student who has covered the material.` → `Any full‑time student may write the Euclid Contest; official participants must b` |

Evidence:
- **app_deadline** = `2027-03-11` (labelled) — “Ordering deadline: Thursday, March 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-04-06` (labelled) — “North and South America: Tuesday, April 6, 2027”

Extractor notes:
- Ordering deadline is for schools to place orders, not a student‑level application deadline.
- All four grades listed — confirm the page really says 9-12 rather than being silent.

</details>

<details><summary><strong>Canada-Wide Science Fair</strong> — Youth Science Canada (76/100)</summary>

Source: https://youthscience.ca/science-fairs/cwsf

- Date change detected — program_start_date: null → 2025-06-01; program_end_date: null → 2025-06-06. Dates never auto-publish.
- Changes needing review: category, cost_type, location_type, location_note, application_link, summary, eligibility.
- Confidence 76/100.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Science fair` |
| program_start_date | program_start_date: _(none)_ → `2025-06-01` |
| program_end_date | program_end_date: _(none)_ → `2025-06-06` |
| cost_type | cost_type: `Free for finalists; regional fair entry may have a small fee` → `Unknown` |
| location_type | location_type: `In person` → `In-Person` |
| location_note | location_note: `Rotating host city` → `University of New Brunswick, Fredericton` |
| application_link | application_link: `https://youthscience.ca/science-fairs/cwsf/` → `https://youthscience.ca/science-fairs/cwsf` |
| summary | summary: `National science fair reached by winning your regional fair first.` → `The Canada-Wide Science Fair is a national competition where high‑school student` |
| eligibility | eligibility: `Students aged 12–20 who place at an affiliated regional fair.` → `Students from grades 7 through 12, winners of their respective regional STEM fai` |

Evidence:
- **program_start_date** = `2025-06-01` (prose) — “from June 1 to 6, 2025”
- **program_end_date** = `2025-06-06` (prose) — “from June 1 to 6, 2025”

Extractor notes:
- Program dates listed are June 1–6, 2025, which is in the past relative to today (2026‑10‑26).
- No application deadline or opening date is provided on the page.
- Grades 7‑8 are mentioned but are outside the 9‑12 range required for output.
- All four grades listed — confirm the page really says 9-12 rather than being silent.

</details>

<details><summary><strong>Quantum School for Young Students</strong> — Institute for Quantum Computing (IQC), University of Waterloo (70/100)</summary>

Source: https://uwaterloo.ca/institute-for-quantum-computing/outreach/qsys

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Quantum School for Young Students (QSYS)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Quantum School for Young Students (QSYS)` → `Quantum School for Young Students` |
| organization | organization: `Institute for Quantum Computing, University of Waterloo` → `Institute for Quantum Computing (IQC), University of Waterloo` |
| category | category: `STEM` → `Quantum summer program` |
| program_start_date | program_start_date: _(none)_ → `2027-08-03` |
| program_end_date | program_end_date: _(none)_ → `2027-08-12` |
| cost_type | cost_type: `Tuition plus residence, with financial assistance available` → `Unknown` |
| location_type | location_type: `In person, residential` → `Hybrid` |
| location_note | location_note: `Waterloo` → `Online, with optional in‑person lab day in Waterloo region` |
| summary | summary: `Intensive introduction to quantum information science.` → `QSYS is a week‑long online workshop for high‑school students that introduces qua` |
| eligibility | eligibility: `Students entering their final year of high school, selected by application.` → `The Quantum School for Young Students is a unique enrichment program for high-sc` |

Evidence:
- **program_start_date** = `2027-08-03` (prose) — “QSYS 2027 is scheduled to take place online from August 3 to 12, 2027”
- **program_end_date** = `2027-08-12` (prose) — “QSYS 2027 is scheduled to take place online from August 3 to 12, 2027”

Extractor notes:
- Application opening date only given as month and year (December 2026) with no day; date omitted.
- Optional in‑person lab day on August 16, 2027 is outside the main program dates.

</details>

<details><summary><strong>Go ENG Girl</strong> — Ontario Network of Women in Engineering (45/100)</summary>

Source: https://onwie.ca/programs/go-eng-girl

- Changes needing review: category, grade_levels, location_type, location_note, summary, eligibility.
- Confidence 45/100.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Engineering outreach event` |
| grade_levels | grade_levels: `9,10,11,12` → `9,10` |
| location_type | location_type: `In person, one day` → `In-Person` |
| location_note | location_note: `Ontario universities` → `Various university campuses across Canada` |
| summary | summary: `One-day campus engineering event hosted across Ontario universities.` → `Go ENG Girl is a free, day‑long event where girls and non‑binary youth in grades` |
| eligibility | eligibility: `Girls and gender-diverse students in Grades 7–12, with a parent or guardian.` → `Girls and non‑binary youth in grades 7‑10` |

Extractor notes:
- Multiple event dates across host universities; no single program start/end date provided.
- No application deadline or registration link stated on the page.
- Grades 7‑10 include 9‑10 for eligible high‑school grades.

</details>

<details><summary>Discovery log</summary>

```
Needs verification: "DEEP Summer Academy" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
Needs verification: "STEM Fellowship Big Data Challenge" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
hub uoft-outreach: FAILED — HTTP 403
hub uwaterloo-outreach: 4 candidate links
hub mcmaster-youth: 0 candidate links
hub queens-enrichment: FAILED — disallowed by robots.txt
hub western-youth: 1 candidate links
hub youth-science-canada: 5 candidate links
hub cemc: 11 candidate links
hub skills-ontario: 2 candidate links
hub shad: 7 candidate links
hub ontario-jobs-youth: 9 candidate links
hub canada-summer-jobs: 13 candidate links
hub ted-rogers-volunteer: FAILED — HTTP 403
hub duke-of-ed: FAILED — HTTP 403
search: No search API key configured — hub crawl only.
discovery: 52 unique, 52 not already in the catalogue
```

</details>