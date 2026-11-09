## Data engine run `2026-11-09-7e062461`

Crawled **20** pages · **11** model calls · ~**$0.00** · **0** auto-applied · **4** need review · **0** to archive

### Dates in this PR

No date in this diff was written by the pipeline. Every date change is in the review queue below,
with the sentence from the source page that supports it. That is by design — see `docs/DATA-PIPELINE.md`.

### Needs review

Open `/admin/review` locally, or read them here:

<details><summary><strong>Euclid Contest</strong> — Centre for Education in Mathematics and Computing (CEMC), University of Waterloo (77/100)</summary>

Source: https://cemc.uwaterloo.ca/contests/euclid

- Looks like an existing listing under a different name.
- Found via catalogue re-crawl.
- Possible duplicate of "Euclid Mathematics Contest" — title 100% similar, same domain.

| field | change |
| --- | --- |
| title | title: `Euclid Mathematics Contest` → `Euclid Contest` |
| organization | organization: `CEMC, University of Waterloo` → `Centre for Education in Mathematics and Computing (CEMC), University of Waterloo` |
| category | category: `STEM` → `Mathematics contest` |
| app_deadline | app_deadline: `2027-03-25` → `2027-03-11` |
| program_start_date | program_start_date: _(none)_ → `2027-04-06` |
| cost_type | cost_type: `Registration fee set by your school` → `$18.00 contest fee per participant plus processing and shipping fees` |
| location_type | location_type: `Written at your school` → `In-Person` |
| location_note | location_note: `Ontario-wide` → `Students write the contest in their school on the contest date` |
| summary | summary: `Senior math contest used in Waterloo admission and scholarship decisions.` → `The Euclid Contest is a 2.5‑hour mathematics competition for senior secondary st` |
| eligibility | eligibility: `Primarily Grade 12, open to any student who has covered the material.` → `Students in their final year of secondary school or CÉGEP students may enter; mo` |

Evidence:
- **app_deadline** = `2027-03-11` (labelled) — “Ordering deadline: Thursday, March 11, 2027”
  ⚠️ **School ordering deadline, not an individual student application**
- **program_start_date** = `2027-04-06` (labelled) — “North and South America: Tuesday, April 6, 2027”

Extractor notes:
- Ordering deadline is a school‑level deadline, not a direct student application deadline

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
| location_note | location_note: `Rotating host city` → `Fredericton, University of New Brunswick` |
| summary | summary: `National science fair reached by winning your regional fair first.` → `Students present their STEM projects at a national fair in Fredericton, competin` |
| eligibility | eligibility: `Students aged 12–20 who place at an affiliated regional fair.` → `Students in grades 7‑12 who are winners of their regional STEM fairs.` |

Evidence:
- **program_start_date** = `2025-06-01` (prose) — “Youth Science Canada will bring the 63rd Canada-Wide Science Fair (CWSF), the country’s largest annual youth science, technology, engineering and mathematics (STEM) event, to the U”
- **program_end_date** = `2025-06-06` (prose) — “Youth Science Canada will bring the 63rd Canada-Wide Science Fair (CWSF), the country’s largest annual youth science, technology, engineering and mathematics (STEM) event, to the U”

Extractor notes:
- Program dates are for the 2025 event, which is in the past relative to today (2026‑11‑09).
- Grades 7‑8 are mentioned but only grades 9‑12 are included per directory policy.
- All four grades listed — confirm the page really says 9-12 rather than being silent.

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
| location_note | location_note: `Waterloo` → `Online with optional in-person lab day in Waterloo region` |
| summary | summary: `Intensive introduction to quantum information science.` → `Students attend a week‑long online program of lectures, discussions, problem‑sol` |
| eligibility | eligibility: `Students entering their final year of high school, selected by application.` → `High‑school students` |

Evidence:
- **app_deadline** = `2027-05-02` (prose) — “Applications are open now and close Sunday, May 2, 2027”
- **program_start_date** = `2027-08-03` (prose) — “from August 3 to 12, 2027”
- **program_end_date** = `2027-08-12` (prose) — “from August 3 to 12, 2027”

Extractor notes:
- Program runs online Aug 3‑12, 2027; optional in‑person lab day on Aug 16 not reflected in end date.
- No specific grade restriction stated; cost information not provided.

</details>

<details><summary><strong>Go ENG Girl</strong> — Ontario Network of Women in Engineering (51/100)</summary>

Source: https://onwie.ca/programs/go-eng-girl

- Changes needing review: category, grade_levels, location_type, location_note, summary, eligibility.
- Confidence 51/100.
- Found via catalogue re-crawl.

| field | change |
| --- | --- |
| category | category: `STEM` → `Engineering outreach event` |
| grade_levels | grade_levels: `9,10,11,12` → `9,10` |
| location_type | location_type: `In person, one day` → `In-Person` |
| location_note | location_note: `Ontario universities` → `Various host universities across Canada` |
| summary | summary: `One-day campus engineering event hosted across Ontario universities.` → `Go ENG Girl is a free, one‑day event where girls and non‑binary youth can visit ` |
| eligibility | eligibility: `Girls and gender-diverse students in Grades 7–12, with a parent or guardian.` → `Girls and non-binary youth in grades 7-10 are eligible to attend.` |

Extractor notes:
- Multiple event dates and locations; no single program start or end date.
- No application deadline or registration link provided on the page.

</details>

<details><summary>Discovery log</summary>

```
Needs verification: "SHAD Canada Summer Program" — check failed (400 {"error":{"message":"Failed to parse tool call arguments as JSON","type":"invalid_request_error","code":"tool_use_failed","failed_generation":"{\"name\": \"triage\", \"arguments\": {\"kind\"}"}}).
Needs verification: "DEEP Summer Academy" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
Needs verification: "Canadian Computing Competition (CCC)" — check failed (400 {"error":{"message":"Tool call validation failed: tool call validation failed: parameters for tool record_program did not match schema: errors: [`/program_end_date`: missing properties: 'caveat', `/app_deadline`: missing properties: 'caveat', `/program_start_date`: missing properties: 'caveat']","type":"invalid_request_error","code":"tool_use_failed","failed_generation":"{\"name\": \"record_program\", \"arguments\": {\n  \"title\": \"Canadian Computing Competition\",\n  \"organization\": \"University of Waterloo - CEMC\",\n  \"category\": \"Programming competition\",\n  \"grade_levels\": [],\n  \"cost_type\": \"Free\",\n  \"cost_note\": null,\n  \"location_type\": \"Hybrid\",\n  \"location_note\": \"Written in school using online platform\",\n  \"app_deadline\": {\n    \"value\": \"2027-02-11\",\n    \"quote\": \"Ordering deadline: Thursday, February 11, 2027\",\n    \"evidence\": \"labelled\"\n  },\n  \"app_open_date\": null,\n  \"program_start_date\": {\n    \"value\": \"2027-02-17\",\n    \"quote\": \"North and South America: Wednesday, February 17, 2027\",\n    \"evidence\": \"labelled\"\n  },\n  \"program_end_date\": {\n    \"value\": \"2027-02-17\",\n    \"quote\": \"North and South America: Wednesday, February 17, 2027\",\n    \"evidence\": \"labelled\"\n  },\n  \"rolling\": false,\n  \"application_link\": null,\n  \"required_documents\": [],\n  \"essay_prompts\": [],\n  \"summary\": \"Students take the contest at their school, working online individually to solve five programming problems in three hours.\",\n  \"eligibility\": \"Open to all secondary school students (grades 9‑12) in Canada and North/South America; participants choose Junior or Senior level based on programming experience.\",\n  \"not_a_program\": false,\n  \"notes\": [\n    \"Ordering deadline is for schools to order contest materials, not an individual student application deadline.\",\n    \"Contest date varies by region; listed date applies to North and South America.\"\n  ]\n}}"}}).
Needs verification: "STEM Fellowship Big Data Challenge" — check failed (400 {"error":{"message":"Tool choice is required, but model did not call a tool","type":"invalid_request_error","code":"tool_use_failed","failed_generation":""}}).
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