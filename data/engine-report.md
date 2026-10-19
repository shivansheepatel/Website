## Data engine run `2026-10-19-0eba9773`

Crawled **20** pages · **15** model calls · ~**$0.00** · **0** auto-applied · **6** need review · **0** to archive

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
- No specific application deadline provided on page.
- Application opening date mentions only month and year (September 2026) without a day; date omitted.
- No direct application link given; page URL used as reference only.
- Multiple campus locations; exact city not specified.

</details>

<details><summary><strong>Canadian Computing Competition</strong> — University of Waterloo - Centre for Education in Mathematics and Computing (CEMC) (49/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/ccc

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Canadian Computing Competition (CCC)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Canadian Computing Competition (CCC)` → `Canadian Computing Competition` |
| organization | organization: `CEMC, University of Waterloo` → `University of Waterloo - Centre for Education in Mathematics and Computing (CEMC` |
| category | category: `STEM` → `Programming contest` |
| cost_type | cost_type: `Small school-set registration fee` → `Free` |
| location_type | location_type: `Written at your school` → `Remote` |
| location_note | location_note: `Ontario-wide` → `Participants complete the contest online in their school` |
| summary | summary: `National programming contest and the entry point to Canada's IOI team.` → `Students take a three‑hour online contest with five algorithmic programming prob` |
| eligibility | eligibility: `Any secondary school student. Your school must register you as a contest centre.` → `Any secondary‑school student can enter, choosing Junior or Senior level regardle` |

Extractor notes:
- Contest date differs by region (Feb 17, 2027 for North/South America, Feb 18, 2027 elsewhere) – program start date left null.
- Ordering deadline (Feb 11, 2027) is a school‑level deadline, not an individual student application deadline.

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
| location_note | location_note: `Ontario-wide` → `Administered at the student's school (paper‑based)` |
| summary | summary: `Senior math contest used in Waterloo admission and scholarship decisions.` → `Students sit the Euclid Contest at their school, solving ten mathematics problem` |
| eligibility | eligibility: `Primarily Grade 12, open to any student who has covered the material.` → `Students in their final year of secondary school or CÉGEP students; motivated st` |

Evidence:
- **app_deadline** = `2027-03-11` (labelled) — “Ordering deadline: Thursday, March 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-04-06` (labelled) — “North and South America: Tuesday, April 6, 2027”

Extractor notes:
- Ordering deadline is for schools to place orders, not a student application deadline.
- Contest date varies by region; North America date used for Ontario students.

</details>

<details><summary><strong>Canada-Wide Science Fair</strong> — Youth Science Canada (1/100)</summary>

Source: https://youthscience.ca/science-fairs/cwsf

- Extractor does not think this page is a single program.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Science fair` |
| cost_type | cost_type: `Free for finalists; regional fair entry may have a small fee` → `Unknown` |
| location_type | location_type: `In person` → `Unknown` |
| summary | summary: `National science fair reached by winning your regional fair first.` → `The Canada-Wide Science Fair is an annual national event where youth showcase ST` |
| eligibility | eligibility: `Students aged 12–20 who place at an affiliated regional fair.` → `Students from grades 7 through 12 who are winners of their respective regional S` |

Extractor notes:
- Page provides information about the fair but does not give a direct application process or deadline for student participants.
- Board treasurer role deadline (Oct 23) is unrelated to student participation.
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
| program_start_date | program_start_date: _(none)_ → `2027-08-03` |
| program_end_date | program_end_date: _(none)_ → `2027-08-16` |
| cost_type | cost_type: `Tuition plus residence, with financial assistance available` → `Unknown` |
| location_type | location_type: `In person, residential` → `Hybrid` |
| location_note | location_note: `Waterloo` → `Online with optional in-person lab day in Waterloo region` |
| summary | summary: `Intensive introduction to quantum information science.` → `Students attend online lectures, discussions and problem‑solving sessions about ` |
| eligibility | eligibility: `Students entering their final year of high school, selected by application.` → `High‑school students` |

Evidence:
- **program_start_date** = `2027-08-03` (prose) — “QSYS 2027 is scheduled to take place online from August 3 to 12, 2027, with an optional in-person lab day for students from the Waterloo region on Monday, August 16, 2027.”
- **program_end_date** = `2027-08-16` (prose) — “QSYS 2027 is scheduled to take place online from August 3 to 12, 2027, with an optional in-person lab day for students from the Waterloo region on Monday, August 16, 2027.”
  ⚠️ **Includes optional in‑person lab day**

Extractor notes:
- Application opening date only given as "by December 2026" without a specific day, so app_open_date is null.
- Program end date includes optional in‑person lab day; main online portion ends August 12, 2027.

</details>

<details><summary><strong>Go ENG Girl</strong> — Ontario Network of Women in Engineering (68/100)</summary>

Source: https://onwie.ca/programs/go-eng-girl

- Date change detected — program_start_date: null → 2026-10-03; program_end_date: null → 2026-11-28. Dates never auto-publish.
- Changes needing review: category, grade_levels, location_type, location_note, summary, eligibility.
- Confidence 68/100.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Engineering outreach` |
| grade_levels | grade_levels: `9,10,11,12` → `9,10` |
| program_start_date | program_start_date: _(none)_ → `2026-10-03` |
| program_end_date | program_end_date: _(none)_ → `2026-11-28` |
| location_type | location_type: `In person, one day` → `In-Person` |
| location_note | location_note: `Ontario universities` → `Various host universities across Canada (e.g., University of Calgary, Carleton U` |
| summary | summary: `One-day campus engineering event hosted across Ontario universities.` → `Go ENG Girl is a free day‑long event where girls and non‑binary youth can visit ` |
| eligibility | eligibility: `Girls and gender-diverse students in Grades 7–12, with a parent or guardian.` → `Girls and non-binary youth in grades 7-10 are eligible to attend.` |

Evidence:
- **program_start_date** = `2026-10-03` (prose) — “Carleton University: Saturday, October 3rd, 2026”
- **program_end_date** = `2026-11-28` (prose) — “University of Windsor: Saturday, November 28, 2026”

Extractor notes:
- Multiple event dates at different host universities; no single application deadline provided.
- No registration link appears on the page.
- Eligibility includes grades 7‑8, which are outside the typical high‑school range; only grades 9‑10 are captured.

</details>

<details><summary>Discovery log</summary>

```
Needs verification: "DEEP Summer Academy" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
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