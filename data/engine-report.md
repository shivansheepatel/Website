## Data engine run `2026-11-16-5db951db`

Crawled **20** pages · **21** model calls · ~**$0.00** · **0** auto-applied · **9** need review · **0** to archive

### Dates in this PR

No date in this diff was written by the pipeline. Every date change is in the review queue below,
with the sentence from the source page that supports it. That is by design — see `docs/DATA-PIPELINE.md`.

### Needs review

Open `/admin/review` locally, or read them here:

<details><summary><strong>Shad</strong> — Shad Canada (43/100)</summary>

Source: https://shad.ca/

- New listing (confidence 43/100, low).
- Found via catalogue re-crawl.

Extractor notes:
- No specific application deadline, open date, program dates, grade eligibility, cost, or location details provided on the page.

</details>

<details><summary><strong>Canadian Computing Competition</strong> — CEMC, University of Waterloo (71/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/ccc

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Canadian Computing Competition (CCC)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Canadian Computing Competition (CCC)` → `Canadian Computing Competition` |
| category | category: `STEM` → `Programming contest` |
| app_deadline | app_deadline: `2027-01-20` → `2027-02-11` |
| program_start_date | program_start_date: _(none)_ → `2027-02-17` |
| cost_type | cost_type: `Small school-set registration fee` → `Free for participants; schools may be invoiced for extra contests` |
| location_type | location_type: `Written at your school` → `Hybrid` |
| location_note | location_note: `Ontario-wide` → `Written in school, participants write online` |
| summary | summary: `National programming contest and the entry point to Canada's IOI team.` → `Students take a three‑hour, five‑question programming contest online at their sc` |
| eligibility | eligibility: `Any secondary school student. Your school must register you as a contest centre.` → `Secondary school students (grades 9‑12) in Canada or elsewhere who have programm` |

Evidence:
- **app_deadline** = `2027-02-11` (labelled) — “Ordering deadline: Thursday, February 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-02-17` (labelled) — “North and South America: Wednesday, February 17, 2027”
  ⚠️ **Contest date for North and South America; other regions on Feb 18**

Extractor notes:
- Ordering deadline applies to schools, not individual students
- Contest date varies by region (Feb 17 for North/South America, Feb 18 elsewhere)
- Free for participants; schools may be charged for extra contests

</details>

<details><summary><strong>Euclid Contest</strong> — CEMC, University of Waterloo (59/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/euclid

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Euclid Mathematics Contest" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Euclid Mathematics Contest` → `Euclid Contest` |
| category | category: `STEM` → `Mathematics contest` |
| cost_type | cost_type: `Registration fee set by your school` → `$18.00 contest fee per participant, plus $5.00 processing fee and shipping fees` |
| location_type | location_type: `Written at your school` → `In-Person` |
| location_note | location_note: `Ontario-wide` → `Administered at the student's school` |
| application_link | application_link: `https://www.cemc.uwaterloo.ca/contests/euclid.html` → `https://cemc.uwaterloo.ca/contests/euclid.html` |
| summary | summary: `Senior math contest used in Waterloo admission and scholarship decisions.` → `The Euclid Contest is a 10‑question, 2.5‑hour mathematics competition for senior` |
| eligibility | eligibility: `Primarily Grade 12, open to any student who has covered the material.` → `Students in their final year of secondary school or CÉGEP students; motivated lo` |

Extractor notes:
- Ordering deadline (Thursday, March 11, 2027) is for schools to order contest materials, not an individual student application deadline.
- Two contest dates are listed: April 6, 2027 for North and South America and April 7, 2027 for elsewhere; not captured in start/end dates.

</details>

<details><summary><strong>Canada-Wide Science Fair</strong> — Youth Science Canada (66/100)</summary>

Source: https://youthscience.ca/science-fairs/cwsf

- Date change detected — program_start_date: null → 2025-06-01; program_end_date: null → 2025-06-06. Dates never auto-publish.
- Changes needing review: category, cost_type, location_type, location_note, summary, eligibility.
- Confidence 66/100.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Science fair` |
| program_start_date | program_start_date: _(none)_ → `2025-06-01` |
| program_end_date | program_end_date: _(none)_ → `2025-06-06` |
| cost_type | cost_type: `Free for finalists; regional fair entry may have a small fee` → `Unknown` |
| location_type | location_type: `In person` → `In-Person` |
| location_note | location_note: `Rotating host city` → `University of New Brunswick, Fredericton` |
| summary | summary: `National science fair reached by winning your regional fair first.` → `The Canada‑Wide Science Fair is a national competition where high‑school student` |
| eligibility | eligibility: `Students aged 12–20 who place at an affiliated regional fair.` → `Students from grades 7 through 12 who are winners of their regional STEM fairs a` |

Evidence:
- **program_start_date** = `2025-06-01` (prose) — “June 1 to 6, 2025”
- **program_end_date** = `2025-06-06` (prose) — “June 1 to 6, 2025”

Extractor notes:
- Program dates listed are for the 2025 fair, which is in the past relative to today.
- No application deadline or application link is provided on the page.
- All four grades listed — confirm the page really says 9-12 rather than being silent.

</details>

<details><summary><strong>Quantum School for Young Students</strong> — Institute for Quantum Computing, University of Waterloo (67/100)</summary>

Source: https://uwaterloo.ca/institute-for-quantum-computing/outreach/qsys

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Quantum School for Young Students (QSYS)" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Quantum School for Young Students (QSYS)` → `Quantum School for Young Students` |
| category | category: `STEM` → `Quantum summer school` |
| app_deadline | app_deadline: `2027-03-15` → `2027-05-02` |
| program_start_date | program_start_date: _(none)_ → `2027-08-03` |
| program_end_date | program_end_date: _(none)_ → `2027-08-12` |
| cost_type | cost_type: `Tuition plus residence, with financial assistance available` → `Unknown` |
| location_type | location_type: `In person, residential` → `Hybrid` |
| location_note | location_note: `Waterloo` → `Online; optional in‑person lab day in Waterloo region` |
| summary | summary: `Intensive introduction to quantum information science.` → `Students join a week‑long online quantum school with lectures, discussions, prob` |
| eligibility | eligibility: `Students entering their final year of high school, selected by application.` → `High‑school students` |

Evidence:
- **app_deadline** = `2027-05-02` (prose) — “Applications are open now and close Sunday, May 2, 2027.”
- **program_start_date** = `2027-08-03` (prose) — “QSYS 2027 is scheduled to take place online from August 3 to 12, 2027, with an optional in-person lab day for students from the Waterloo region on Monday, August 16, 2027.”
- **program_end_date** = `2027-08-12` (prose) — “QSYS 2027 is scheduled to take place online from August 3 to 12, 2027, with an optional in-person lab day for students from the Waterloo region on Monday, August 16, 2027.”

Extractor notes:
- Cost information not provided on page.
- Optional in‑person lab day on Aug 16, 2027 extends beyond the main program dates.
- Application open date not specified.

</details>

<details><summary><strong>Unknown</strong> — Unknown (0/100)</summary>

Source: https://onwie.ca/programs/go-eng-girl

- Extractor does not think this page is a single program.
- Found via catalogue re-crawl.

Extractor notes:
- Page contains only a verification message and no program details.

</details>

<details><summary><strong>Défi interuniversitaire des mégadonnées et de l’intelligence artificielle 2027 (IUBDC)</strong> — STEM Fellowship (68/100)</summary>

Source: https://stemfellowship.org/

- New listing (confidence 68/100, medium).
- Found via catalogue re-crawl.

Evidence:
- **program_start_date** = `2026-08-17` (prose) — “Aug 17-20 & Aug 24-27, 2026”
- **program_end_date** = `2026-08-27` (prose) — “Aug 17-20 & Aug 24-27, 2026”

Extractor notes:
- No application deadline or opening date specified; date range combines two separate periods.

</details>

<details><summary><strong>Please wait while your request is being verified...</strong> — Unknown (0/100)</summary>

Source: https://cheminst.ca/programs/chemistry-olympiad

- Extractor does not think this page is a single program.
- Found via catalogue re-crawl.

Extractor notes:
- Page contains only the text "Please wait while your request is being verified..." and no program details.

</details>

<details><summary><strong>Unknown</strong> — Unknown (0/100)</summary>

Source: https://cap.ca/programs/olympiad

- Extractor does not think this page is a single program.
- Found via catalogue re-crawl.

Extractor notes:
- Page contains only verification message; no program details available.

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
hub skills-ontario: 0 candidate links
hub shad: 5 candidate links
hub ontario-jobs-youth: 9 candidate links
hub canada-summer-jobs: 13 candidate links
hub ted-rogers-volunteer: FAILED — HTTP 403
hub duke-of-ed: FAILED — HTTP 403
search: No search API key configured — hub crawl only.
discovery: 48 unique, 48 not already in the catalogue
```

</details>