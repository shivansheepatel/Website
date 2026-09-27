import { sheetSeeds } from "./programs.sheet.ts";
export type Category = "STEM" | "Business" | "Medicine" | "Law & Civics" | "Leadership" | "Arts";

export type Confidence = "confirmed" | "estimated" | "unposted";

export interface Program {
  id: string;
  title: string;
  org: string;
  category: Category;
  grades: number[];
  summary: string;
  description: string;
  eligibility: string;

  /** Application closing date, ISO `YYYY-MM-DD`. `null` = none published. */
  deadline: string | null;
  /** How much the deadline can be trusted. */
  confidence: Confidence;

  /* --- Lifecycle dates -----------------------------------------------------
   *
   * These four drive the application lifecycle engine in
   * `src/lib/program-schema.ts`. They are OPTIONAL because most organisers do
   * not publish them: a typical listing has a closing date and nothing else.
   *
   * Leave a field `null` rather than guessing. The UI has an honest variant
   * for every absent date ("open date not published"), and the weekly sync job
   * reports what is missing so it can be filled in from source over time. A
   * fabricated open date is worse than no open date — it sends a student to
   * a form that does not exist yet.
   */

  /** When applications OPEN, ISO date. Drives the "Opening soon" state. */
  appOpenDate?: string | null;
  /** First day the program actually runs. Drives the "In session" state. */
  programStartDate?: string | null;
  /** Last day the program runs. */
  programEndDate?: string | null;

  cost: string;
  format: string;
  location: string;
  equity?: string;

  /** The organiser's own application page. */
  url: string;
  /** Where the dates were read from, if not the main URL. */
  sourceUrl?: string;
  /** ISO date of the last human or automated verification pass. */
  lastChecked: string;
}

export const CATEGORIES: Category[] = [
  "STEM",
  "Business",
  "Medicine",
  "Law & Civics",
  "Leadership",
  "Arts",
];

const CHECKED = "2026-09-15";

type Seed = Omit<Program, "lastChecked" | "id"> & { id?: string };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const seeds: Seed[] = [
  // ---------- STEM ----------
  {
    title: "SHAD Canada Summer Program",
    org: "SHAD",
    category: "STEM",
    grades: [10, 11, 12],
    summary: "Month-long STEAM and entrepreneurship residency on a Canadian university campus.",
    description:
      "SHAD places students on a host university campus for a month of lectures, labs, workshops and a team design-entrepreneurship project responding to a national challenge. Widely recognised on university applications.",
    eligibility:
      "Students in Grades 10–12 the year before the program. Strong academics and a written application with references.",
    deadline: "2026-11-25",
    confidence: "confirmed",
    cost: "$6,500 — need-based financial aid available for most applicants",
    format: "In person, residential",
    location: "Host campuses across Canada",
    url: "https://www.shad.ca/",
  },
  {
    title: "DEEP Summer Academy",
    org: "University of Toronto Engineering Outreach",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "University-taught engineering and science courses across two-week summer blocks.",
    description:
      "Da Vinci Engineering Enrichment Program courses are taught by U of T graduate students and cover everything from aerospace and biomedical engineering to machine learning and robotics.",
    eligibility:
      "Open to students entering Grades 9–12. Courses fill quickly; some have math prerequisites.",
    deadline: "2027-03-01",
    confidence: "estimated",
    cost: "About $600 per two-week course; bursaries available",
    format: "In person and online options",
    location: "Toronto",
    url: "https://outreach.engineering.utoronto.ca/deep-summer-academy/",
  },
  {
    title: "Canadian Computing Competition (CCC)",
    org: "CEMC, University of Waterloo",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "National programming contest and the entry point to Canada's IOI team.",
    description:
      "A written-at-school programming contest with Junior and Senior divisions. Top scorers are invited to the Canadian Computing Olympiad and eventually the International Olympiad in Informatics.",
    eligibility: "Any secondary school student. Your school must register you as a contest centre.",
    deadline: "2027-01-20",
    confidence: "estimated",
    cost: "Small school-set registration fee",
    format: "Written at your school",
    location: "Ontario-wide",
    url: "https://www.cemc.uwaterloo.ca/contests/computing.html",
  },
  {
    title: "Euclid Mathematics Contest",
    org: "CEMC, University of Waterloo",
    category: "STEM",
    grades: [11, 12],
    summary: "Senior math contest used in Waterloo admission and scholarship decisions.",
    description:
      "A 2.5 hour, ten-problem contest for senior students. Results feed into Waterloo Math and Engineering admission averages and scholarship consideration.",
    eligibility: "Primarily Grade 12, open to any student who has covered the material.",
    deadline: "2027-03-25",
    confidence: "estimated",
    cost: "Registration fee set by your school",
    format: "Written at your school",
    location: "Ontario-wide",
    url: "https://www.cemc.uwaterloo.ca/contests/euclid.html",
  },
  {
    title: "Canada-Wide Science Fair",
    org: "Youth Science Canada",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "National science fair reached by winning your regional fair first.",
    description:
      "Roughly 350 finalists present original research projects and compete for medals, scholarships and special awards. You qualify through your regional science fair in the spring.",
    eligibility: "Students aged 12–20 who place at an affiliated regional fair.",
    deadline: "2027-03-15",
    confidence: "estimated",
    cost: "Free for finalists; regional fair entry may have a small fee",
    format: "In person",
    location: "Rotating host city",
    url: "https://youthscience.ca/science-fairs/cwsf/",
  },
  {
    title: "Toronto Science Fair",
    org: "Toronto Science Fair Association",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Regional science fair and qualifier for the Canada-Wide Science Fair.",
    description:
      "Students present independent research to judges from Toronto universities and industry. Medallists advance to the national fair.",
    eligibility: "Students attending school in Toronto, Grades 7–12.",
    deadline: "2027-03-01",
    confidence: "estimated",
    cost: "Free",
    format: "In person",
    location: "Toronto",
    url: "https://torontosciencefair.ca/",
  },
  {
    title: "Sanofi Biogenius Canada",
    org: "Sanofi Canada / BioTalent",
    category: "STEM",
    grades: [10, 11, 12],
    summary: "Biotech research competition where students work in a real mentor lab.",
    description:
      "Students pair with a university or hospital mentor, run a biotechnology research project over several months, then present at a regional and national competition with cash prizes.",
    eligibility:
      "Secondary students who secure a research mentor. Mentor matching support is available.",
    deadline: "2027-02-01",
    confidence: "estimated",
    cost: "Free",
    format: "Lab-based research plus presentation",
    location: "Ontario regionals",
    url: "https://sanofibiogenius.ca/",
  },
  {
    title: "International Summer School for Young Physicists (ISSYP)",
    org: "Perimeter Institute",
    category: "STEM",
    grades: [11, 12],
    summary: "Two-week theoretical physics program with Perimeter researchers.",
    description:
      "Selected students study relativity, quantum mechanics and cosmology with working theoretical physicists, including mentorship sessions and a group research presentation.",
    eligibility:
      "Students in their final two years of high school with strong physics and math results.",
    deadline: "2027-03-31",
    confidence: "estimated",
    cost: "Free, including accommodation for in-person participants",
    format: "In person and online streams",
    location: "Waterloo",
    url: "https://perimeterinstitute.ca/issyp",
  },
  {
    title: "Quantum School for Young Students (QSYS)",
    org: "Institute for Quantum Computing, University of Waterloo",
    category: "STEM",
    grades: [11, 12],
    summary: "Intensive introduction to quantum information science.",
    description:
      "Students attend lectures and labs with IQC researchers, tour quantum fabrication facilities, and complete a group project on quantum technology.",
    eligibility: "Students entering their final year of high school, selected by application.",
    deadline: "2027-03-15",
    confidence: "estimated",
    cost: "Tuition plus residence, with financial assistance available",
    format: "In person, residential",
    location: "Waterloo",
    url: "https://uwaterloo.ca/institute-for-quantum-computing/programs/qsys",
  },
  {
    title: "FIRST Robotics Competition — Ontario",
    org: "FIRST Robotics Canada",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Build a competition robot in six weeks with a school or community team.",
    description:
      "Teams receive a game challenge in January and have six weeks to design, build and program a robot before district events and the provincial championship.",
    eligibility: "Join or start a team at your school. No prior experience required.",
    deadline: "2026-10-15",
    confidence: "estimated",
    cost: "Team registration fee, usually covered by the school or sponsors",
    format: "Team build plus tournaments",
    location: "Ontario districts",
    url: "https://firstroboticscanada.org/frc/",
  },
  {
    title: "VEX Robotics Ontario Provincials",
    org: "REC Foundation Canada",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Smaller-scale robotics league with a season of qualifying tournaments.",
    description:
      "Teams build VEX V5 robots for the annual game, compete at local qualifiers, and advance to provincials and the world championship.",
    eligibility: "Any student team registered with the REC Foundation.",
    deadline: "2026-11-01",
    confidence: "estimated",
    cost: "Registration plus kit costs; grants available for new teams",
    format: "Team build plus tournaments",
    location: "Ontario-wide",
    url: "https://www.roboticseducation.org/",
  },
  {
    title: "CyberTitan National Youth Cyber Defence Challenge",
    org: "ICTC",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Team cybersecurity competition run over an online season.",
    description:
      "Teams of up to six secure simulated networks under time pressure across several online rounds, with top teams invited to a national final.",
    eligibility: "Students under 20 with a teacher or mentor coach.",
    deadline: "2026-10-31",
    confidence: "estimated",
    cost: "Team registration fee; subsidies available",
    format: "Online rounds plus national final",
    location: "Online",
    url: "https://www.ictc-ctic.ca/programs/cybertitan",
  },
  {
    title: "Technovation Girls",
    org: "Technovation",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Build a mobile app or AI project that solves a community problem.",
    description:
      "Teams work with a mentor over twelve weeks to identify a problem, build a working app or AI prototype, and pitch a business plan to global judges.",
    eligibility: "Girls and gender-diverse students aged 8–18, in teams of one to five.",
    deadline: "2027-04-20",
    confidence: "estimated",
    cost: "Free",
    format: "Online with a mentor",
    location: "Online",
    equity: "For girls and gender-diverse students",
    url: "https://www.technovation.org/",
  },
  {
    title: "Go ENG Girl",
    org: "Ontario Network of Women in Engineering",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "One-day campus engineering event hosted across Ontario universities.",
    description:
      "Hands-on engineering activities, campus tours and panels with women engineers and students, hosted the same weekend at universities across the province.",
    eligibility: "Girls and gender-diverse students in Grades 7–12, with a parent or guardian.",
    deadline: "2026-10-05",
    confidence: "estimated",
    cost: "Free",
    format: "In person, one day",
    location: "Ontario universities",
    equity: "For girls and gender-diverse students",
    url: "https://onwie.ca/programs/go-eng-girl/",
  },
  {
    title: "Visions of Science Youth Programs",
    org: "Visions of Science",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Year-round STEM clubs and leadership tracks in Toronto-area communities.",
    description:
      "Free weekly STEM clubs, a youth leadership stream and paid junior facilitator roles designed for youth from low-income and racialised communities in the GTA.",
    eligibility: "Youth aged 9–18 living in priority communities across Toronto, Peel and York.",
    deadline: "2026-09-30",
    confidence: "estimated",
    cost: "Free",
    format: "In person, weekly",
    location: "Greater Toronto Area",
    equity: "For Black and racialised youth in low-income communities",
    url: "https://visionsofscience.ca/",
  },
  {
    title: "STEM Fellowship Big Data Challenge",
    org: "STEM Fellowship",
    category: "STEM",
    grades: [10, 11, 12],
    summary: "Data science competition ending in a peer-reviewed student publication.",
    description:
      "Teams analyse a real open dataset, learn data science tooling through workshops, and submit a manuscript; finalists present and can be published in a student journal.",
    eligibility: "Teams of two to five high school students.",
    deadline: "2026-11-30",
    confidence: "estimated",
    cost: "Free",
    format: "Online",
    location: "Online",
    url: "https://stemfellowship.org/",
  },
  {
    title: "Canadian Chemistry Olympiad — National Exam",
    org: "Chemical Institute of Canada",
    category: "STEM",
    grades: [11, 12],
    summary: "Written exam selecting Canada's International Chemistry Olympiad team.",
    description:
      "Students write a local qualifying exam, then the national exam; top performers attend a training camp and may represent Canada internationally.",
    eligibility: "Secondary students under 20 who have not begun post-secondary study.",
    deadline: "2027-03-01",
    confidence: "estimated",
    cost: "Free or small school fee",
    format: "Written at your school",
    location: "Ontario-wide",
    url: "https://www.cheminst.ca/programs/chemistry-olympiad/",
  },
  {
    title: "Canadian Biology Olympiad",
    org: "Canadian Biology Olympiad",
    category: "STEM",
    grades: [10, 11, 12],
    summary: "Biology exam series leading to the International Biology Olympiad team.",
    description:
      "An open first-round exam narrows to a national semifinal and final, with the top four students representing Canada at the IBO.",
    eligibility: "High school students under 20.",
    deadline: "2027-01-15",
    confidence: "estimated",
    cost: "Small registration fee",
    format: "Online and written rounds",
    location: "Online",
    url: "https://biologyolympiad.ca/",
  },
  {
    title: "Canadian Physics Olympiad (CPhO)",
    org: "Canadian Association of Physicists",
    category: "STEM",
    grades: [11, 12],
    summary: "National physics exam and training camp pathway.",
    description:
      "Students write the CAP high school prize exam and the CPhO; top scorers are invited to a national training camp and possible selection for the International Physics Olympiad.",
    eligibility: "Secondary students, typically Grade 11–12 physics students.",
    deadline: "2027-02-15",
    confidence: "estimated",
    cost: "Small registration fee",
    format: "Written at your school",
    location: "Ontario-wide",
    url: "https://www.cap.ca/programs/olympiad/",
  },
  {
    title: "Queen's Enrichment Studies Unit (ESU) Summer Program",
    org: "Queen's University",
    category: "STEM",
    grades: [10, 11, 12],
    summary: "Week-long university-level courses in science, engineering and the humanities.",
    description:
      "Students live in residence and take an intensive credit-free course taught by Queen's instructors, from biomedical science to engineering design.",
    eligibility: "Students entering Grades 10–12.",
    deadline: "2027-04-01",
    confidence: "estimated",
    cost: "Around $1,200 per week with residence; bursaries available",
    format: "In person, residential",
    location: "Kingston",
    url: "https://esu.queensu.ca/",
  },
  {
    title: "Mini University — Waterloo Engineering",
    org: "University of Waterloo",
    category: "STEM",
    grades: [9, 10],
    summary: "Summer camp blending engineering, math and science for younger students.",
    description:
      "Day-camp style sessions run by Waterloo student instructors, covering programming, design challenges and lab work.",
    eligibility: "Students entering Grades 6–10.",
    deadline: "2027-05-01",
    confidence: "estimated",
    cost: "Weekly camp fee",
    format: "In person day camp",
    location: "Waterloo",
    url: "https://uwaterloo.ca/engineering-outreach/",
  },
  {
    title: "Let's Talk Science Volunteer Outreach",
    org: "Let's Talk Science",
    category: "STEM",
    grades: [10, 11, 12],
    summary: "Volunteer hours running science activities for younger students.",
    description:
      "High school volunteers help deliver hands-on STEM workshops in elementary classrooms and community events — a steady source of community service hours tied to science.",
    eligibility: "Students aged 15+ with a completed volunteer application.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "In person volunteering",
    location: "Ontario-wide",
    url: "https://letstalkscience.ca/",
  },
  {
    title: "Hack the North High School Track",
    org: "University of Waterloo",
    category: "STEM",
    grades: [11, 12],
    summary: "Canada's largest hackathon, with limited spots for senior high school students.",
    description:
      "Thirty-six hours of team building, mentorship from industry engineers, and project demos. A small number of high school applicants are accepted each year.",
    eligibility: "Students aged 16+ at the time of the event; highly competitive application.",
    deadline: "2026-09-20",
    confidence: "confirmed",
    cost: "Free, travel reimbursement available",
    format: "In person hackathon",
    location: "Waterloo",
    url: "https://hackthenorth.com/",
  },
  {
    title: "Canadian Team Mathematics Contest",
    org: "CEMC, University of Waterloo",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Team-based math contest written in a single afternoon.",
    description:
      "Teams of six work through individual, relay and team problem sets — a good first contest for students who find individual olympiads intimidating.",
    eligibility: "School teams of up to six students.",
    deadline: "2027-03-20",
    confidence: "estimated",
    cost: "School registration fee",
    format: "Written at your school",
    location: "Ontario-wide",
    url: "https://www.cemc.uwaterloo.ca/contests/ctmc.html",
  },
  {
    title: "Actua National Youth Programs",
    org: "Actua",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Network of university-run STEM camps and workshops across the country.",
    description:
      "Actua's member network runs camps, clubs and Indigenous youth programs on campuses across Ontario, including coding, engineering and land-based science.",
    eligibility: "Varies by member program; many streams are designed for underrepresented youth.",
    deadline: null,
    confidence: "unposted",
    cost: "Varies; many free programs",
    format: "In person and online",
    location: "Ontario campuses",
    url: "https://actua.ca/",
  },

  // ---------- Business ----------
  {
    title: "DECA Ontario Provincials",
    org: "DECA Ontario",
    category: "Business",
    grades: [9, 10, 11, 12],
    summary: "Case competition in marketing, finance, hospitality and entrepreneurship.",
    description:
      "Students compete in role-play and written events at regionals and provincials; top competitors advance to the International Career Development Conference.",
    eligibility: "Students at a school with a DECA chapter. Ask your business teacher.",
    deadline: "2026-12-05",
    confidence: "estimated",
    cost: "Chapter membership plus conference fees",
    format: "In person conference",
    location: "Toronto",
    url: "https://www.deca.ca/",
  },
  {
    title: "JA Company Program",
    org: "Junior Achievement Central Ontario",
    category: "Business",
    grades: [10, 11, 12],
    summary: "Run a real student-led company over a school year with business mentors.",
    description:
      "Teams incorporate a small business, raise capital, sell a product and liquidate at year end, guided by volunteer mentors from industry.",
    eligibility:
      "Students aged 15–19; join an existing program location or start one at your school.",
    deadline: "2026-10-10",
    confidence: "estimated",
    cost: "Free to students",
    format: "Weekly evening sessions",
    location: "Greater Toronto Area and regions",
    url: "https://jacentralontario.org/",
  },
  {
    title: "Ivey Summer Leadership Program",
    org: "Ivey Business School, Western University",
    category: "Business",
    grades: [11, 12],
    summary: "Business case-method week on the Ivey campus.",
    description:
      "Students learn the case method, work in learning teams, and get an inside look at how a business degree actually works.",
    eligibility: "Students entering Grade 11 or 12, by application.",
    deadline: "2027-03-31",
    confidence: "estimated",
    cost: "Program fee with residence; bursaries available",
    format: "In person, residential",
    location: "London, Ontario",
    url: "https://www.ivey.uwo.ca/hba/",
  },
  {
    title: "Summer Company Grant",
    org: "Government of Ontario",
    category: "Business",
    grades: [11, 12],
    summary: "Up to $3,000 to start and run your own summer business.",
    description:
      "Students receive start-up funding in two instalments, plus mentoring from a local Small Business Enterprise Centre, in exchange for running a business over the summer.",
    eligibility: "Ontario students aged 15–29 returning to school in the fall.",
    deadline: "2027-05-01",
    confidence: "estimated",
    cost: "Free — this program pays you",
    format: "Self-directed with mentoring",
    location: "Ontario-wide",
    url: "https://www.ontario.ca/page/start-summer-company-students",
  },
  {
    title: "Schulich Summer Business Academy",
    org: "Schulich School of Business, York University",
    category: "Business",
    grades: [10, 11, 12],
    summary: "Week-long introduction to business disciplines taught by Schulich faculty.",
    description:
      "Students rotate through marketing, finance, accounting and strategy sessions and build a final team pitch.",
    eligibility: "Students entering Grades 10–12.",
    deadline: "2027-04-15",
    confidence: "estimated",
    cost: "Program fee; some subsidised seats",
    format: "In person",
    location: "Toronto",
    url: "https://schulich.yorku.ca/",
  },
  {
    title: "Queen's Commerce Business Case Competition for High Schools",
    org: "Smith School of Business, Queen's University",
    category: "Business",
    grades: [11, 12],
    summary: "Team case competition judged by Smith students and alumni.",
    description:
      "Teams receive a business case, prepare a recommendation under time pressure and present to judges, with coaching sessions in between.",
    eligibility: "Teams of three to four senior students with a teacher advisor.",
    deadline: "2026-12-15",
    confidence: "estimated",
    cost: "Team registration fee",
    format: "In person competition",
    location: "Kingston",
    url: "https://smith.queensu.ca/",
  },
  {
    title: "Rotman Commerce Case Competition",
    org: "Rotman Commerce, University of Toronto",
    category: "Business",
    grades: [11, 12],
    summary: "Student-run case competition introducing university-level business analysis.",
    description:
      "High school teams solve a strategy case with mentorship from Rotman Commerce students, then present to a panel of judges.",
    eligibility: "Teams of high school students; check the current year's format.",
    deadline: "2026-11-15",
    confidence: "estimated",
    cost: "Small registration fee",
    format: "In person or hybrid",
    location: "Toronto",
    url: "https://www.rotmancommerce.utoronto.ca/",
  },
  {
    title: "JA Investment Strategies Program",
    org: "Junior Achievement",
    category: "Business",
    grades: [10, 11, 12],
    summary: "One-day workshop on investing, risk and personal finance.",
    description:
      "Volunteer finance professionals run simulations covering markets, portfolios and long-term saving.",
    eligibility: "Any secondary student; often delivered through classes.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "In person workshop",
    location: "Ontario-wide",
    url: "https://jacan.org/",
  },
  {
    title: "Enactus Youth Impact Challenge",
    org: "Enactus Canada",
    category: "Business",
    grades: [11, 12],
    summary: "Social entrepreneurship challenge judged on real community impact.",
    description:
      "Teams design a venture that addresses a social or environmental problem and pitch it for funding and mentorship.",
    eligibility: "Teams of senior students, often with a university Enactus mentor.",
    deadline: "2027-01-31",
    confidence: "estimated",
    cost: "Free",
    format: "Online and in person rounds",
    location: "Canada-wide",
    url: "https://enactus.ca/",
  },
  {
    title: "BMO Diversity Scholarship",
    org: "BMO Financial Group",
    category: "Business",
    grades: [12],
    summary:
      "Scholarship for students from underrepresented communities entering business studies.",
    description:
      "Awards support students from equity-deserving groups entering post-secondary study, with mentorship and internship pathways in some years.",
    eligibility:
      "Graduating students who self-identify with an eligible community; application with essay.",
    deadline: "2027-03-15",
    confidence: "estimated",
    cost: "Free to apply",
    format: "Online application",
    location: "Canada-wide",
    equity: "For students from underrepresented communities",
    url: "https://bmoforwomen.bmo.com/",
  },
  {
    title: "Young Entrepreneurs Ontario Pitch Nights",
    org: "Regional Small Business Enterprise Centres",
    category: "Business",
    grades: [10, 11, 12],
    summary: "Local pitch events with cash prizes for student business ideas.",
    description:
      "Municipal small business centres host pitch nights where student founders present ideas to local judges for seed prizes and mentoring.",
    eligibility: "Ontario students, usually 15+. Check your municipality's centre.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "In person",
    location: "Ontario municipalities",
    url: "https://www.ontario.ca/page/small-business-enterprise-centre-locations",
  },
  {
    title: "TD Future Cities Youth Challenge",
    org: "TD Bank Group",
    category: "Business",
    grades: [9, 10, 11, 12],
    summary: "Community innovation challenge with funding for youth-led projects.",
    description:
      "Youth teams propose a project that makes their city more inclusive or sustainable, with selected ideas receiving grants and coaching.",
    eligibility: "Youth teams, generally aged 14–25.",
    deadline: "2027-02-28",
    confidence: "estimated",
    cost: "Free",
    format: "Online submission",
    location: "Canada-wide",
    url: "https://www.td.com/ca/en/about-td/ready-commitment",
  },
  {
    title: "Ontario Skills Competition — Business and IT Trades",
    org: "Skills Ontario",
    category: "Business",
    grades: [9, 10, 11, 12],
    summary: "Provincial skills contests including web design, IT and job interview skills.",
    description:
      "Students qualify through regional contests and compete provincially, with national team selection for winners.",
    eligibility: "Secondary students registered through their school.",
    deadline: "2027-02-01",
    confidence: "estimated",
    cost: "Free through your school",
    format: "In person competition",
    location: "Toronto",
    url: "https://www.skillsontario.com/",
  },
  {
    title: "Youth Entrepreneurship Summer Accelerator",
    org: "Futurpreneur Canada (youth stream)",
    category: "Business",
    grades: [11, 12],
    summary: "Workshops and mentoring for students building a first venture.",
    description:
      "A structured sequence of business model, finance and marketing workshops, with volunteer mentors and a demo day.",
    eligibility: "Students 16+ with a business idea in progress.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "Online workshops",
    location: "Online",
    url: "https://www.futurpreneur.ca/",
  },

  // ---------- Medicine ----------
  {
    title: "Medical Summer Mentorship Program (MSMP)",
    org: "Temerty Faculty of Medicine, University of Toronto",
    category: "Medicine",
    grades: [11],
    summary: "Four-week mentorship inside U of T's medical school for Grade 11 students.",
    description:
      "Students shadow researchers and clinicians, attend anatomy and skills sessions, and complete a supervised project — one of the most competitive health programs in the province.",
    eligibility:
      "Grade 11 students; priority is given to Indigenous, Black and low-income applicants.",
    deadline: "2027-03-31",
    confidence: "estimated",
    cost: "Free",
    format: "In person",
    location: "Toronto",
    equity: "Priority for Indigenous, Black and low-income students",
    url: "https://temertymedicine.utoronto.ca/",
  },
  {
    title: "SickKids Summer Research Program",
    org: "The Hospital for Sick Children",
    category: "Medicine",
    grades: [11, 12],
    summary: "Paid and volunteer summer research placements in a pediatric research institute.",
    description:
      "Students join a research lab for the summer, contribute to an ongoing project and present findings at a research day.",
    eligibility: "Senior high school students; placements depend on supervisor availability.",
    deadline: "2027-02-01",
    confidence: "estimated",
    cost: "Free; some placements are paid",
    format: "In person lab placement",
    location: "Toronto",
    url: "https://www.sickkids.ca/en/learning/",
  },
  {
    title: "MedQuest",
    org: "Schulich School of Medicine & Dentistry, Western University",
    category: "Medicine",
    grades: [10, 11, 12],
    summary: "Week-long hands-on introduction to medicine and dentistry.",
    description:
      "Students practise clinical skills, tour simulation labs, and hear from medical students about the path into health professions.",
    eligibility: "Students entering Grades 10–12, especially those from rural and remote Ontario.",
    deadline: "2027-04-01",
    confidence: "estimated",
    cost: "Program fee with residence; bursaries available",
    format: "In person, residential",
    location: "London and Windsor",
    url: "https://www.schulich.uwo.ca/",
  },
  {
    title: "Discovery Program in Health Sciences",
    org: "McMaster University",
    category: "Medicine",
    grades: [11, 12],
    summary: "Problem-based learning program modelled on McMaster's health sciences approach.",
    description:
      "Small groups work through health case problems with facilitators, plus lab tours and career panels.",
    eligibility: "Senior students by application.",
    deadline: "2027-04-15",
    confidence: "estimated",
    cost: "Program fee; subsidies available",
    format: "In person",
    location: "Hamilton",
    url: "https://healthsci.mcmaster.ca/",
  },
  {
    title: "Sunnybrook Youth Volunteer Program",
    org: "Sunnybrook Health Sciences Centre",
    category: "Medicine",
    grades: [11, 12],
    summary: "Structured hospital volunteering with patient-facing and support placements.",
    description:
      "Volunteers commit to a regular weekly shift for a set term, with training, and gain genuine hospital exposure and community hours.",
    eligibility:
      "Students 16+ who can commit to a full term; police check and immunisation required.",
    deadline: "2027-03-01",
    confidence: "estimated",
    cost: "Free; small cost for screening requirements",
    format: "In person volunteering",
    location: "Toronto",
    url: "https://sunnybrook.ca/volunteer/",
  },
  {
    title: "UHN Youth Volunteer Placements",
    org: "University Health Network",
    category: "Medicine",
    grades: [11, 12],
    summary: "Volunteer roles across Toronto General, Toronto Western and Princess Margaret.",
    description:
      "Placements range from patient wayfinding to unit support, with orientation and supervision.",
    eligibility: "Students 16+ with a minimum commitment of several months.",
    deadline: "2027-02-15",
    confidence: "estimated",
    cost: "Free; screening costs apply",
    format: "In person volunteering",
    location: "Toronto",
    url: "https://www.uhn.ca/corporate/Volunteer",
  },
  {
    title: "HOSA Canada Future Health Professionals",
    org: "HOSA Canada",
    category: "Medicine",
    grades: [9, 10, 11, 12],
    summary: "Health science competitions covering clinical knowledge and skills events.",
    description:
      "Students compete in events such as medical terminology, first aid, public health and health career display, advancing to an international conference.",
    eligibility: "Students at a school with a HOSA chapter, or start one.",
    deadline: "2026-12-15",
    confidence: "estimated",
    cost: "Membership plus conference fees",
    format: "In person conference",
    location: "Canada and international",
    url: "https://hosacanada.org/",
  },
  {
    title: "Ottawa Hospital Youth Volunteer Program",
    org: "The Ottawa Hospital",
    category: "Medicine",
    grades: [11, 12],
    summary: "Summer and school-year volunteer placements in an academic hospital.",
    description:
      "Students support patient services, clinics and hospital wayfinding under staff supervision.",
    eligibility: "Students 16+ living in the Ottawa region.",
    deadline: "2027-03-15",
    confidence: "estimated",
    cost: "Free; screening costs apply",
    format: "In person volunteering",
    location: "Ottawa",
    url: "https://www.ottawahospital.on.ca/",
  },
  {
    title: "Black Youth in Medicine Mentorship",
    org: "Black Physicians of Canada",
    category: "Medicine",
    grades: [10, 11, 12],
    summary: "Mentorship pairing Black high school students with physicians and med students.",
    description:
      "Monthly mentorship sessions, application guidance and clinical exposure days aimed at widening the path into medicine.",
    eligibility: "Black-identifying high school students across Canada.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "Online with in person events",
    location: "Canada-wide",
    equity: "For Black-identifying students",
    url: "https://blackphysicians.ca/",
  },
  {
    title: "Health Sciences Summer Camp",
    org: "Queen's University Faculty of Health Sciences",
    category: "Medicine",
    grades: [10, 11, 12],
    summary: "Summer camp covering anatomy, physiology and clinical simulation.",
    description:
      "Campers use simulation labs and anatomy resources normally reserved for university students, with mentorship from health science students.",
    eligibility: "Students entering Grades 10–12.",
    deadline: "2027-04-30",
    confidence: "estimated",
    cost: "Weekly fee; bursaries available",
    format: "In person",
    location: "Kingston",
    url: "https://healthsci.queensu.ca/",
  },
  {
    title: "Youth Mental Health Ambassadors",
    org: "Jack.org",
    category: "Medicine",
    grades: [9, 10, 11, 12],
    summary: "Training to run mental health talks and chapters in your own school.",
    description:
      "Students are trained to deliver peer mental health presentations and to run a school chapter, with a national summit for active members.",
    eligibility: "Any secondary student; training cohorts run through the year.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "Online training plus school chapter",
    location: "Ontario-wide",
    url: "https://jack.org/",
  },
  {
    title: "St. John Ambulance Youth Medical First Responder",
    org: "St. John Ambulance Ontario",
    category: "Medicine",
    grades: [10, 11, 12],
    summary: "Certified first aid training plus volunteer event medical coverage.",
    description:
      "Youth members train in first aid and provide medical coverage at community events, logging substantial volunteer hours.",
    eligibility: "Students 16+ who complete the required training.",
    deadline: null,
    confidence: "unposted",
    cost: "Training fees, sometimes subsidised",
    format: "In person training and shifts",
    location: "Ontario-wide",
    url: "https://sja.ca/",
  },

  // ---------- Law & Civics ----------
  {
    title: "Ontario High School Model Parliament",
    org: "Ontario Legislative Assembly partners",
    category: "Law & Civics",
    grades: [10, 11, 12],
    summary: "Debate real bills in the provincial legislative chamber.",
    description:
      "Student delegates take on party and cabinet roles, debate legislation in committee, and sit in the Legislative Assembly chamber at Queen's Park.",
    eligibility: "Students in Grades 10–12 selected through an application and school endorsement.",
    deadline: "2026-10-04",
    confidence: "confirmed",
    cost: "Delegate fee; subsidies available",
    format: "In person",
    location: "Queen's Park, Toronto",
    url: "https://www.ola.org/",
  },
  {
    title: "CAIMUN Delegate Registration",
    org: "Canada International Model United Nations",
    category: "Law & Civics",
    grades: [9, 10, 11, 12],
    summary: "Large national Model UN conference with committees for all experience levels.",
    description:
      "Delegates research a country position, debate in committee, and draft resolutions over a multi-day conference.",
    eligibility: "Any secondary student; register as a delegation or individually.",
    deadline: "2027-02-04",
    confidence: "confirmed",
    cost: "Delegate fee plus travel",
    format: "In person conference",
    location: "Canada",
    url: "https://www.caimun.org/",
  },
  {
    title: "Forum for Young Canadians",
    org: "Foundation for the Study of Processes of Government in Canada",
    category: "Law & Civics",
    grades: [11, 12],
    summary: "A week inside federal politics in Ottawa with MPs, senators and public servants.",
    description:
      "Participants meet parliamentarians, tour federal institutions and run a simulation of the legislative process.",
    eligibility: "Students aged 15–19 from across Canada.",
    deadline: "2026-10-31",
    confidence: "estimated",
    cost: "Program fee; substantial bursaries available",
    format: "In person, residential",
    location: "Ottawa",
    url: "https://forum.ca/",
  },
  {
    title: "Encounters with Canada",
    org: "Historica Canada",
    category: "Law & Civics",
    grades: [9, 10, 11, 12],
    summary: "Themed weeks in Ottawa on law, medicine, journalism, science and more.",
    description:
      "Students from across the country spend a week on a career theme, with site visits, workshops and a national youth network.",
    eligibility: "Students aged 14–17.",
    deadline: null,
    confidence: "unposted",
    cost: "Weekly fee; bursaries available",
    format: "In person, residential",
    location: "Ottawa",
    url: "https://www.ewc-rdc.ca/",
  },
  {
    title: "Mock Trial Tournament",
    org: "Ontario Justice Education Network",
    category: "Law & Civics",
    grades: [10, 11, 12],
    summary: "Argue a criminal case in a real courtroom with lawyer coaches.",
    description:
      "School teams prepare a full case, take on counsel and witness roles, and compete before sitting judges and lawyers.",
    eligibility: "School teams with a teacher sponsor; OJEN pairs teams with lawyer coaches.",
    deadline: "2026-11-30",
    confidence: "estimated",
    cost: "Free",
    format: "In person courtroom rounds",
    location: "Ontario regions",
    url: "https://ojen.ca/",
  },
  {
    title: "Ontario Student Debating Championships",
    org: "Ontario Student Debating Union",
    category: "Law & Civics",
    grades: [9, 10, 11, 12],
    summary: "Provincial debate championships with junior and senior divisions.",
    description:
      "Students debate prepared and impromptu resolutions across several rounds, with top debaters selected for national and world teams.",
    eligibility: "Students registered through a school debate club.",
    deadline: "2027-01-15",
    confidence: "estimated",
    cost: "Registration fee",
    format: "In person tournament",
    location: "Ontario-wide",
    url: "https://osdu.ca/",
  },
  {
    title: "Youth Parliament of Ontario",
    org: "Youth Parliament of Ontario",
    category: "Law & Civics",
    grades: [11, 12],
    summary: "Student-run parliamentary simulation held over the winter break.",
    description:
      "Members write and debate their own bills in a full parliamentary session, with committees, party caucuses and a speaker.",
    eligibility: "Youth aged 15–21.",
    deadline: "2026-11-15",
    confidence: "estimated",
    cost: "Session fee; subsidies available",
    format: "In person, residential",
    location: "Ontario",
    url: "https://www.youthparliament.ca/",
  },
  {
    title: "Osgoode Youth Law Outreach Program",
    org: "Osgoode Hall Law School, York University",
    category: "Law & Civics",
    grades: [10, 11, 12],
    summary: "Workshops introducing legal reasoning and the path to law school.",
    description:
      "Law students run sessions on rights, legal careers and case analysis, with outreach targeted at communities underrepresented in law.",
    eligibility: "Secondary students; some streams prioritise equity-deserving applicants.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "In person and online workshops",
    location: "Toronto",
    equity: "Streams prioritise students underrepresented in law",
    url: "https://www.osgoode.yorku.ca/",
  },
  {
    title: "Toronto Model United Nations",
    org: "TMUN",
    category: "Law & Civics",
    grades: [9, 10, 11, 12],
    summary: "Regional Model UN conference with beginner-friendly committees.",
    description:
      "A weekend of committee debate and crisis simulations run by experienced student staff.",
    eligibility: "Any secondary student, individually or as a school delegation.",
    deadline: "2026-11-20",
    confidence: "estimated",
    cost: "Delegate fee",
    format: "In person conference",
    location: "Toronto",
    url: "https://www.tmun.ca/",
  },
  {
    title: "Ontario Legislature Page Program",
    org: "Legislative Assembly of Ontario",
    category: "Law & Civics",
    grades: [9],
    summary: "Serve in the Legislative Assembly chamber for a sitting period.",
    description:
      "Pages deliver messages and support members during House proceedings, and learn parliamentary procedure from the inside.",
    eligibility:
      "Students in Grades 7–8 and early secondary depending on the intake; strong academic standing required.",
    deadline: "2027-01-31",
    confidence: "estimated",
    cost: "Free; a stipend is paid",
    format: "In person",
    location: "Queen's Park, Toronto",
    url: "https://www.ola.org/en/visit-learn/page-program",
  },
  {
    title: "Canadian Student Debating Federation Nationals",
    org: "CSDF",
    category: "Law & Civics",
    grades: [10, 11, 12],
    summary: "National debating championship with provincial team selection.",
    description:
      "Provincial teams debate in English and French divisions, with selection to international competitions.",
    eligibility: "Students selected to represent Ontario at provincial trials.",
    deadline: "2027-02-28",
    confidence: "estimated",
    cost: "Team fees; often subsidised",
    format: "In person tournament",
    location: "Rotating host province",
    url: "https://www.csdf-fcde.ca/",
  },
  {
    title: "Youth Advisory Council — City of Toronto",
    org: "City of Toronto",
    category: "Law & Civics",
    grades: [10, 11, 12],
    summary: "Advise city divisions on policy that affects young residents.",
    description:
      "Members meet regularly, consult with city staff and contribute recommendations to municipal programs and budgets.",
    eligibility: "Toronto residents aged 13–24.",
    deadline: "2026-09-30",
    confidence: "estimated",
    cost: "Free",
    format: "Hybrid meetings",
    location: "Toronto",
    url: "https://www.toronto.ca/community-people/get-involved/",
  },

  // ---------- Leadership ----------
  {
    title: "Duke of Edinburgh's International Award",
    org: "The Duke of Edinburgh's International Award — Canada",
    category: "Leadership",
    grades: [9, 10, 11, 12],
    summary: "Self-directed award across service, skill, fitness and an adventurous journey.",
    description:
      "Participants set goals in four areas and log progress toward Bronze, Silver and Gold levels. Gold is presented at a ceremony and is widely recognised on applications.",
    eligibility: "Youth aged 14–24. Register through your school or an award unit.",
    deadline: null,
    confidence: "unposted",
    cost: "Registration fee, often covered by schools",
    format: "Self-directed",
    location: "Ontario-wide",
    url: "https://www.dukeofed.org/",
  },
  {
    title: "Loran Scholars Award",
    org: "Loran Scholars Foundation",
    category: "Leadership",
    grades: [12],
    summary: "Canada's largest undergraduate award for character, service and leadership.",
    description:
      "A four-year award worth roughly $100,000 including tuition waiver, stipend, summer internships and mentorship. Selection focuses on character rather than marks alone.",
    eligibility: "Graduating students entering a partner university, with a minimum 85% average.",
    deadline: "2026-10-14",
    confidence: "confirmed",
    cost: "Free to apply",
    format: "Written application plus interviews",
    location: "Canada-wide",
    url: "https://loranscholar.ca/",
  },
  {
    title: "Schulich Leader Scholarships",
    org: "Schulich Foundation",
    category: "Leadership",
    grades: [12],
    summary: "Major STEM entrance scholarships worth up to $120,000.",
    description:
      "Each high school may nominate one student; nominees apply to participating Canadian universities for engineering, science, technology or math programs.",
    eligibility:
      "Graduating students nominated by their school, entering an eligible STEM program.",
    deadline: "2027-01-24",
    confidence: "estimated",
    cost: "Free to apply",
    format: "School nomination plus application",
    location: "Canada-wide",
    url: "https://schulichleaders.com/",
  },
  {
    title: "TD Scholarships for Community Leadership",
    org: "TD Bank Group",
    category: "Leadership",
    grades: [12],
    summary: "Up to $70,000 for students with an outstanding community impact record.",
    description:
      "Awards cover tuition and living expenses, plus summer employment opportunities and peer networking.",
    eligibility: "Graduating students with a sustained community leadership record.",
    deadline: "2026-11-15",
    confidence: "estimated",
    cost: "Free to apply",
    format: "Online application",
    location: "Canada-wide",
    url: "https://www.td.com/ca/en/about-td/ready-commitment/scholarship-for-community-leadership",
  },
  {
    title: "Terry Fox Humanitarian Award",
    org: "Terry Fox Humanitarian Award Program",
    category: "Leadership",
    grades: [12],
    summary: "Award recognising humanitarian service alongside academics and courage.",
    description:
      "Recipients receive renewable funding across their undergraduate degree and join an alumni network of community volunteers.",
    eligibility: "Graduating students entering a Canadian post-secondary institution.",
    deadline: "2027-02-01",
    confidence: "estimated",
    cost: "Free to apply",
    format: "Online application",
    location: "Canada-wide",
    url: "https://terryfoxawards.ca/",
  },
  {
    title: "Indspire Building Brighter Futures Bursaries",
    org: "Indspire",
    category: "Leadership",
    grades: [12],
    summary: "Bursaries and scholarships for First Nations, Inuit and Métis students.",
    description:
      "Financial awards for post-secondary study, plus mentorship and career resources through Indspire's student network.",
    eligibility:
      "First Nations, Inuit and Métis students entering or continuing post-secondary study.",
    deadline: "2026-11-01",
    confidence: "estimated",
    cost: "Free to apply",
    format: "Online application",
    location: "Canada-wide",
    equity: "For First Nations, Inuit and Métis students",
    url: "https://indspire.ca/",
  },
  {
    title: "BlackNorth Initiative Youth Scholarship",
    org: "BlackNorth Initiative",
    category: "Leadership",
    grades: [12],
    summary: "Scholarships and mentorship for Black students entering post-secondary study.",
    description: "Financial awards paired with corporate mentorship and internship pathways.",
    eligibility: "Black-identifying graduating students across Canada.",
    deadline: "2027-04-30",
    confidence: "estimated",
    cost: "Free to apply",
    format: "Online application",
    location: "Canada-wide",
    equity: "For Black-identifying students",
    url: "https://blacknorth.ca/",
  },
  {
    title: "Rotary Youth Leadership Awards (RYLA)",
    org: "Rotary District Ontario",
    category: "Leadership",
    grades: [10, 11, 12],
    summary: "Weekend leadership camp sponsored by your local Rotary club.",
    description:
      "Workshops on public speaking, teamwork and community project planning, with a local club covering most or all costs.",
    eligibility: "Students nominated or sponsored by a local Rotary club.",
    deadline: "2027-02-15",
    confidence: "estimated",
    cost: "Usually fully sponsored",
    format: "In person, residential",
    location: "Ontario districts",
    url: "https://www.rotary.org/en/our-programs/rotary-youth-leadership-awards",
  },
  {
    title: "Ontario Student Trustees' Association Leadership Congress",
    org: "OSTA-AECO",
    category: "Leadership",
    grades: [10, 11, 12],
    summary: "Provincial gathering for student leaders and aspiring student trustees.",
    description:
      "Delegates learn education policy, advocacy and board governance, and build a provincial network of student leaders.",
    eligibility: "Secondary students, often delegated by a school or board student council.",
    deadline: "2026-10-20",
    confidence: "estimated",
    cost: "Delegate fee, frequently covered by boards",
    format: "In person conference",
    location: "Ontario",
    url: "https://www.osta-aeco.org/",
  },
  {
    title: "Canadian Cadet Program",
    org: "Department of National Defence",
    category: "Leadership",
    grades: [9, 10, 11, 12],
    summary: "Year-round leadership training with paid summer courses.",
    description:
      "Cadets train weekly in leadership, fitness and specialty skills such as aviation or sailing, and can attend paid multi-week summer training.",
    eligibility: "Youth aged 12–18. Join a local squadron or corps.",
    deadline: null,
    confidence: "unposted",
    cost: "Free; summer courses pay a training allowance",
    format: "Weekly in person",
    location: "Ontario-wide",
    url: "https://www.canada.ca/en/department-national-defence/services/cadets-junior-canadian-rangers.html",
  },
  {
    title: "YMCA Youth Exchanges Canada",
    org: "YMCA Canada",
    category: "Leadership",
    grades: [9, 10, 11, 12],
    summary: "Fully funded reciprocal exchange with a youth group elsewhere in Canada.",
    description:
      "Groups twin with another community, host each other for a week, and complete community service and cultural activities together.",
    eligibility: "Groups of youth aged 12–17 with adult leaders.",
    deadline: "2026-12-01",
    confidence: "estimated",
    cost: "Travel and program costs are funded",
    format: "In person travel exchange",
    location: "Canada-wide",
    url: "https://ymca.ca/",
  },
  {
    title: "Camp Leader-in-Training Programs",
    org: "Ontario Camps Association members",
    category: "Leadership",
    grades: [10, 11],
    summary: "LIT and CIT summers that lead directly into paid counsellor jobs.",
    description:
      "Structured leadership training at accredited camps covering child development, risk management and program planning, often with certification.",
    eligibility: "Students typically aged 15–17.",
    deadline: "2027-03-01",
    confidence: "estimated",
    cost: "Session fees; many camps offer subsidies",
    format: "In person, residential or day",
    location: "Ontario-wide",
    url: "https://ontariocamps.ca/",
  },
  {
    title: "Canada Summer Jobs — Student Positions",
    org: "Employment and Social Development Canada",
    category: "Leadership",
    grades: [11, 12],
    summary: "Government-funded paid summer jobs posted by local employers.",
    description:
      "Thousands of subsidised summer positions with non-profits, small businesses and public organisations, searchable by community.",
    eligibility: "Students aged 15–30 legally entitled to work in Canada.",
    deadline: "2027-05-15",
    confidence: "estimated",
    cost: "Free — these are paid positions",
    format: "Paid employment",
    location: "Ontario-wide",
    url: "https://www.jobbank.gc.ca/youth",
  },
  {
    title: "City of Toronto Youth Employment Programs",
    org: "City of Toronto",
    category: "Leadership",
    grades: [10, 11, 12],
    summary: "Paid municipal summer roles in recreation, parks and community services.",
    description:
      "Includes camp counsellor, swim instructor and community programming roles, with certification support for some positions.",
    eligibility: "Toronto youth, generally 15+; certification required for aquatics roles.",
    deadline: "2027-02-28",
    confidence: "estimated",
    cost: "Free — these are paid positions",
    format: "Paid employment",
    location: "Toronto",
    url: "https://www.toronto.ca/community-people/employment-social-support/employment-support/",
  },
  {
    title: "Indigenous Youth Roots Programs",
    org: "Indigenous Youth Roots",
    category: "Leadership",
    grades: [10, 11, 12],
    summary: "Grants, gatherings and leadership programs for Indigenous youth.",
    description:
      "Youth-led project grants, national gatherings and reconciliation education programs designed and delivered by Indigenous youth.",
    eligibility: "First Nations, Inuit and Métis youth aged 14–29.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "Online and in person",
    location: "Canada-wide",
    equity: "For First Nations, Inuit and Métis youth",
    url: "https://indigenousyouthroots.ca/",
  },
  {
    title: "Horatio Alger Canadian Scholarships",
    org: "Horatio Alger Association of Canada",
    category: "Leadership",
    grades: [12],
    summary: "Need-based scholarships for students who have overcome adversity.",
    description:
      "Awards for students with significant financial need and a record of perseverance, plus access to alumni programs.",
    eligibility:
      "Graduating students with demonstrated financial need entering Canadian post-secondary study.",
    deadline: "2027-03-15",
    confidence: "estimated",
    cost: "Free to apply",
    format: "Online application",
    location: "Canada-wide",
    equity: "For students facing significant financial adversity",
    url: "https://horatioalger.ca/",
  },

  // ---------- Arts ----------
  {
    title: "National Youth Orchestra of Canada Summer Institute",
    org: "National Youth Orchestra of Canada",
    category: "Arts",
    grades: [11, 12],
    summary: "Intensive orchestral training and a national tour for advanced musicians.",
    description:
      "Selected musicians spend weeks in training with professional coaches before touring major concert halls.",
    eligibility: "Advanced classical musicians aged 16–28, by audition.",
    deadline: "2026-11-30",
    confidence: "estimated",
    cost: "Tuition covered; participants fundraise a contribution",
    format: "In person, residential",
    location: "Canada-wide tour",
    url: "https://nyoc.org/",
  },
  {
    title: "Ontario Youth Choir",
    org: "Choirs Ontario",
    category: "Arts",
    grades: [11, 12],
    summary: "Provincial choir residency and concert tour each summer.",
    description:
      "Singers rehearse intensively with a guest conductor and perform a short tour of Ontario venues.",
    eligibility: "Singers aged 16–25, by recorded audition.",
    deadline: "2027-03-31",
    confidence: "estimated",
    cost: "Participation fee; bursaries available",
    format: "In person, residential",
    location: "Ontario",
    url: "https://choirsontario.org/",
  },
  {
    title: "Sheridan Summer Arts Programs",
    org: "Sheridan College",
    category: "Arts",
    grades: [10, 11, 12],
    summary: "Portfolio-building courses in animation, illustration and design.",
    description:
      "Students build studio work under Sheridan faculty — useful for competitive art and animation program portfolios.",
    eligibility: "Students entering Grades 10–12.",
    deadline: "2027-05-01",
    confidence: "estimated",
    cost: "Course fees",
    format: "In person and online",
    location: "Oakville and Brampton",
    url: "https://www.sheridancollege.ca/",
  },
  {
    title: "OCAD U Summer Studio for Teens",
    org: "OCAD University",
    category: "Arts",
    grades: [10, 11, 12],
    summary: "Studio intensives across drawing, digital media and design thinking.",
    description:
      "Small studio classes taught by practising artists, ending with a portfolio review session.",
    eligibility: "Students aged 15–18.",
    deadline: "2027-04-30",
    confidence: "estimated",
    cost: "Course fees; some bursaries",
    format: "In person studio",
    location: "Toronto",
    url: "https://www.ocadu.ca/",
  },
  {
    title: "National Theatre School Drama Festival",
    org: "National Theatre School of Canada",
    category: "Arts",
    grades: [9, 10, 11, 12],
    summary: "School theatre festival with regional showcases and a national final.",
    description:
      "School productions are performed for adjudicators, with feedback workshops and selection to regional and national showcases.",
    eligibility: "School drama programs and student companies.",
    deadline: "2027-01-31",
    confidence: "estimated",
    cost: "Entry fee per production",
    format: "In person festival",
    location: "Ontario regions",
    url: "https://ent-nts.ca/en/national-theatre-school-drama-festival/",
  },
  {
    title: "Canadian Improv Games — Ontario Regionals",
    org: "Canadian Improv Games",
    category: "Arts",
    grades: [9, 10, 11, 12],
    summary: "Team improv tournament running from school regionals to a national final.",
    description:
      "Teams train through the fall, compete in regional tournaments in the winter, and the top team per region heads to the national festival.",
    eligibility: "School teams with a teacher sponsor.",
    deadline: "2026-11-15",
    confidence: "estimated",
    cost: "Team registration fee",
    format: "In person tournament",
    location: "Ontario regions",
    url: "https://improv.ca/",
  },
  {
    title: "Toronto Youth Shorts Film Festival",
    org: "Toronto Youth Shorts",
    category: "Arts",
    grades: [9, 10, 11, 12],
    summary: "Submit a short film and screen it in a real Toronto cinema.",
    description:
      "An annual festival showcasing films by youth filmmakers, with Q&A panels and industry networking for selected creators.",
    eligibility: "Ontario filmmakers aged 12–29.",
    deadline: "2027-05-30",
    confidence: "estimated",
    cost: "Small submission fee",
    format: "Film submission plus screening",
    location: "Toronto",
    url: "https://torontoyouthshorts.ca/",
  },
  {
    title: "Polar Expressions Student Writing Contest",
    org: "Polar Expressions Publishing",
    category: "Arts",
    grades: [9, 10, 11, 12],
    summary: "National short story and poetry contest with print publication.",
    description:
      "Selected entries are published in an anthology, with cash prizes for category winners.",
    eligibility: "Any Canadian student; entries submitted individually or through a class.",
    deadline: "2027-02-15",
    confidence: "estimated",
    cost: "Free",
    format: "Online submission",
    location: "Canada-wide",
    url: "https://www.polarexpressions.ca/",
  },
  {
    title: "Toronto Youth Poetry Slam",
    org: "Toronto Poetry Slam",
    category: "Arts",
    grades: [9, 10, 11, 12],
    summary: "Monthly spoken word slams and a youth team selection series.",
    description:
      "Youth poets perform original work at monthly slams, with workshops and selection for a youth team competing nationally.",
    eligibility: "Youth poets under 19.",
    deadline: null,
    confidence: "unposted",
    cost: "Free or pay-what-you-can",
    format: "In person performance",
    location: "Toronto",
    url: "https://torontopoetryslam.com/",
  },
  {
    title: "SKETCH Working Arts Studio Programs",
    org: "SKETCH",
    category: "Arts",
    grades: [10, 11, 12],
    summary: "Free arts studios and paid creative work for youth facing barriers.",
    description:
      "Studio access, artist mentorship and paid creative enterprise opportunities for young people experiencing homelessness, poverty or marginalisation.",
    eligibility: "Youth aged 16–29 experiencing barriers such as poverty or housing instability.",
    deadline: null,
    confidence: "unposted",
    cost: "Free, with meals and materials provided",
    format: "In person studio",
    location: "Toronto",
    equity: "For youth facing poverty, homelessness or marginalisation",
    url: "https://www.sketch.ca/",
  },
  {
    title: "Nia Centre Young Creators Program",
    org: "Nia Centre for the Arts",
    category: "Arts",
    grades: [9, 10, 11, 12],
    summary: "Arts training and showcase opportunities for Black youth creators.",
    description:
      "Workshops in music, visual art, film and curation led by Black artists, plus paid opportunities and showcases.",
    eligibility: "Black-identifying youth in the Toronto area.",
    deadline: "2026-10-15",
    confidence: "estimated",
    cost: "Free",
    format: "In person",
    location: "Toronto",
    equity: "For Black-identifying youth",
    url: "https://niacentre.org/",
  },
  {
    title: "Royal Conservatory Young Artists Performance Academy Audition",
    org: "The Royal Conservatory of Music",
    category: "Arts",
    grades: [9, 10, 11, 12],
    summary: "Pre-professional classical music training alongside high school.",
    description:
      "Selected young musicians study with Conservatory faculty in a structured academy program with performance opportunities.",
    eligibility: "Advanced musicians by audition, typically aged 10–18.",
    deadline: "2027-03-01",
    confidence: "estimated",
    cost: "Tuition with scholarship support available",
    format: "In person",
    location: "Toronto",
    url: "https://rcmusic.com/",
  },
  {
    title: "Ontario Arts Council Youth-Focused Grants",
    org: "Ontario Arts Council",
    category: "Arts",
    grades: [11, 12],
    summary: "Project grants that fund youth-led arts initiatives.",
    description:
      "Funding streams support arts projects in schools and communities, often accessed with an adult or organisational partner.",
    eligibility: "Ontario residents; some streams require a partner organisation.",
    deadline: null,
    confidence: "unposted",
    cost: "Free to apply",
    format: "Online application",
    location: "Ontario-wide",
    url: "https://www.arts.on.ca/",
  },
  {
    title: "Doors Open Youth Photography Contest",
    org: "Ontario Heritage Trust",
    category: "Arts",
    grades: [9, 10, 11, 12],
    summary: "Photography contest documenting heritage sites across Ontario.",
    description:
      "Students submit photographs taken at participating heritage sites, with winning images exhibited and published.",
    eligibility: "Ontario students under 19.",
    deadline: "2026-10-31",
    confidence: "estimated",
    cost: "Free",
    format: "Online submission",
    location: "Ontario-wide",
    url: "https://www.heritagetrust.on.ca/",
  },

  // ---------- Recovered from the 2026-2027 tracker spreadsheet ----------
  // Content below is carried over from the original hand-researched tracker.
  // Where the spreadsheet recorded a real date from a previous cycle, it is
  // carried forward as "estimated". Where it said TBA, rolling, or posting
  // dependent, the deadline is null and the entry is marked "unposted".

  // ---------- Waterloo Region / local ----------
  {
    title: "Kitchener Youth Action Council (KYAC)",
    org: "City of Kitchener",
    category: "Leadership",
    grades: [9, 10, 11, 12],
    summary:
      "City advisory council where Kitchener youth shape initiatives and advise council on youth issues.",
    description:
      "Members share ideas, plan initiatives and give the City input on issues affecting young people. Weekly Thursday evening meetings, and an interview follows the written application. Recruitment for the 2026–27 cohort opened 4 August 2026 and closed 10 August 2026; the date shown is the same early-August window projected forward to the next cohort.",
    eligibility:
      "Ages 14–24 who live, attend school, work or take part in recreation in Kitchener. Interview and regular in-person meeting attendance required.",
    deadline: "2027-08-09",
    confidence: "estimated",
    cost: "Free",
    format: "Youth advisory council",
    location: "Kitchener",
    url: "https://www.kitchener.ca/council-and-city-administration/civic-engagement/leadership-development/kitchener-youth-action-council/",
  },
  {
    title: "Kitchener Youth Crew",
    org: "City of Kitchener",
    category: "Leadership",
    grades: [9, 10, 11],
    summary:
      "Volunteer at city youth drop-ins and community activities while earning service hours.",
    description:
      "Youth help run drop-in programs and community activities, gaining leadership experience and community-service hours. Intake is ongoing rather than a single deadline — ask at a Kitchener youth drop-in location.",
    eligibility:
      "Ages 12–17, able to attend the assigned Kitchener location. A parent or guardian form may be required for minors.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "Volunteer leadership placement",
    location: "Kitchener",
    url: "https://www.kitchener.ca/council-and-city-administration/civic-engagement/leadership-development/kitchener-youth-crew/",
  },
  {
    title: "Kitchener BYLD Program",
    org: "City of Kitchener",
    category: "Leadership",
    grades: [9, 10],
    summary:
      "Leadership training plus an optional recreation placement that earns volunteer hours.",
    description:
      "Combines leadership training and teamwork with an optional placement in a city recreation program, including a holiday-break camp placement. Registration opens to Kitchener residents first and runs until the program fills, so there is no fixed closing date.",
    eligibility:
      "Ages 12–15. Kitchener residents normally get earlier registration access. Placement attendance is required to earn the volunteer hours.",
    deadline: null,
    confidence: "unposted",
    cost: "Registration fee — check the current City of Kitchener program listing",
    format: "Leadership training and placement",
    location: "Kitchener",
    url: "https://www.kitchener.ca/recreation-and-sports/children-and-youth-programs/summer-programs/byld-program/",
  },
  {
    title: "Kitchener Parks Youth Engagement Committee",
    org: "City of Kitchener",
    category: "Leadership",
    grades: [9, 10, 11, 12],
    summary:
      "Youth committee advising the city on parks, recreation spaces and community planning.",
    description:
      "Members give a youth perspective on parks and community planning through monthly meetings and outdoor activities. Recruitment runs annually in April; the 2026 intake closed 3 May, which is the date carried forward here.",
    eligibility:
      "Ages 14–18 who live in Kitchener and can attend recurring meetings and outdoor community activities.",
    deadline: "2027-05-03",
    confidence: "estimated",
    cost: "Free",
    format: "Youth advisory committee",
    location: "Kitchener",
    url: "https://www.kitchener.ca/council-and-city-administration/civic-engagement/leadership-development/parks-youth-engagement-committee/",
  },
  {
    title: "City of Kitchener Summer Student Jobs",
    org: "City of Kitchener",
    category: "Leadership",
    grades: [10, 11, 12],
    summary: "Paid municipal summer roles in recreation, camps, parks and administration.",
    description:
      "Paid seasonal positions across city recreation, camps, parks, operations and community programs. Postings appear individually rather than on one common deadline, so set up a city job profile and get certifications in place early.",
    eligibility:
      "Job-specific age, certification, availability, driver's licence and work-authorisation requirements. Some recreation roles require First Aid.",
    deadline: null,
    confidence: "unposted",
    cost: "Paid",
    format: "Paid summer employment",
    location: "Kitchener",
    url: "https://www.kitchener.ca/council-and-city-administration/jobs-and-volunteering/find-a-job/",
  },
  {
    title: "City of Waterloo Student Jobs",
    org: "City of Waterloo",
    category: "Leadership",
    grades: [10, 11, 12],
    summary: "Paid seasonal roles in camps, aquatics, parks, facilities and administration.",
    description:
      "Paid seasonal municipal work suited to secondary and post-secondary students. Aquatics and camp roles often recruit earlier than other summer positions, so watch postings from mid-winter.",
    eligibility:
      "Job-specific age, certification, work authorisation, schedule and transportation requirements.",
    deadline: null,
    confidence: "unposted",
    cost: "Paid",
    format: "Paid summer employment",
    location: "Waterloo",
    url: "https://www.waterloo.ca/en/government/jobs.aspx",
  },
  {
    title: "Immerse Education — Waterloo Summer Programs",
    org: "Immerse Education (commercial provider)",
    category: "Leadership",
    grades: [9, 10, 11, 12],
    summary:
      "Fee-based academic summer program hosted on a Waterloo campus, run independently of the university.",
    description:
      "Subject-focused classes with a campus-style residential experience. Important: this is a private commercial provider, not a University of Waterloo program, despite the campus setting. Admission is rolling until courses fill.",
    eligibility:
      "High-school students; course-specific. Confirm age, English proficiency, visa and travel needs, accommodation and the exact host-campus relationship before paying.",
    deadline: null,
    confidence: "unposted",
    cost: "Paid commercial program — review the cost against the value carefully",
    format: "Paid academic summer program",
    location: "Waterloo",
    url: "https://www.immerse.education/study-abroad/canada/university-of-waterloo-summer-programs-high-school-students/",
  },

  // ---------- Business ----------
  {
    title: "Prosper Ontario Case Competition",
    org: "Prosper Ontario",
    category: "Business",
    grades: [9, 10, 11, 12],
    summary: "Student-run business case competition where teams present recommendations to judges.",
    description:
      "Teams analyse a real company problem and pitch practical recommendations to a judging panel. The 2026 event ran on 4 April; the 2027 cycle has not been announced. Registering early has historically avoided a late fee.",
    eligibility:
      "High-school teams, usually up to five students, often with a teacher advisor. Confirm team size, Ontario residency and school affiliation for the current cycle.",
    deadline: null,
    confidence: "unposted",
    cost: "Registration fee — early registration is cheaper",
    format: "Business case competition",
    location: "Ontario",
    url: "https://www.prosperontario.org/",
  },
  {
    title: "Prosper Ontario Executive Team",
    org: "Prosper Ontario",
    category: "Business",
    grades: [10, 11, 12],
    summary:
      "Student leadership role organising the competition — operations, marketing, outreach or sponsorship.",
    description:
      "A year-long student executive position helping run the Prosper Ontario competition. Hiring for 2026 is closed; the organisation says to watch for 2027 news, typically announced late in the calendar year.",
    eligibility:
      "High-school students. Role-specific — prior business, case-competition, marketing or event-planning experience helps, and the commitment runs through the school year.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "Student executive role",
    location: "Ontario",
    url: "https://www.prosperontario.org/faq",
  },
  {
    title: "Wharton Global High School Investment Competition",
    org: "The Wharton School, University of Pennsylvania",
    category: "Business",
    grades: [9, 10, 11, 12],
    summary:
      "School teams build and defend an investment strategy for a real client over a full trading period.",
    description:
      "Teams manage a simulated portfolio for a fictional client and defend their strategy in writing, with finalists presenting at Wharton. Registration opens in August each year; the official site confirms the August opening but has not posted the closing date for this cycle.",
    eligibility:
      "Grades 9–12 in teams of four to seven from the same high school, with one teacher advisor. Students cannot enter independently.",
    deadline: null,
    confidence: "unposted",
    cost: "Free to enter",
    format: "Online team investment competition",
    location: "Online",
    url: "https://globalyouth.wharton.upenn.edu/competitions/investment-competition/",
  },
  {
    title: "DMZ Basecamp",
    org: "DMZ, Toronto Metropolitan University",
    category: "Business",
    grades: [9, 10, 11, 12],
    summary: "Entrepreneurship bootcamp where students build a startup idea and pitch it.",
    description:
      "Students develop startup ideas, learn business fundamentals and pitch at the end of the program, run out of one of Canada's best-known startup incubators. Confirm whether the coming cohort is free and whether commuting into Toronto is required.",
    eligibility:
      "High-school students; access to the GTA may be needed. Competitive or registration-based depending on the cycle, with required attendance at workshops and the final pitch.",
    deadline: null,
    confidence: "unposted",
    cost: "Not listed — confirm whether the next cohort is free",
    format: "Entrepreneurship bootcamp",
    location: "Toronto",
    url: "https://dmz.torontomu.ca/basecamp",
  },
  {
    title: "JA Titan Business Challenge",
    org: "Junior Achievement Canada",
    category: "Business",
    grades: [9, 10, 11, 12],
    summary:
      "Teams run a simulated company, setting price, production, marketing and investment each round.",
    description:
      "A business simulation where teams compete on the results of their own decisions. Regional formats and deadlines vary — ask JA Central Ontario whether a local competition is scheduled for this year.",
    eligibility:
      "High-school students; local JA availability varies. May require school registration, a teacher contact and team participation.",
    deadline: null,
    confidence: "unposted",
    cost: "Not listed — ask JA Central Ontario",
    format: "Business simulation competition",
    location: "Ontario",
    url: "https://jacanada.org/program/ja-titan/",
  },

  // ---------- Leadership, global and employment ----------
  {
    title: "AKFC Youth Leadership Academy",
    org: "Aga Khan Foundation Canada",
    category: "Leadership",
    grades: [11, 12],
    summary:
      "Fully funded leadership academy on global development, community action and intercultural understanding.",
    description:
      "A fully funded week exploring global development and community leadership through project-based learning. The 2026 program ran 27–31 July; the application or nomination structure for the next cycle is expected in spring.",
    eligibility:
      "Ages 16–18, returning to high school, based in an eligible Canadian location. Full attendance and a demonstrated interest in global citizenship are expected.",
    deadline: null,
    confidence: "unposted",
    cost: "Fully funded",
    format: "Residential leadership academy",
    location: "Across Canada",
    url: "https://www.akfc.ca/get-involved/youth-leadership-academy/",
  },
  {
    title: "AKFC Youth Advisory Committee",
    org: "Aga Khan Foundation Canada",
    category: "Leadership",
    grades: [11, 12],
    summary: "Stipended one-year advisory role shaping AKFC's youth programming from the inside.",
    description:
      "Members give youth perspective on programs and feedback to the foundation over a one-year term of roughly four hours a month. The 2026 intake closed 11 January, which is the date carried forward here.",
    eligibility:
      "Ages 16–21, based in Canada, able to commit about four hours monthly for a one-year term. Shortlisted applicants are interviewed.",
    deadline: "2027-01-11",
    confidence: "estimated",
    cost: "Stipended",
    format: "Youth advisory role",
    location: "Across Canada",
    url: "https://www.akfc.ca/yac-recruitment/",
  },
  {
    title: "Yale Young Global Scholars",
    org: "Yale University",
    category: "Leadership",
    grades: [10, 11],
    summary:
      "Selective residential academic program with university-style seminars on global topics.",
    description:
      "Two weeks of seminars, lectures and collaborative projects on a chosen global-topics track, alongside students from around the world. Yale runs an early-action round in the autumn and a regular round in mid-January; the date shown is the usual regular-round timing, not a posted date.",
    eligibility:
      "Ages 16–18 during the program, currently a high-school sophomore or junior or the international equivalent, and attending high school when applying. English proficiency required.",
    deadline: "2027-01-15",
    confidence: "estimated",
    cost: "Paid, with substantial need-based financial aid",
    format: "Residential academic program",
    location: "New Haven, Connecticut",
    url: "https://globalscholars.yale.edu/",
  },
  {
    title: "Ocean Wise Youth to Sea",
    org: "Ocean Wise",
    category: "Leadership",
    grades: [9, 10, 11, 12],
    summary:
      "Service-learning program in ocean conservation with outdoor experiences and an action project.",
    description:
      "Combines conservation learning, outdoor experiences, community service and a youth-led action project. Cohorts are regional — check whether an Ontario or virtual cohort is running before applying.",
    eligibility:
      "Age and location requirements vary by cohort. May prioritise youth from specific Canadian regions and requires regular attendance plus a service project.",
    deadline: null,
    confidence: "unposted",
    cost: "Not listed — check the official page",
    format: "Leadership and conservation program",
    location: "Varies by cohort",
    url: "https://ocean.org/learn-explore/youth-programs/youth-to-sea/",
  },
  {
    title: "Ontario Public Service Summer Employment",
    org: "Government of Ontario",
    category: "Leadership",
    grades: [10, 11, 12],
    summary:
      "Paid summer jobs across Ontario ministries — policy, parks, science, communications and more.",
    description:
      "Hundreds of paid summer positions across provincial ministries. Postings usually appear in January and close on their own schedules through February and March, so there is no single deadline. Apply to several job types and locations rather than one posting.",
    eligibility:
      "Students generally aged 15–24, legally entitled to work in Canada, meeting each posting's student-status, location and skill requirements.",
    deadline: null,
    confidence: "unposted",
    cost: "Paid",
    format: "Paid summer employment",
    location: "Across Ontario",
    equity: "Students with a disability may be eligible up to age 29.",
    url: "https://www.gojobs.gov.on.ca/Pages/SEP.aspx",
  },
  {
    title: "EnergyMag Internship Directory",
    org: "EnergyMag",
    category: "Leadership",
    grades: [11, 12],
    summary:
      "Online directory of renewable-energy internship listings — a starting point, not a program.",
    description:
      "A listings directory rather than a single program. Treat it as a search tool: verify each employer independently, because directory dates go stale and not every listing accepts high-school students.",
    eligibility:
      "Varies entirely by listing. Confirm country, age, work authorisation, paid or unpaid status and remote eligibility for each one.",
    deadline: null,
    confidence: "unposted",
    cost: "Varies by listing",
    format: "Internship directory",
    location: "Remote",
    url: "https://energymag.net/internships/",
  },

  // ---------- Medicine, health and psychology research ----------
  {
    title: "Sunnybrook Focused Ultrasound Summer Research",
    org: "Sunnybrook Research Institute",
    category: "Medicine",
    grades: [11, 12],
    summary:
      "Paid summer placement in a focused-ultrasound biomedical research lab with scientific mentorship.",
    description:
      "A paid introduction to biomedical research — lab work, focused ultrasound technology and one-to-one mentorship. The 2026 role was posted 30 January with a reported 20 February close, which is the date carried forward here.",
    eligibility:
      "Typically age 16+ with authorisation to work in Canada, Canadian high-school status, strong science achievement and full-time attendance in Toronto. Confirm residency and reference requirements.",
    deadline: "2027-02-20",
    confidence: "estimated",
    cost: "Paid placement",
    format: "Paid research internship",
    location: "Toronto",
    url: "https://research.sunnybrook.ca/careers-and-students/summer-students/focused-ultrasound-high-school-summer-research-program/",
  },
  {
    title: "Youreka Canada Student Investigator Program",
    org: "Youreka Canada",
    category: "Medicine",
    grades: [9, 10, 11, 12],
    summary:
      "Virtual research mentorship where students design a question and produce a real research project.",
    description:
      "Students develop a research question, analyse evidence and produce a scientific project with mentor guidance, entirely online. Applications open in the autumn; the 2026 round closed 6 January, which is the date carried forward here.",
    eligibility:
      "Grades 9–12, CEGEP and some first-year university students. Applicants must commit to the full research cycle; written responses and interest in health research matter most.",
    deadline: "2027-01-06",
    confidence: "estimated",
    cost: "Not listed — check the official page",
    format: "Online research mentorship",
    location: "Online",
    url: "https://yourekacanada.org/apply",
  },
  {
    title: "Emily Stowe Scholars Program",
    org: "Canadian Association for Women in Academia",
    category: "Medicine",
    grades: [11, 12],
    summary:
      "Health and medicine enrichment program with mentorship and academic pathway guidance.",
    description:
      "Exposes senior high-school students to healthcare careers through mentorship and academic guidance. Cohort dates are not currently posted — verify on the official page before planning around it.",
    eligibility:
      "Grades 11–12 interested in medicine or health sciences. Confirm geographic and school-board eligibility for the current cohort.",
    deadline: null,
    confidence: "unposted",
    cost: "Not listed — check the official page",
    format: "Mentorship and enrichment program",
    location: "Ontario",
    equity: "Designed for young women and gender-diverse students.",
    url: "https://www.womensacademics.ca/learning/emily-stowe-scholars-program/",
  },
  {
    title: "SPRINT — Summer Psychology Research Initiative",
    org: "Department of Psychology, University of Toronto",
    category: "Medicine",
    grades: [10, 11, 12],
    summary:
      "Free two-week psychology research program at U of T, run by graduate students and postdocs.",
    description:
      "Two weeks of sessions across psychology disciplines plus training in research methods and statistics. Participants choose a lecture stream or a research stream where small groups build a research proposal with mentors. Competitive — a recent year drew over 650 applications from 178 Ontario high schools for about 60 places.",
    eligibility:
      "Ontario high-school students. Runs for roughly two weeks in July on the St. George campus; applications have typically opened in spring.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "In-person research program",
    location: "Toronto",
    equity:
      "Priority for Indigenous, Black and racialized students, gender minorities and first-generation students entering Grades 11–12.",
    url: "https://www.psych.utoronto.ca/event-series/summer-psychology-research-initiative-sprint",
  },
  {
    title: "U of T STEAM Design Program",
    org: "University of Toronto",
    category: "Medicine",
    grades: [10, 11],
    summary:
      "Design challenge where students tackle healthcare problems with university mentorship.",
    description:
      "Students from communities underrepresented in health sciences design solutions to real healthcare challenges, supported by mentors. Applications are expected in winter; check the enrichment-programs hub for the current listing.",
    eligibility:
      "Usually Grades 10–11. Applicants must identify with a group underrepresented in health sciences — check the exact wording in the current application.",
    deadline: null,
    confidence: "unposted",
    cost: "Not listed — check the official page",
    format: "Design challenge and enrichment",
    location: "Toronto",
    equity: "For students from communities underrepresented in health sciences.",
    url: "https://future.utoronto.ca/high-school-enrichment-programs",
  },
  {
    title: "T-CAIREM AI in Healthcare Summer Bootcamp",
    org: "T-CAIREM, University of Toronto",
    category: "Medicine",
    grades: [10, 11, 12],
    summary:
      "Five-day introduction to artificial intelligence in healthcare — workshops, ML activities and a group presentation.",
    description:
      "Covers how machine learning is used in medicine through workshops, hands-on activities, group work and final presentations. Coding is not required, though basic coding helps. The 2026 cycle closed 5 July; use the 2026 page as a reference and watch for a new event page.",
    eligibility:
      "Students entering Grades 10–12. Attendance at all five days is required and a program fee applies.",
    deadline: "2027-07-05",
    confidence: "estimated",
    cost: "Program fee applies",
    format: "In-person or virtual bootcamp",
    location: "Toronto",
    url: "https://tcairem.utoronto.ca/event/t-cairems-2026-ai-healthcare-summer-bootcamp-high-school-students",
  },

  // ---------- STEM ----------
  {
    title: "University of Toronto Physics Summer Camp",
    org: "Department of Physics, University of Toronto",
    category: "STEM",
    grades: [10, 11],
    summary: "Week-long university physics camp with lessons, experiments and problem-solving.",
    description:
      "A campus-based week of physics lessons, hands-on experiments and exposure to research life. The 2026 camp ran 17–21 August; verify the next cycle's dates and fee on the official page.",
    eligibility:
      "Students who will have completed Grade 10 or 11 by the August program date. Daily travel to the U of T campus is required.",
    deadline: null,
    confidence: "unposted",
    cost: "About $300 — verify the current fee",
    format: "In-person day camp",
    location: "Toronto",
    url: "https://summercamp.physics.utoronto.ca/",
  },
  {
    title: "Stanford University Mathematics Camp (SUMaC)",
    org: "Stanford Pre-Collegiate Studies",
    category: "STEM",
    grades: [10, 11],
    summary:
      "Highly selective advanced mathematics program built around proof-writing and abstract topics.",
    description:
      "Students study advanced topics such as abstract algebra and number theory, write proofs and work with university instructors. The application itself includes proof-based math questions, so preparation needs to start months ahead. The 2026 round closed 2 February, which is the date carried forward here.",
    eligibility:
      "Grades 10–11 at application, age 15+ during the program. Open worldwide, but advanced mathematical maturity is required, along with a transcript, teacher recommendation and English proficiency where applicable.",
    deadline: "2027-02-02",
    confidence: "estimated",
    cost: "Paid, with financial aid available — verify current fees",
    format: "Residential or online mathematics camp",
    location: "Stanford, California, and online",
    url: "https://sumac.spcs.stanford.edu/sumac-admissions",
  },
  {
    title: "McMaster STEM Immersive Experience",
    org: "McMaster Faculty of Engineering",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary:
      "A week of university-style activities across science, technology, engineering and mathematics.",
    description:
      "Hands-on university-style sessions spanning the STEM disciplines, run through McMaster Engineering outreach. Registration is generally first-come, first-served and runs until each week fills.",
    eligibility:
      "Students entering Grades 9–12. A program fee applies and daily travel to Hamilton is required.",
    deadline: null,
    confidence: "unposted",
    cost: "Program fee applies",
    format: "In-person day program",
    location: "Hamilton",
    equity:
      "One week has previously been reserved for girls and non-binary youth — check whether that returns.",
    url: "https://www.eng.mcmaster.ca/community/outreach-programs/summer-camp/",
  },
  {
    title: "McMaster Engineering Design Studio",
    org: "McMaster Faculty of Engineering",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary:
      "Hands-on week applying the engineering design process to build and test real solutions.",
    description:
      "Students work through the full engineering design process on hands-on projects, prototyping and testing their own solutions. Registration is first-come, first-served and runs until full.",
    eligibility:
      "Students entering Grades 9–12. A program fee applies and you must be able to commute to Hamilton daily.",
    deadline: null,
    confidence: "unposted",
    cost: "Program fee applies",
    format: "In-person day program",
    location: "Hamilton",
    url: "https://www.eng.mcmaster.ca/community/outreach-programs/summer-camp/",
  },
  {
    title: "Queen's SEEDS in Residence",
    org: "Queen's University",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Residential science and engineering enrichment with labs and campus life.",
    description:
      "A residential enrichment experience built around labs, campus activities and collaborative project work. Search the current Queen's youth-program catalogue when the next cycle is released, as grade eligibility shifts between years.",
    eligibility:
      "High-school students in specified grades — verify the current range. Program fee, residence participation and full attendance required.",
    deadline: null,
    confidence: "unposted",
    cost: "Program fee applies (residential)",
    format: "Residential summer program",
    location: "Kingston",
    url: "https://www.queensu.ca/academics/youth-programs",
  },
  {
    title: "Kode With Klossy Summer Camp",
    org: "Kode With Klossy",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Free two-week coding camp in web development, mobile apps or data science.",
    description:
      "A free camp teaching a full coding track in a supportive community, offered both virtually and at in-person locations. Places are competitive — apply early and select both virtual and nearby in-person preferences where the form allows it.",
    eligibility:
      "Typically ages 13–18. Location and age eligibility vary by camp, and full attendance is required.",
    deadline: null,
    confidence: "unposted",
    cost: "Free",
    format: "Virtual or in-person coding camp",
    location: "Virtual and in-person locations",
    equity: "Designed for young women and gender-expansive youth.",
    url: "https://www.kodewithklossy.com/programs",
  },
  {
    title: "FIRST Tech Challenge",
    org: "FIRST Robotics Canada",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Team robotics competition with a smaller robot and lower barrier to entry than FRC.",
    description:
      "Students design, build and program a competition robot while running team outreach and operations. A more accessible robotics route than FIRST Robotics Competition for smaller teams or schools starting out. Deadlines follow each qualifying event rather than one season-wide date.",
    eligibility:
      "Students in the eligible FIRST age and grade range. Requires a registered team, adult coaches, equipment, registration fees and attendance at qualifying events.",
    deadline: null,
    confidence: "unposted",
    cost: "Team registration fees and equipment costs apply",
    format: "Team robotics competition",
    location: "Ontario",
    url: "https://www.firstinspires.org/robotics/ftc",
  },
  {
    title: "International Brain Bee — Canadian Chapters",
    org: "Brain Bee Canada",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary: "Neuroscience competition on brain anatomy, neurological disease and research.",
    description:
      "A knowledge competition covering neuroanatomy, neurological disorders and current research, with winners advancing from local chapters upward. Find your nearest Ontario chapter first, then work through the official study materials.",
    eligibility:
      "High-school students; local chapter rules apply. You must qualify through a local Brain Bee, and age or prior-winner restrictions may apply.",
    deadline: null,
    confidence: "unposted",
    cost: "Free or low cost — varies by local chapter",
    format: "Academic competition",
    location: "Local Ontario chapters",
    url: "https://brainbee.ca/",
  },
  {
    title: "Canadian Open Mathematics Challenge (COMC)",
    org: "Canadian Mathematical Society",
    category: "STEM",
    grades: [9, 10, 11, 12],
    summary:
      "National problem-solving contest and a gateway to advanced Canadian math opportunities.",
    description:
      "Canada's premier national math challenge, used as a pathway into further olympiad-level opportunities and team selection. The contest is written in late autumn and registration usually closes a couple of weeks before — register through your school where possible.",
    eligibility:
      "Students in Canada and internationally; school or individual registration options vary. A contest fee and supervised writing conditions apply, and awards or team selection can carry residency rules.",
    deadline: "2026-10-21",
    confidence: "estimated",
    cost: "Contest fee applies",
    format: "Written math contest",
    location: "Written at your school",
    url: "https://cms.math.ca/competitions/comc/",
  },

  {
    title: "RBC Summer Tech Labs",
    org: "RBC (Royal Bank of Canada)",
    category: "STEM",
    grades: [11, 12],
    summary:
      "Paid high-school technology internship working on real innovation projects inside RBC.",
    description:
      'Students work on technology and innovation projects while learning software development and professional workplace skills, paid, over the summer. The 2026 posting has expired — postings for the next cycle typically appear between November and January, so search RBC Careers for "High School Student" from late autumn.',
    eligibility:
      "Usually Grades 11–12 and posting-specific. Requires legal authorisation to work in Canada; location, schedule, technical skills and background-check conditions may apply.",
    deadline: null,
    confidence: "unposted",
    cost: "Paid internship",
    format: "Paid technology internship",
    location: "Toronto and other Canadian offices",
    url: "https://jobs.rbc.com/ca/en/",
  },

  // ---------- Law, civics and debate ----------
  {
    title: "OSDU Provincial Debate Tournaments",
    org: "Ontario Student Debating Union",
    category: "Law & Civics",
    grades: [9, 10, 11, 12],
    summary: "Ontario's school and regional debate circuit in prepared and impromptu formats.",
    description:
      "The provincial debate circuit that feeds regional and national championships. Entry runs through your school's debate club, so the first step is joining it and confirming regional membership — individual deadlines follow each tournament.",
    eligibility:
      "Ontario secondary-school students, usually through a participating school or debate association, with qualification at regional events.",
    deadline: null,
    confidence: "unposted",
    cost: "Membership and tournament fees, usually handled through your school",
    format: "Debate competition circuit",
    location: "Ontario",
    url: "https://osdu.on.ca/",
  },
  {
    title: "Speech and Debate Canada National Speech Competition",
    org: "Speech and Debate Canada Foundation",
    category: "Law & Civics",
    grades: [9, 10, 11, 12],
    summary:
      "National persuasive-speech competition judged from a submitted video, with a cash prize.",
    description:
      "Students write and deliver a persuasive speech identifying a problem facing Canada and proposing solutions, submitted as a video. Judged on research, persuasiveness, speaking style and clarity. Winners receive $500, half of which is donated to a non-profit the student chooses. Entries are limited per category per school, so register early. The date shown follows the usual mid-January close.",
    eligibility:
      "Senior category is Grades 10–12, with a junior category below it. Schools are limited to three entries per category, so internal selection may come first.",
    deadline: "2027-01-10",
    confidence: "estimated",
    cost: "Free to enter",
    format: "Video speech submission",
    location: "Online submission",
    url: "https://www.speechanddebatecanada.com/",
  },
];

export const PROGRAMS: Program[] = [...seeds, ...sheetSeeds].map((s) => ({
  ...s,
  id: s.id ?? slug(s.title),
  lastChecked: CHECKED,
}));

export const TODAY = new Date();

/**
 * Whole days from today until a deadline. Negative once it has passed.
 *
 * Both dates are reduced to UTC calendar days before subtracting. That is
 * deliberate: the server renders in UTC and the student's browser does not,
 * and comparing raw timestamps made the same deadline read "14 days" on the
 * server and "13 days" in the browser, which React flags as a hydration
 * mismatch. Reducing to UTC days makes the number identical everywhere.
 *
 * The trade-off is that late in a North American evening the count can be a
 * day lower than a wall calendar would say. For a deadline tracker that is the
 * right direction to be wrong in.
 */
export function daysUntil(deadline: string | null, now: Date = new Date()): number | null {
  if (!deadline) return null;
  const parts = deadline.split("-").map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const target = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

export function isClosed(p: Program, now: Date = new Date()): boolean {
  const d = daysUntil(p.deadline, now);
  return d !== null && d < 0;
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "Not posted yet";
  return new Date(`${deadline}T12:00:00`).toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShort(deadline: string): string {
  return new Date(`${deadline}T12:00:00`).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}
