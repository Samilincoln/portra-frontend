import type { PortfolioProfile } from "@/lib/portfolio";
import type { Project } from "@/lib/projects";
import type { Experience } from "@/lib/experiences";
import type { Testimonial } from "@/lib/testimonials";
import type { BlogPost } from "@/lib/blog";
import type { Skill } from "@/lib/skills";

/** Usernames that render a fully populated sample portfolio without a backend. */
export const DEMO_USERNAMES = ["demo", "demo-user", "amara"];

export function isDemoUsername(username: string) {
  return DEMO_USERNAMES.includes(username.trim().toLowerCase());
}

const DEMO_SKILLS: Skill[] = [
  { id: "s1", name: "TypeScript", category: "Languages", level: "Expert" },
  { id: "s2", name: "Python", category: "Languages", level: "Advanced" },
  { id: "s3", name: "Go", category: "Languages", level: "Intermediate" },
  { id: "s4", name: "React", category: "Frontend", level: "Expert" },
  { id: "s5", name: "Tailwind CSS", category: "Frontend", level: "Expert" },
  { id: "s6", name: "Next.js", category: "Frontend", level: "Advanced" },
  { id: "s7", name: "PostgreSQL", category: "Data", level: "Advanced" },
  { id: "s8", name: "Redis", category: "Data", level: "Intermediate" },
  { id: "s9", name: "LangChain", category: "AI/ML", level: "Advanced" },
  { id: "s10", name: "Vector Search", category: "AI/ML", level: "Advanced" },
  { id: "s11", name: "Model Evaluation", category: "AI/ML", level: "Intermediate" },
  { id: "s12", name: "AWS", category: "Infrastructure", level: "Advanced" },
  { id: "s13", name: "Docker", category: "Infrastructure", level: "Advanced" },
  { id: "s14", name: "Terraform", category: "Infrastructure", level: "Intermediate" },
];

export const DEMO_EXPERIENCES: Experience[] = [
  {
    id: "e1",
    company: "Northwind Systems",
    role: "Staff Software Engineer",
    location: "Remote — Lagos, NG",
    startDate: "2023-04",
    endDate: null,
    isCurrent: true,
    description:
      "Lead the platform group building the ingestion and retrieval layer behind Northwind's document intelligence product. Cut median query latency from 1.9s to 340ms and shipped an evaluation harness now used by every model change.",
    displayOrder: 1,
  },
  {
    id: "e2",
    company: "Kite Health",
    role: "Senior Full-Stack Engineer",
    location: "Berlin, DE",
    startDate: "2021-01",
    endDate: "2023-03",
    description:
      "Built the clinician-facing scheduling suite used across 40 clinics. Owned the migration from a monolith to service-oriented APIs with zero customer-visible downtime.",
    displayOrder: 2,
  },
  {
    id: "e3",
    company: "Loom & Ledger",
    role: "Product Engineer",
    location: "Cape Town, ZA",
    startDate: "2019-06",
    endDate: "2020-12",
    description:
      "First engineering hire. Shipped the billing, onboarding, and reporting surfaces that took the product from pilot to 1,200 paying SMEs.",
    displayOrder: 3,
  },
  {
    id: "e4",
    company: "Freelance",
    role: "Web Developer",
    location: "Remote",
    startDate: "2017-09",
    endDate: "2019-05",
    description:
      "Designed and delivered 20+ marketing sites and internal tools for manufacturing and education clients.",
    displayOrder: 4,
  },
];

export const DEMO_PROFILE: PortfolioProfile = {
  username: "demo",
  name: "Amara Okonkwo",
  headline: "Staff engineer building AI-assisted products end to end",
  bio: "I design and ship systems where retrieval, latency, and interface quality all matter at once. Nine years across health, manufacturing, and SMB software — most recently leading the platform group at Northwind Systems. I care about tools people actually keep using after the demo.",
  avatarUrl:
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&h=400&q=80",
  resumeUrl: "#",
  bookingUrl: "#",
  industries: ["Manufacturing", "Education", "Healthcare", "SMEs", "Media", "Enterprise"],
  social: {
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    twitter: "https://twitter.com",
    website: "https://example.com",
  },
  skills: DEMO_SKILLS,
  experiences: DEMO_EXPERIENCES,
};

export const DEMO_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Atlas — Document Intelligence Platform",
    slug: "atlas-document-intelligence",
    category: "AI Platform",
    status: "published",
    published: true,
    featured: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&h=750&q=80",
    shortDescription:
      "A retrieval platform that turns 12 years of unstructured technical documentation into answers engineers trust.",
    problem:
      "Field engineers were losing hours per shift hunting through 400k pages of scanned manuals, revision notes, and PDFs. Keyword search returned the wrong revision constantly, and every wrong answer meant an unnecessary site visit.",
    solution:
      "I built a hybrid retrieval pipeline — semantic search over chunk embeddings combined with lexical filters on revision metadata — behind a citation-first answer UI. Every response links directly to the page and revision it came from, so answers stay auditable.",
    architecture:
      "Ingestion workers normalize and OCR documents, then chunk with layout awareness before writing embeddings to pgvector. A Go query service fans out to vector and lexical indexes, reranks, and streams answers to a React front end. Terraform-managed on AWS with per-tenant isolation.",
    results:
      "Median query latency dropped from 1.9s to 340ms. Answer acceptance rate rose to 87% in blind review, and unnecessary site visits fell 31% in the first quarter after rollout.",
    technologies: ["TypeScript", "Go", "Python", "PostgreSQL", "pgvector", "AWS"],
    tags: ["RAG", "Search", "Platform"],
    githubUrl: "https://github.com",
    liveDemoUrl: "https://example.com",
    screenshots: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=750&q=80",
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&h=750&q=80",
    ],
    published_at: "2025-11-18",
  },
  {
    id: "p2",
    title: "Cadence — Clinic Scheduling Suite",
    slug: "cadence-clinic-scheduling",
    category: "Healthcare",
    status: "published",
    published: true,
    featured: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&h=750&q=80",
    shortDescription:
      "Scheduling and rota tooling for 40 clinics, rebuilt around how clinicians actually plan their weeks.",
    problem:
      "Clinic managers were coordinating rooms, clinicians, and equipment across three disconnected tools, then reconciling by hand. Double bookings were routine and cancellations propagated badly.",
    solution:
      "A single constraint-aware scheduler with drag-and-drop rota editing, conflict detection at write time, and patient-facing rebooking links that respect clinician availability rules.",
    architecture:
      "React front end with optimistic updates over a Node API. Availability is modeled as interval trees in PostgreSQL with exclusion constraints preventing overlapping bookings at the database level.",
    results:
      "Double bookings dropped to near zero, and average time to fill a cancelled slot went from 2 days to 4 hours.",
    technologies: ["React", "Node.js", "PostgreSQL", "Redis"],
    tags: ["Product", "Scheduling"],
    githubUrl: "https://github.com",
    published_at: "2025-06-02",
  },
  {
    id: "p3",
    title: "Foundry — Factory Floor Telemetry",
    slug: "foundry-factory-telemetry",
    category: "Manufacturing",
    status: "published",
    published: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&h=750&q=80",
    shortDescription:
      "Real-time line monitoring that surfaces the three machines actually costing you throughput today.",
    problem:
      "Plant supervisors had dashboards full of gauges but no ranked view of what to fix first, so downtime investigations started from intuition.",
    solution:
      "An ingestion pipeline plus an attribution view that ranks stoppage causes by lost units, with alerting tuned to reduce noise rather than maximize coverage.",
    architecture:
      "MQTT edge collectors buffer locally, stream to a time-series store, and roll up into materialized views feeding a lightweight React dashboard designed for wall displays.",
    results:
      "Identified a recurring changeover bottleneck worth 6% of weekly output within the first month.",
    technologies: ["Python", "TimescaleDB", "React", "Docker"],
    tags: ["IoT", "Analytics"],
    published_at: "2025-02-14",
  },
  {
    id: "p4",
    title: "Ledgerlight — SMB Billing",
    slug: "ledgerlight-smb-billing",
    category: "Fintech",
    status: "published",
    published: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&h=750&q=80",
    shortDescription:
      "Invoicing, dunning, and VAT handling for small businesses that don't have a finance team.",
    problem:
      "Small operators were tracking invoices in spreadsheets and losing revenue to unchased payments and mis-filed VAT.",
    solution:
      "Recurring invoicing with automatic dunning sequences, jurisdiction-aware VAT calculation, and export formats accountants accept without rework.",
    architecture:
      "Event-sourced ledger so every balance is reconstructible, with idempotent payment webhooks and a queue-backed email sender.",
    results:
      "Grew to 1,200 paying businesses; average days-sales-outstanding fell from 41 to 27.",
    technologies: ["TypeScript", "Next.js", "PostgreSQL", "Stripe"],
    tags: ["Billing", "SaaS"],
    published_at: "2024-09-30",
  },
];

export const DEMO_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    author: "Priya Raman",
    role: "VP Engineering",
    company: "Northwind Systems",
    rating: 5,
    comment:
      "Amara has the rare combination of taste and rigor. She rebuilt our retrieval layer, then built the evaluation harness that let the rest of us change models without fear. Half the value was the second part.",
    createdAt: "2026-03-11",
  },
  {
    id: "t2",
    author: "Dr. Jonas Weber",
    role: "Clinical Director",
    company: "Kite Health",
    rating: 5,
    comment:
      "She sat in on rounds for a week before writing a line of code. The scheduling tool she shipped is the only software our clinicians have ever asked to use more of.",
    createdAt: "2025-08-19",
  },
  {
    id: "t3",
    author: "Tunde Bakare",
    role: "Plant Manager",
    company: "Meridian Works",
    rating: 5,
    comment:
      "We had dashboards before. Amara gave us a ranked list of what to fix, which is a completely different thing. Found a bottleneck worth 6% of output in week three.",
    createdAt: "2025-04-02",
  },
  {
    id: "t4",
    author: "Sofia Marchetti",
    role: "Founder",
    company: "Loom & Ledger",
    rating: 5,
    comment:
      "First engineer, and she set a bar the next ten hires had to clear. Pragmatic about scope, uncompromising about the parts customers touch.",
    createdAt: "2024-12-08",
  },
];

export const DEMO_BLOG: BlogPost[] = [
  {
    id: "b1",
    title: "Latency is a feature, not a chore",
    slug: "latency-is-a-feature",
    excerpt:
      "Every retrieval product I've worked on eventually hit the same wall: the answers were fine, but nobody waited around for them. Here's how we got from 1.9s to 340ms without touching model quality.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&h=750&q=80",
    tags: ["Performance", "RAG"],
    status: "published",
    published: true,
    publishedAt: "2026-06-24",
    views: 4820,
    content: `## The wall everyone hits

Every retrieval product I've worked on eventually hit the same wall: the answers were good, but people stopped asking questions. Not because the answers were wrong — because waiting two seconds for one felt like work.

## Where the time actually went

We profiled before optimizing, which is unglamorous advice that keeps being correct. The breakdown surprised us:

- **62%** was a single unbatched embedding call per query
- **21%** was reranking documents we were about to discard
- **11%** was JSON serialization of full document bodies
- The vector search itself was **under 30ms**

We had been planning an index migration. The index was never the problem.

## The three changes that mattered

1. **Batch and cache embeddings.** Query embeddings repeat far more than you'd expect. A small LRU cache absorbed 40% of calls.
2. **Rerank later, on less.** Retrieve wide, filter on cheap metadata first, rerank only the survivors.
3. **Stop shipping bodies you don't render.** Return spans and offsets; fetch full text lazily when a citation is expanded.

Median latency: 1.9s to 340ms. Zero change to the model.

## What I'd tell myself earlier

Treat latency as part of the answer quality metric, not a separate performance ticket. A correct answer nobody waits for scores zero.`,
  },
  {
    id: "b2",
    title: "Evaluation harnesses are the real deliverable",
    slug: "evaluation-harnesses",
    excerpt:
      "The most valuable thing I built last year wasn't a feature. It was the thing that let five other engineers change models on a Tuesday without asking permission.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&h=750&q=80",
    tags: ["AI/ML", "Engineering culture"],
    status: "published",
    published: true,
    publishedAt: "2026-04-09",
    views: 3110,
    content: `## Nobody asks for this

No roadmap has ever had "build an evaluation harness" on it. It gets built when someone gets tired of being the bottleneck for every prompt change.

## What ours does

- A frozen set of 400 real queries with human-graded answers
- Deterministic scoring on citation correctness, not just similarity
- One command, results in under four minutes, diffed against the last run

## Why it changed the team

Before: every model change routed through me for a vibe check. After: an engineer changed the reranker on a Tuesday afternoon, saw a 4-point regression on citation precision, reverted, and tried something else — all before I heard about it.

That's the whole point. The harness didn't make the model better. It made *everyone else* able to make the model better.`,
  },
  {
    id: "b3",
    title: "Sitting in on rounds before writing code",
    slug: "sitting-in-on-rounds",
    excerpt:
      "I spent a week shadowing clinicians before building their scheduling tool. Four of the five features on the spec turned out to be wrong.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&h=750&q=80",
    tags: ["Product", "Healthcare"],
    status: "published",
    published: true,
    publishedAt: "2026-01-15",
    views: 2670,
    content: `## The spec was confident and wrong

We had a five-item spec for the scheduling rebuild. After a week on the floor, four items were wrong — not badly designed, just solving problems nobody had.

## What I actually saw

Clinic managers didn't want a better calendar. They wanted to know, at 7am, which of today's slots were at risk. Everything else was downstream of that one question.

## What we built instead

A risk-ranked day view first, calendar editing second. The calendar was still necessary — it just wasn't the product.

## The cost of the week

Five days of my time. It saved a quarter of building the wrong thing, which is the sort of trade I'll take every time.`,
  },
  {
    id: "b4",
    title: "Exclusion constraints beat application logic",
    slug: "exclusion-constraints",
    excerpt:
      "We tried to prevent double bookings in three layers of application code. The database could have done it in four lines.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&h=750&q=80",
    tags: ["PostgreSQL", "Data modeling"],
    status: "published",
    published: true,
    publishedAt: "2025-10-27",
    views: 5940,
    content: `## Three layers of hope

We validated availability in the UI, again in the API handler, and again in a background reconciler. Double bookings still happened, because concurrent writes don't care about your validation order.

## Four lines instead

\`\`\`sql
ALTER TABLE bookings ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  );
\`\`\`

The database now refuses to represent an invalid state. The application code got shorter, and the reconciler was deleted.

## The general lesson

If an invariant matters, push it to the layer that can actually enforce it under concurrency. Everything above that is a nicer error message.`,
  },
];
