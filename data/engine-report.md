## Data engine run `2026-11-23-f5cbf6e4`

Crawled **20** pages · **9** model calls · ~**$0.00** · **0** auto-applied · **3** need review · **0** to archive

### Dates in this PR

No date in this diff was written by the pipeline. Every date change is in the review queue below,
with the sentence from the source page that supports it. That is by design — see `docs/DATA-PIPELINE.md`.

### Needs review

Open `/admin/review` locally, or read them here:

<details><summary><strong>Euclid Contest</strong> — Centre for Education in Mathematics and Computing (CEMC), University of Waterloo (89/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/euclid

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Euclid Mathematics Contest" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Euclid Mathematics Contest` → `Euclid Contest` |
| organization | organization: `CEMC, University of Waterloo` → `Centre for Education in Mathematics and Computing (CEMC), University of Waterloo` |
| category | category: `STEM` → `Mathematics contest` |
| grade_levels | grade_levels: `11,12` → `12` |
| app_deadline | app_deadline: `2027-03-25` → `2027-03-11` |
| program_start_date | program_start_date: _(none)_ → `2027-04-06` |
| cost_type | cost_type: `Registration fee set by your school` → `$18.00 contest fee per participant, plus $5.00 processing fee and shipping fees` |
| location_type | location_type: `Written at your school` → `In-Person` |
| location_note | location_note: `Ontario-wide` → `Administered at the student's school` |
| application_link | application_link: `https://www.cemc.uwaterloo.ca/contests/euclid.html` → `https://cemc.uwaterloo.ca/contests/euclid.html` |
| summary | summary: `Senior math contest used in Waterloo admission and scholarship decisions.` → `Students take the Euclid Contest, a 10‑question, 2.5‑hour mathematics competitio` |
| eligibility | eligibility: `Primarily Grade 12, open to any student who has covered the material.` → `Students in their final year of secondary school or CÉGEP students; motivated st` |

Evidence:
- **app_deadline** = `2027-03-11` (labelled) — “Ordering deadline: Thursday, March 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-04-06` (labelled) — “North and South America: Tuesday, April 6, 2027”

Extractor notes:
- Two contest dates are listed; the earlier date (April 6, 2027) is for North and South America, with a separate date (April 7, 2027) for other regions.
- The ordering deadline applies to schools, not individual student applications.

</details>

<details><summary><strong>Quantum School for Young Students</strong> — Institute for Quantum Computing, University of Waterloo (73/100)</summary>

Source: https://uwaterloo.ca/institute-for-quantum-computing/outreach/qsys

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Quantum School for Young Students (QSYS)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Quantum School for Young Students (QSYS)` → `Quantum School for Young Students` |
| category | category: `STEM` → `Quantum enrichment program` |
| app_deadline | app_deadline: `2027-03-15` → `2027-05-02` |
| program_start_date | program_start_date: _(none)_ → `2027-08-03` |
| program_end_date | program_end_date: _(none)_ → `2027-08-12` |
| cost_type | cost_type: `Tuition plus residence, with financial assistance available` → `Unknown` |
| location_type | location_type: `In person, residential` → `Hybrid` |
| location_note | location_note: `Waterloo` → `Online with optional in‑person lab day in Waterloo region` |
| summary | summary: `Intensive introduction to quantum information science.` → `Students join a week‑long online program to learn about quantum physics, compute` |
| eligibility | eligibility: `Students entering their final year of high school, selected by application.` → `Open to high‑school students.` |

Evidence:
- **app_deadline** = `2027-05-02` (prose) — “Applications are open now and close Sunday, May 2, 2027.”
- **program_start_date** = `2027-08-03` (prose) — “QSYS 2027 is scheduled to take place online from August 3 to 12, 2027”
- **program_end_date** = `2027-08-12` (prose) — “QSYS 2027 is scheduled to take place online from August 3 to 12, 2027”

Extractor notes:
- Application opening date not specified on the page.
- Optional in‑person lab day on August 16, 2027 is outside the main program dates.

</details>

<details><summary><strong>Go ENG Girl</strong> — Ontario Network of Women in Engineering (74/100)</summary>

Source: https://onwie.ca/programs/go-eng-girl

- Date change detected — program_start_date: null → 2026-10-03; program_end_date: null → 2026-11-28. Dates never auto-publish.
- Changes needing review: category, grade_levels, location_type, location_note, summary, eligibility.
- Confidence 74/100.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Engineering outreach` |
| grade_levels | grade_levels: `9,10,11,12` → `9,10` |
| program_start_date | program_start_date: _(none)_ → `2026-10-03` |
| program_end_date | program_end_date: _(none)_ → `2026-11-28` |
| location_type | location_type: `In person, one day` → `In-Person` |
| location_note | location_note: `Ontario universities` → `Various universities across Canada` |
| summary | summary: `One-day campus engineering event hosted across Ontario universities.` → `Go ENG Girl is a free, one‑day event held at many universities across Canada whe` |
| eligibility | eligibility: `Girls and gender-diverse students in Grades 7–12, with a parent or guardian.` → `Girls and non‑binary youth in grades 7‑10.` |

Evidence:
- **program_start_date** = `2026-10-03` (prose) — “Carleton University: Saturday, October 3rd, 2026”
- **program_end_date** = `2026-11-28` (prose) — “Laurentian University: Saturday, November 28, 2026”

Extractor notes:
- Program consists of multiple one‑day events at different universities; start and end dates reflect the earliest and latest event dates.
- Eligibility includes grades 7‑10; only grades 9‑10 are captured for the directory.

</details>

<details><summary>Discovery log</summary>

```
Needs verification: "SHAD Canada Summer Program" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
Needs verification: "DEEP Summer Academy" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
Needs verification: "Canada-Wide Science Fair" — check failed (400 {"error":{"message":"Failed to parse tool call arguments as JSON","type":"invalid_request_error","code":"tool_use_failed","failed_generation":"{\"name\": \"triage\", \"arguments\": {\"kind\":\"program\",\"\"}"}}).
hub uoft-outreach: FAILED — HTTP 403
hub uwaterloo-outreach: 4 candidate links
hub mcmaster-youth: 0 candidate links
hub queens-enrichment: FAILED — disallowed by robots.txt
hub western-youth: 1 candidate links
hub youth-science-canada: 5 candidate links
hub cemc: 11 candidate links
hub skills-ontario: 2 candidate links
hub shad: 5 candidate links
hub ontario-jobs-youth: 9 candidate links
hub canada-summer-jobs: 13 candidate links
hub ted-rogers-volunteer: FAILED — HTTP 403
hub duke-of-ed: FAILED — HTTP 403
search: No search API key configured — hub crawl only.
discovery: 50 unique, 50 not already in the catalogue
```

</details>