# DESIGN.md - MagangHub Checker (Personal Civic Inspector)

## Design Read
Reading this as: **Personal Recruitment Status & Vacancy Inspector** for **Indonesian MagangHub Kemnaker applicants**, in a **civic-editorial & structured data-inspector** visual language, dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

## Identity & Purpose
- **Product**: Personal, non-commercial utility to inspect official Kemnaker MagangHub application status signals (`selected_at`, post-interview `updated_at`, `determined_at`, `rejection_reason`), PDDIKTI eligibility flags, and live vacancy competition ratios directly from `api.kemnaker.go.id`.
- **Personality**: Transparent, precise, civic-editorial, calm under high-stakes selection periods. No paywalls, no artificial queues, no marketing fluff.

## Color System (R-01, R-25, R-29, R-31)
- **Base Canvas (Light)**: `#F8F7F4` (Warm Alabaster Paper) & `#FFFFFF` (Surface Card) - reduces eye strain when reading dense tables, timelines, and syllabus modules compared to stark `#FFFFFF` everywhere.
- **Base Canvas (Dark)**: `#0C1117` (Deep Slate Ink) & `#151D26` (Elevated Slate Surface) - provides a comfortable low-light inspection environment with full parity (R-34).
- **Primary Brand (`#0F4C5C` Deep Civic Teal / `#38BDF8` in Dark Mode)**: Chosen to echo official Indonesian employment/public-service authority while distinguishing this personal inspector from the commercial portal.
- **Deliberate Accent (`#B45309` Warm Amber / `#F59E0B` in Dark Mode)**: Used strictly at the key moment: highlighting early selection signals (`selected_at` and post-interview `updated_at` activity) and active interview schedules.
- **Semantic Status Tokens**:
  - Verified / Determined / Accepted: `#047857` (Emerald 700, WCAG AA on light surface)
  - Warning / Selection / Early Signal: `#B45309` (Amber 700, WCAG AA on light surface)
  - Rejected / Error: `#BE123C` (Rose 700, WCAG AA on light surface)

## Typography (R-06, R-31)
- **UI & Editorial Body**: `Plus Jakarta Sans` - designed specifically with Indonesian word lengths and contemporary civic legibility in mind.
- **Technical Data & Raw JSON**: `JetBrains Mono` - used strictly for vacancy UUIDs, timestamps, competition ratios (`tabular-nums`), and the Raw JSON API Payload Inspector where character alignment matters.

## Layout, Rhythm & Radii (R-05, R-11, R-31)
- **Dial**: `ENERGY 2 / RHYTHM 2 / MOTION 1`
- **No Marketing Landing Page**: The app opens directly into the functional workspace (Application Status Inspector & Live Vacancy Explorer) because it is a personal tool, not a commercial SaaS product.
- **Border Radius Hierarchy**:
  - `rounded-xl` (12px) for primary data containers and modals
  - `rounded-lg` (8px) for interactive buttons and form inputs
  - `rounded-md` (6px) for status tags and technical metadata (no pill-shaped everything)
- **Motion (MOTION 1)**: Instant state transitions and subtle hover/focus rings only; zero endless loops or pulsing dots.
