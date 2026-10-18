# 🎖️ ISSB Command — Next-Generation Defense Selection & Preparation Portal

[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![SSG](https://img.shields.io/badge/Vite--SSG-Prerendered-0ea5e9?style=for-the-badge)](https://github.com/antfu/vite-ssg)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](#license)

**ISSB Command** is an open-access, military-grade preparation and psychological test simulation portal built for candidates aspiring to join the **Pakistan Armed Forces** (Pakistan Army, Pakistan Navy, Pakistan Air Force) via PMA Long Course, Technical Cadet Course (TCC), PN Cadet, General Duty Pilot (GDP), CAE, and Short Service Commission (SSC).

The portal combines real-time projector simulators, comprehensive 5-day curriculum roadmaps, 14 Officer-Like Qualities (OLQ) profiling, and high-performance pre-rendered SEO architecture.

---

## 🌟 Key Features

### ⏱️ Real-Time Psychological Test Simulators
- **WAT Simulator (Word Association Test):** 10-second projector flash simulation with real exam pacing, Roman Urdu & English definitions, and instant response capture.
- **SCT Simulator (Sentence Completion Test):** Authentic Urdu and English sentence completion sheets under official exam countdown timers.
- **SRT Trainer (Situation Reaction Test):** 30-second rapid-fire military crisis scenarios with tactical response models and scoring logic.
- **OPI Simulator (Officer Personality Inventory):** Comprehensive 150-question psychometric inventory assessing candidate stability, leadership, and emotional resilience.
- **GTO Obstacles Planner:** Interactive route sequencer and score calculator for individual obstacles (Tarzan Swing, Monkey Bridge, Rope Climb, Ditch Jump).

### 🗺️ Curriculum, Interviews & Written Tests
- **5-Day ISSB Roadmap:** Complete breakdown of Day 1 (Arrival & Screening) through Day 5 (Conference & Final Results).
- **Deputy President (DP) Interview Vault:** Curated rapid-fire questions, moral dilemmas, personal bio-data grilling tactics, and answering formulas.
- **Essays & Public Speaking (Lecturette):** High-scoring English & Urdu essay topics, group discussion points, and a built-in 2-minute timer for lecturette speech drills.
- **Call Letter Tracker:** Real-time call letter status checking, reporting schedules for Kohat, Gujranwala, Malir, and Quetta centers, and packing checklists.

### 🌐 High-Intent Branch Landing Pages (SEO-Optimized)
- [`/join-pak-army`](https://issb-preparation.vercel.app/join-pak-army) — PMA Long Course eligibility, AS&RC initial test syllabus, physical benchmarks.
- [`/join-pak-navy`](https://issb-preparation.vercel.app/join-pak-navy) — PN Cadet, Marine, and SSC registration procedures and selection criteria.
- [`/join-pak-airforce`](https://issb-preparation.vercel.app/join-pak-airforce) — GDP, Aeronautical Engineering, Air Defence, and Flying Aptitude Test (FAT) guidelines.

### 🚀 Programmatic SEO (pSEO) & Scaled Content Engine
- Scaled multi-niche programmatic landing pages for defense, career paths, and technical roles (`/explore/:niche/:slug`).
- Structured Schema.org (`Article`, `FAQPage`) metadata via `@unhead/vue`.
- Automated XML sitemap generation with multi-file scaling (`scripts/generate-scale-sitemap.mjs`).

### 🔓 100% Open Access Candidate Architecture
- All core tools, simulators, roadmaps, and guides are accessible to visitors without mandatory login or registration barriers.
- Supabase session handles authentication and profile synchronization silently in the background for returning members.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) |
| **Build & Tooling** | [Vite 8](https://vitejs.dev/) + [vite-ssg](https://github.com/antfu/vite-ssg) |
| **State Management** | [Pinia](https://pinia.vuejs.org/) |
| **Routing** | [Vue Router 4](https://router.vuejs.org/) |
| **Head & SEO** | [@unhead/vue](https://unhead.unjs.io/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, RPC) |
| **Styling** | Native Custom CSS Variables & Glassmorphism Design Tokens |
| **Code Quality** | ESLint, Oxlint, Prettier |
| **Analytics & Hosting** | Vercel & Vercel Analytics |

---

## 📂 Project Structure

```text
Issb-prep/
├── public/                     # Static assets, sitemaps, robots.txt
├── scripts/                    # Build, QA audit, and sitemap generation scripts
│   ├── generate-scale-sitemap.mjs  # Multi-sitemap generation for programmatic pages
│   ├── qa_audit.mjs            # Automated post-build QA & SEO validation audit
│   └── optimize_media.py       # Image and media compression utility
├── src/
│   ├── assets/                 # Global styles, typography, and base CSS variables
│   ├── components/             # Reusable UI components & programmatic layout templates
│   ├── composables/            # Shared reactive logic (useAiAnalysis, timer state)
│   ├── data/                   # Simulators question banks, OLQ data, and pSEO datasets
│   │   ├── programmatic/       # Structured JSON datasets (defense, jobs, tech)
│   │   ├── issbTestData.js     # WAT, SCT, SRT datasets
│   │   └── opiData.js          # 150-question personality inventory data
│   ├── router/                 # Vue Router configuration & route guards
│   ├── stores/                 # Pinia stores (auth, user progress, XP state)
│   ├── views/                  # Application views & landing pages
│   │   ├── HomeView.vue        # Main portal landing page
│   │   ├── DashboardView.vue   # Candidate progress & OLQ profiler
│   │   ├── RoadmapView.vue     # 5-day curriculum guide
│   │   ├── WatSimulator.vue    # WAT projector simulator
│   │   ├── SctSimulator.vue    # SCT simulator
│   │   ├── SrtSimulator.vue    # SRT trainer
│   │   ├── OpiSimulator.vue    # OPI personality test
│   │   ├── ObstaclesSimulator.vue # GTO route planner
│   │   ├── JoinArmyView.vue    # Pak Army SEO guide
│   │   ├── JoinNavyView.vue    # Pak Navy SEO guide
│   │   └── JoinAirforceView.vue # PAF SEO guide
│   ├── App.vue                 # Root component & global navigation layout
│   └── main.js                 # App entry point (Vite-SSG compatible)
├── supabase/                   # Supabase migrations, RLS policies, and schema
├── vite.config.js              # Vite and SSG pre-render configurations
└── package.json                # Dependencies, scripts, and engine specifications
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.19.0` or `>=22.12.0`
- **npm**: `>=10.0.0`

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/MuhammadDevPk/Issb-prep.git
cd Issb-prep
npm install
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Local Development
Start the local Vite development server with HMR:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🏗️ Production Build & Verification

To compile the production bundle with static site generation (SSG), generate fresh XML sitemaps, and execute automated QA checks:

```bash
# Run production SSG build and automated QA audit
npm run build

# Preview the production static build locally
npm run preview
```

### Code Quality & Linting
```bash
# Run ESLint and Oxlint checks
npm run lint

# Format codebase using Prettier
npm run format

# Run QA audit manually
npm run audit
```

---

## 🧪 Automated QA Audit Pipeline

Every production build automatically runs `scripts/qa_audit.mjs` which validates:
1. **Single `<h1>` Hierarchy:** Ensures every pre-rendered HTML document contains exactly one semantic `<h1>`.
2. **SEO Metadata & OpenGraph:** Confirms title, description, and canonical tags are rendered in static output.
3. **Structured Data Validation:** Checks Schema.org `Article` and `FAQPage` JSON-LD integrity.
4. **Sitemap Synchronization:** Verifies that all static routes and programmatic pages are registered in `sitemap.xml`.
5. **Open-Access Security:** Confirms core candidate features remain freely accessible while administrative routes (`/admin/users`) remain strictly guarded.

---

## 📄 License

Proprietary software. All rights reserved. Built for candidates preparing for ISSB and Commissioned Officer examinations in Pakistan.
