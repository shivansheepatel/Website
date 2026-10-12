## Data engine run `2026-10-12-cc46ea15`

Crawled **20** pages · **14** model calls · ~**$0.00** · **0** auto-applied · **6** need review · **0** to archive

### Dates in this PR

No date in this diff was written by the pipeline. Every date change is in the review queue below,
with the sentence from the source page that supports it. That is by design — see `docs/DATA-PIPELINE.md`.

### Needs review

Open `/admin/review` locally, or read them here:

<details><summary><strong>Shad</strong> — Shad Canada (49/100)</summary>

Source: https://shad.ca/

- New listing (confidence 49/100, low).
- Found via catalogue re-crawl.

Extractor notes:
- Applications open date only gives month and year (September 2026) without a specific day, so app_open_date is null.
- No application deadline or program start/end dates are provided on the page.

</details>

<details><summary><strong>Canadian Computing Competition</strong> — University of Waterloo, Centre for Education in Mathematics and Computing (CEMC) (80/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/ccc

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Canadian Computing Competition (CCC)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Canadian Computing Competition (CCC)` → `Canadian Computing Competition` |
| organization | organization: `CEMC, University of Waterloo` → `University of Waterloo, Centre for Education in Mathematics and Computing (CEMC)` |
| category | category: `STEM` → `Computer programming competition` |
| app_deadline | app_deadline: `2027-01-20` → `2027-02-11` |
| program_start_date | program_start_date: _(none)_ → `2027-02-17` |
| program_end_date | program_end_date: _(none)_ → `2027-02-17` |
| cost_type | cost_type: `Small school-set registration fee` → `Free` |
| location_type | location_type: `Written at your school` → `Remote` |
| location_note | location_note: `Ontario-wide` → `Administered in schools; participants write online` |
| summary | summary: `National programming contest and the entry point to Canada's IOI team.` → `Students take a three‑hour online programming contest with five algorithmic prob` |
| eligibility | eligibility: `Any secondary school student. Your school must register you as a contest centre.` → `Any secondary school student can enter, choosing either the Junior level (beginn` |

Evidence:
- **app_deadline** = `2027-02-11` (labelled) — “Ordering deadline: Thursday, February 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-02-17` (labelled) — “North and South America: Wednesday, February 17, 2027”
  ⚠️ **Contest date for participants in North and South America; outside region contest is Feb 18**
- **program_end_date** = `2027-02-17` (labelled) — “North and South America: Wednesday, February 17, 2027”
  ⚠️ **Contest date for participants in North and South America; outside region contest is Feb 18**

Extractor notes:
- Two contest dates depending on region (Feb 17 for North/South America, Feb 18 elsewhere).
- Ordering deadline is a school‑level deadline.

</details>

<details><summary><strong>Euclid Contest</strong> — University of Waterloo, Centre for Education in Mathematics and Computing (CEMC) (77/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/euclid

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Euclid Mathematics Contest" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Euclid Mathematics Contest` → `Euclid Contest` |
| organization | organization: `CEMC, University of Waterloo` → `University of Waterloo, Centre for Education in Mathematics and Computing (CEMC)` |
| category | category: `STEM` → `Math contest` |
| app_deadline | app_deadline: `2027-03-25` → `2027-03-11` |
| program_start_date | program_start_date: _(none)_ → `2027-04-06` |
| cost_type | cost_type: `Registration fee set by your school` → `$18.00 contest fee per participant, plus $5.00 processing fee and applicable shi` |
| location_type | location_type: `Written at your school` → `In-Person` |
| location_note | location_note: `Ontario-wide` → `Administered in school, usually at the beginning of the school day.` |
| summary | summary: `Senior math contest used in Waterloo admission and scholarship decisions.` → `The Euclid Contest is a 2.5‑hour written mathematics competition with 10 short‑a` |
| eligibility | eligibility: `Primarily Grade 12, open to any student who has covered the material.` → `Students in their final year of secondary school or CÉGEP students; motivated st` |

Evidence:
- **app_deadline** = `2027-03-11` (labelled) — “Ordering deadline: Thursday, March 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-04-06` (labelled) — “North and South America: Tuesday, April 6, 2027”

Extractor notes:
- Ordering deadline applies to schools, not individual students.
- Contest dates differ by region; the listed start date is for North and South America.

</details>

<details><summary><strong>Quantum School for Young Students</strong> — Institute for Quantum Computing (IQC) at the University of Waterloo (64/100)</summary>

Source: https://uwaterloo.ca/institute-for-quantum-computing/outreach/qsys

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Quantum School for Young Students (QSYS)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Quantum School for Young Students (QSYS)` → `Quantum School for Young Students` |
| organization | organization: `Institute for Quantum Computing, University of Waterloo` → `Institute for Quantum Computing (IQC) at the University of Waterloo` |
| category | category: `STEM` → `Quantum enrichment program` |
| program_start_date | program_start_date: _(none)_ → `2026-08-04` |
| program_end_date | program_end_date: _(none)_ → `2026-08-13` |
| cost_type | cost_type: `Tuition plus residence, with financial assistance available` → `Unknown` |
| location_type | location_type: `In person, residential` → `Hybrid` |
| location_note | location_note: `Waterloo` → `Online; optional in-person lab day in Waterloo region` |
| summary | summary: `Intensive introduction to quantum information science.` → `Students attend a ten‑day online workshop from August 4‑13, 2026, with lectures,` |
| eligibility | eligibility: `Students entering their final year of high school, selected by application.` → `unique enrichment program for high‑school students` |

Evidence:
- **program_start_date** = `2026-08-04` (prose) — “QSYS 2026 will take place online from August 4 to 13, 2026”
- **program_end_date** = `2026-08-13` (prose) — “QSYS 2026 will take place online from August 4 to 13, 2026”

Extractor notes:
- Cost information not provided on the page.
- Applications are closed; no application deadline listed.
- Optional in‑person lab day on August 17, 2026 is separate from the main online program dates.

</details>

<details><summary><strong>Go ENG Girl</strong> — Ontario Network of Women in Engineering (74/100)</summary>

Source: https://onwie.ca/programs/go-eng-girl

- Date change detected — program_start_date: null → 2026-10-03; program_end_date: null → 2026-11-11. Dates never auto-publish.
- Changes needing review: category, grade_levels, cost_type, location_type, location_note, summary, eligibility.
- Confidence 74/100.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Engineering outreach` |
| grade_levels | grade_levels: `9,10,11,12` → `9,10` |
| program_start_date | program_start_date: _(none)_ → `2026-10-03` |
| program_end_date | program_end_date: _(none)_ → `2026-11-11` |
| cost_type | cost_type: `Free` → `Free annual event` |
| location_type | location_type: `In person, one day` → `In-Person` |
| location_note | location_note: `Ontario universities` → `Various university campuses across Canada` |
| summary | summary: `One-day campus engineering event hosted across Ontario universities.` → `Students attend a free, one‑day engineering outreach event at a local university` |
| eligibility | eligibility: `Girls and gender-diverse students in Grades 7–12, with a parent or guardian.` → `Girls and non-binary youth in grades 7‑10.` |

Evidence:
- **program_start_date** = `2026-10-03` (prose) — “Carleton University: Saturday, October 3rd, 2026”
- **program_end_date** = `2026-11-11` (prose) — “University of Waterloo: Wednesday, November 11th”

Extractor notes:
- Year for November 11th inferred as 2026 (next occurrence after today).
- Multiple event locations; date range spans Oct 3 – Nov 11 2026.

</details>

<details><summary><strong>National High School Big Data & AI Challenge</strong> — STEM Fellowship (62/100)</summary>

Source: https://stemfellowship.org/

- New listing (confidence 62/100, medium).
- Found via catalogue re-crawl.

Evidence:
- **program_start_date** = `2026-08-17` (prose) — “Aug 17-20 & Aug 24-27, 2026”
- **program_end_date** = `2026-08-27` (prose) — “Aug 17-20 & Aug 24-27, 2026”

Extractor notes:
- No application deadline or open date provided on the page.
- Eligibility criteria and grade level requirements are not specified.
- Cost information is not mentioned.

</details>

<details><summary>Discovery log</summary>

```
Needs verification: "DEEP Summer Academy" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
Needs verification: "Canada-Wide Science Fair" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
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