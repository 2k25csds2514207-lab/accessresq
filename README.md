# AccessResQ — Intelligent Accessible Navigation & Roadside Rescue Platform

> **NAVIGATE • ASSIST • INCLUDE**  
> *Built for Catalyst Hack 2026*  
> *"Don't just find the shortest route. Find the route that works for the person."*

AccessResQ is an integrated mobility assistance platform engineered specifically for wheelchair users, persons with reduced mobility (PRM), and accessible vehicle operators. It combines **graph-based accessible route planning**, **specialized roadside breakdown assistance (with wheelchair hoist/lift capabilities)**, **crowdsourced community barrier reporting**, and an **instant emergency SOS dispatch portal**.

---

## 🌟 Key Innovations & Differentiation

1. **Accessibility-Aware Graph Routing (Dijkstra / A\*)**
   - Goes beyond standard geographical distance: factors step count, curb cuts, ramp availability (1:12 slope standards), surface smoothness (asphalt vs broken pavement), vibration sensitivity, and lighting.
   - Computes both **Recommended Step-Free Route** and **Direct Standard Route** with side-by-side metric comparison.

2. **Smart Dynamic Rerouting**
   - When a barrier (e.g., parked vehicles blocking a curb ramp or utility construction) is reported, the engine automatically flags the affected segment as impassable and calculates an immediate step-free bypass.

3. **Wheelchair-Compatible Roadside Rescue**
   - Most roadside services are unprepared for motorized wheelchairs or WAVs (Wheelchair-Accessible Vehicles).
   - AccessResQ features a multi-criteria helper matching engine prioritizing verified hydraulic wheelchair lifts, low-incline flatbeds, and certified accessible technicians.

4. **Community Barrier Intelligence & Verification Tier**
   - Allows citizens and accessibility auditors to report obstructions with category tags, severity ratings, photos, and GPS coordinates.
   - Built-in anti-spam threshold: reports advance from `Pending` to `Community Confirmed` once 3+ local users confirm, preventing misleading data.

5. **Local Heuristic AI Engine (Zero-Latency Rule-Based NLP)**
   - **Barrier Classification:** Automatically parses user descriptions into structured categories (Blocked Ramp, Broken Footpath, Stairs, etc.) with confidence scores and keyword extraction.
   - **Report Summarization:** Extracts concise titles and impact statements.
   - **Route & Helper Explainability:** Transparently explains why a specific route or rescue provider was matched based on accessibility metrics.
   - **100% On-Device & Secure:** Operates locally with zero external API dependencies or latency. External Gemini LLM integration is intentionally not implemented in frontend code to prevent exposing API keys; it is scheduled for Phase 3 via a secure serverless backend.

---

## 🚀 Live Demo Scenarios for Catalyst Hack Judges

AccessResQ includes built-in 1-click demo launchers accessible via the **"Demo Scenarios"** button in the header navigation or the dashboard cards.

### Scenario A: Accessible Navigation & Smart Rerouting
1. Click **Demo Scenarios** in the header or select **Accessible Routes**.
2. Starting Location is preset to **PSIT Kanpur (Main Campus)** and Destination to **Z Square Mall Kanpur**.
3. Toggle on **Avoid Stairs** and **Strict Step-Free Access**.
4. Click **Calculate Accessible Route**:
   - Notice the **Recommended Route** achieves a **100/100 Mobility Score**, **0 stairs**, and **3 compliant ramps**.
   - Compare with the **Direct Standard Route**, which has **22 stairs** and broken pavement.
   - Review the **AI Route Intelligence Rationale** card explaining the tradeoffs.
5. In the amber simulation card, click **"Simulate Blocked Ramp & Trigger Reroute"**:
   - The map displays the newly blocked segment in red.
   - The graph solver automatically reroutes along Swaroop Nagar accessible boulevard (+120m, 100% step-free).
   - An alert banner explains why the route changed.
6. Click **"Clear Barrier & Restore Direct Route"** to reset.

### Scenario B: Roadside Rescue & WAV Hoist Matching
1. Switch to the **Roadside Rescue** tab.
2. Breakdown service is set to **Flat Tyre / Puncture Repair** at **PSIT Kanpur — Gate 1, Bhauti**.
3. Enable the **Wheelchair Hoist / WAV Hydraulic Lift Required** checkbox.
4. The ranked list instantly filters and prioritizes providers equipped with verified hydraulic wheelchair lifts (e.g. *Apex WAV Specialized Rescue* with a 99% match score and 8-min ETA).
5. Click **"Dispatch This Unit"**:
   - Opens the **Live Dispatch Tracking Simulator**.
   - View real-time progress steps: *Matching ➔ Assigned ➔ In Transit ➔ Arrived ➔ Completed*.
   - Use the Catalyst Judge simulation buttons to advance steps or test driver calling.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 18, TypeScript, Tailwind CSS, Lucide React Icons |
| **Mapping & GIS** | Leaflet 1.9, OpenStreetMap, Custom SVG DivIcons, Polyline visualizers |
| **Routing Algorithm**| Custom Graph Dijkstra & A\* Solver with Weighted Cost Multipliers |
| **AI Engine** | On-Device Heuristic NLP Engine (Server-side Gemini LLM planned for Phase 3) |
| **Storage & State** | LocalStorage Persistence (Demo Mode) + PostgreSQL / Supabase SQL Schema |
| **Build Tool** | Vite 6 |

---

## 📦 Project Structure

```
AccessResQ/
├── index.html                   # Entry HTML with accessible typography and Leaflet CSS
├── package.json                 # Project dependencies & build scripts
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Emerald green, white, navy custom theme
├── tsconfig.json                # TypeScript strict configuration
├── supabase_schema.sql          # Complete PostgreSQL schema for production backend
├── src/
│   ├── main.tsx                 # React entrypoint
│   ├── App.tsx                  # Root state orchestration & tab switcher
│   ├── index.css                # Tailwind CSS imports & animations
│   ├── types/
│   │   ├── navigation.ts        # Route, node, segment, and coordinate interfaces
│   │   ├── rescue.ts            # Rescue providers, service types, request interfaces
│   │   ├── community.ts         # Barrier reports, severity, status interfaces
│   │   └── ai.ts                # AI classification, summarization, and explanation types
│   ├── data/
│   │   ├── locations.ts         # Canonical Kanpur locations (PSIT Kanpur, Z Square Mall, etc.)
│   │   ├── routeNetwork.ts      # Spatial graph network nodes and segments
│   │   ├── rescueProviders.ts   # Seeded verified roadside rescue units
│   │   └── communityReports.ts  # Seeded crowdsourced barrier reports
│   ├── services/
│   │   ├── routingEngine.ts     # Dijkstra / A* graph solver with preference weighting
│   │   ├── matchingEngine.ts    # Multi-criteria roadside provider matching
│   │   ├── aiEngine.ts          # Rule-based NLP classifier + Gemini API integration
│   │   └── storageService.ts    # LocalStorage persistence layer
│   └── components/
│       ├── layout/
│       │   ├── Navbar.tsx       # Brand header, tabs, wheelchair toggle, SOS trigger
│       │   └── Footer.tsx       # Footer links and Catalyst Hack attribution
│       ├── common/
│       │   ├── LeafletMap.tsx   # Interactive Leaflet map with custom accessibility markers
│       │   └── SettingsModal.tsx# AI API key configuration and database info
│       ├── dashboard/
│       │   └── DashboardView.tsx# KPI metric cards, quick search, live fleet overview
│       ├── navigation/
│       │   └── AccessibleRoutesView.tsx # Origin/destination, preferences, route comparison
│       ├── rescue/
│       │   ├── RoadsideRescueView.tsx   # Assistance categories, WAV hoist filter, ranked helpers
│       │   └── RequestRescueModal.tsx   # Live dispatch tracking & simulator controls
│       ├── community/
│       │   ├── CommunityView.tsx        # Filterable barrier feed, upvoting, status progression
│       │   └── ReportBarrierModal.tsx   # AI-assisted barrier reporting dialog
│       ├── sos/
│       │   └── SOSModal.tsx             # Emergency dispatch packet builder & dialer links
│       └── demo/
│           └── DemoGuideModal.tsx       # Interactive judge walkthrough dialog
```

---

## ⚡ Quick Start & Setup Instructions

### 1. Prerequisites
- Node.js version 18.x or higher
- npm 9.x or higher

### 2. Installation
```bash
git clone <repo-url>
cd AccessResQ
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized, minified production build in the `/dist` directory.

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

For production deployment with a real backend:
1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Copy and run the entire contents of [`supabase_schema.sql`](./supabase_schema.sql).
4. This will create:
   - `profiles` with Row-Level Security (RLS)
   - `accessibility_preferences`
   - `locations` and `route_segments`
   - `community_barriers` and `barrier_confirmations`
   - `rescue_providers` and `rescue_requests`
   - `verification_logs` for tamper-proof status auditing.

---

## 📊 Implemented Features vs. Future Enhancements

### Fully Implemented in Current Release:
- [x] Complete interactive UI adhering to the green, white, and navy design system.
- [x] Graph-based Dijkstra accessible routing with step penalties, ramp bonuses, and surface multipliers.
- [x] Dynamic rerouting avoiding user-reported blocked ramps and obstacles.
- [x] Side-by-side comparison of Recommended Step-Free Route vs. Direct Standard Route.
- [x] Turn-by-turn accessible guidance with leg distances and compliance notes.
- [x] Multi-criteria Roadside Rescue matcher filtering by wheelchair hydraulic hoist/lift capability.
- [x] Simulated live dispatch tracker with multi-stage progress (Requested ➔ Assigned ➔ In Transit ➔ Arrived ➔ Completed).
- [x] Community barrier reporting with category classification, severity selection, and photo support.
- [x] Community verification workflow (+1 confirmations upgrade reports from Pending to Community Confirmed).
- [x] Emergency SOS portal with instant geolocation broadcasting, WhatsApp dispatch, and emergency dialers.
- [x] Local heuristic NLP AI Engine for barrier classification, keyword extraction, and routing explainability (zero API keys needed).
- [ ] Server-side Gemini 3.8 Flash LLM integration via secure backend proxy (Phase 3).
- [x] Built-in Catalyst Hack 2026 Judge Walkthrough with 1-click Demo A and Demo B presets.
- [x] High-contrast accessibility theme toggle.

### Future Roadmap Enhancements:
- [ ] Integration with municipal IoT curb sensors and smart traffic light audio beacons.
- [ ] Direct telemetry integration with electric wheelchair CAN-bus controllers for real-time battery and motor diagnostic alerts.
- [ ] Native mobile apps (iOS & Android) with turn-by-turn haptic vibration navigation.
- [ ] Government open data sync with National Urban Digital Mission (NUDM) accessibility databases.

---

## 🏆 Catalyst Hack 2026 Submission Summary

AccessResQ was conceived and developed to solve a real, urgent, and overlooked mobility challenge: standard navigation tools optimize exclusively for distance and traffic, often leading wheelchair users directly into uncrossable staircases, broken footpaths, and high curbs. When breakdowns occur, generic roadside tow trucks lack the hydraulic hoists necessary to safely transport disabled passengers.

AccessResQ solves both challenges in an elegant, unified, and community-powered ecosystem.

