## Data engine run `2026-11-02-a6be220b`

Crawled **20** pages · **12** model calls · ~**$0.00** · **0** auto-applied · **5** need review · **0** to archive

### Dates in this PR

No date in this diff was written by the pipeline. Every date change is in the review queue below,
with the sentence from the source page that supports it. That is by design — see `docs/DATA-PIPELINE.md`.

### Needs review

Open `/admin/review` locally, or read them here:

<details><summary><strong>Canadian Computing Competition</strong> — University of Waterloo, Centre for Education in Mathematics and Computing (CEMC) (80/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/ccc

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Canadian Computing Competition (CCC)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Canadian Computing Competition (CCC)` → `Canadian Computing Competition` |
| organization | organization: `CEMC, University of Waterloo` → `University of Waterloo, Centre for Education in Mathematics and Computing (CEMC)` |
| category | category: `STEM` → `Programming contest` |
| app_deadline | app_deadline: `2027-01-20` → `2027-02-11` |
| program_start_date | program_start_date: _(none)_ → `2027-02-17` |
| program_end_date | program_end_date: _(none)_ → `2027-02-18` |
| cost_type | cost_type: `Small school-set registration fee` → `Free` |
| location_type | location_type: `Written at your school` → `In-Person` |
| location_note | location_note: `Ontario-wide` → `Administered at participants' schools (online contest)` |
| summary | summary: `National programming contest and the entry point to Canada's IOI team.` → `The Canadian Computing Competition is a one‑day, online programming contest held` |
| eligibility | eligibility: `Any secondary school student. Your school must register you as a contest centre.` → `Open to all secondary school students in Canada (and internationally) regardless` |

Evidence:
- **app_deadline** = `2027-02-11` (labelled) — “Ordering deadline: Thursday, February 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-02-17` (labelled) — “North and South America: Wednesday, February 17, 2027”
- **program_end_date** = `2027-02-18` (labelled) — “Outside North and South America: Thursday, February 18, 2027”

Extractor notes:
- Ordering deadline applies to schools ordering contest materials, not to individual student applications.
- Contest dates differ by region: Feb 17 for North/South America and Feb 18 for other regions.

</details>

<details><summary><strong>Euclid Contest</strong> — CEMC, University of Waterloo (77/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/euclid

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Euclid Mathematics Contest" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Euclid Mathematics Contest` → `Euclid Contest` |
| category | category: `STEM` → `Mathematics contest` |
| app_deadline | app_deadline: `2027-03-25` → `2027-03-11` |
| program_start_date | program_start_date: _(none)_ → `2027-04-06` |
| cost_type | cost_type: `Registration fee set by your school` → `$18.00 contest fee per participant, plus $5.00 processing fee and shipping fees` |
| location_type | location_type: `Written at your school` → `In-Person` |
| location_note | location_note: `Ontario-wide` → `Administered in schools on the contest date` |
| summary | summary: `Senior math contest used in Waterloo admission and scholarship decisions.` → `The Euclid Contest is a written mathematics competition for senior secondary sch` |
| eligibility | eligibility: `Primarily Grade 12, open to any student who has covered the material.` → `Students in their final year of secondary school or CÉGEP students; motivated st` |

Evidence:
- **app_deadline** = `2027-03-11` (labelled) — “Ordering deadline: Thursday, March 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-04-06` (labelled) — “North and South America: Tuesday, April 6, 2027”
  ⚠️ **Date applies to schools in North and South America; other regions have contest on April 7, 2027**

Extractor notes:
- Contest dates differ by region (April 6 for NA, April 7 for other regions).
- Ordering deadline is a school‑level deadline, not a direct student application deadline.

</details>

<details><summary><strong>Canada-Wide Science Fair</strong> — Youth Science Canada (51/100)</summary>

Source: https://youthscience.ca/science-fairs/cwsf

- Changes needing review: category, cost_type, location_type, application_link, summary, eligibility.
- Confidence 51/100.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Science fair` |
| cost_type | cost_type: `Free for finalists; regional fair entry may have a small fee` → `Unknown` |
| location_type | location_type: `In person` → `Unknown` |
| application_link | application_link: `https://youthscience.ca/science-fairs/cwsf/` → `https://youthscience.ca/science-fairs/cwsf` |
| summary | summary: `National science fair reached by winning your regional fair first.` → `The Canada-Wide Science Fair brings together student finalists from regional STE` |
| eligibility | eligibility: `Students aged 12–20 who place at an affiliated regional fair.` → `Students from grades 7 through 12 who are winners of their regional STEM fairs m` |

Extractor notes:
- No application deadline or open date is provided on the page.
- Program dates (June 1‑6, 2025) refer to a past event; no future event dates are listed.
- All four grades listed — confirm the page really says 9-12 rather than being silent.

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
| program_start_date | program_start_date: _(none)_ → `2027-08-03` |
| program_end_date | program_end_date: _(none)_ → `2027-08-12` |
| cost_type | cost_type: `Tuition plus residence, with financial assistance available` → `Unknown` |
| location_type | location_type: `In person, residential` → `Hybrid` |
| location_note | location_note: `Waterloo` → `Online with optional in‑person lab day in Waterloo region` |
| summary | summary: `Intensive introduction to quantum information science.` → `The Quantum School for Young Students is a two‑week online program where high‑sc` |
| eligibility | eligibility: `Students entering their final year of high school, selected by application.` → `Open to high‑school students.` |

Evidence:
- **program_start_date** = `2027-08-03` (prose) — “QSYS 2027 is scheduled to take place online from August 3 to 12, 2027”
- **program_end_date** = `2027-08-12` (prose) — “QSYS 2027 is scheduled to take place online from August 3 to 12, 2027”

Extractor notes:
- Application opening date given only as month and year (December 2026) with no specific day, so app_open_date is null.
- No application deadline or application link provided on the page.
- Program cost not mentioned; cost_type set to Unknown.

</details>

<details><summary><strong>Go ENG Girl</strong> — Ontario Network of Women in Engineering (79/100)</summary>

Source: https://onwie.ca/programs/go-eng-girl

- Date change detected — program_start_date: null → 2026-10-03; program_end_date: null → 2026-11-28. Dates never auto-publish.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Engineering outreach event` |
| grade_levels | grade_levels: `9,10,11,12` → `9,10` |
| program_start_date | program_start_date: _(none)_ → `2026-10-03` |
| program_end_date | program_end_date: _(none)_ → `2026-11-28` |
| location_type | location_type: `In person, one day` → `In-Person` |
| location_note | location_note: `Ontario universities` → `Various university campuses across Canada` |
| summary | summary: `One-day campus engineering event hosted across Ontario universities.` → `Go ENG Girl is a free, one‑day event where girls and non‑binary youth can visit ` |
| eligibility | eligibility: `Girls and gender-diverse students in Grades 7–12, with a parent or guardian.` → `Girls and non‑binary youth in grades 7‑10 are eligible to attend.` |

Evidence:
- **program_start_date** = `2026-10-03` (labelled) — “Carleton University: Saturday, October 3rd, 2026”
- **program_end_date** = `2026-11-28` (labelled) — “Laurentian University: Saturday, November 28, 2026”

Extractor notes:
- Multiple event dates across different university campuses; students choose a single session to attend.

</details>

<details><summary>Discovery log</summary>

```
Needs verification: "SHAD Canada Summer Program" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
Needs verification: "DEEP Summer Academy" — check failed (400 {"error":{"message":"Failed to parse tool call arguments as JSON","type":"invalid_request_error","code":"tool_use_failed","failed_generation":"{\"name\": \"triage\", \"arguments\": {\"kind\":\"program\",\"\"}"}}).
Needs verification: "Visions of Science Youth Programs" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
hub uoft-outreach: FAILED — HTTP 403
hub uwaterloo-outreach: 4 candidate links
hub mcmaster-youth: 0 candidate links
hub queens-enrichment: FAILED — disallowed by robots.txt
hub western-youth: 1 candidate links
hub youth-science-canada: 5 candidate links
hub cemc: 11 candidate links
hub skills-ontario: 2 candidate links
hub shad: 6 candidate links
hub ontario-jobs-youth: 9 candidate links
hub canada-summer-jobs: 13 candidate links
hub ted-rogers-volunteer: FAILED — HTTP 403
hub duke-of-ed: FAILED — HTTP 403
search: No search API key configured — hub crawl only.
discovery: 51 unique, 51 not already in the catalogue
```

</details>