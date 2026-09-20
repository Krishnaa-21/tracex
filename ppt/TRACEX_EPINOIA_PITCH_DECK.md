# TraceX — EPINOIA 2026 Presentation Specification (Revised Clean Deck)
**Flagship Hackathon Event | Atharv Ranbhoomi 2026 × IIM Indore**  
**Team Name:** Thunderbytes | **Institution:** Shri Vaishnav Vidyapeeth Vishwavidyalaya (SVVV), Indore  
**File Output:** [TraceX_EPINOIA_Presentation.pptx](file:///d:/tracex/TraceX_EPINOIA_Presentation.pptx) and [ppt/TraceX_EPINOIA_Presentation.pptx](file:///d:/tracex/ppt/TraceX_EPINOIA_Presentation.pptx)  
**Interactive Web Deck:** [ppt/index.html](file:///d:/tracex/ppt/index.html)  

---

## Strategic Narrative (9 Slides)

The deck answers the 5 critical hackathon jury questions within seconds:
1. **What is the problem?** (Slide 2: The Golden Hour Dilemma & Evidence Silos)
2. **What did we build?** (Slide 3: TraceX Unified Operational Console)
3. **How does it work?** (Slide 4: Simple 4-Step Pipeline)
4. **What is technically interesting & working?** (Slide 5: Implemented Features & Slide 6: Architecture Stack)
5. **Why does it matter?** (Slide 7: Innovation & Impact, Slide 8: Team, Slide 9: Demo & Verification)

---

### Slide 1: Cover / Project Hook
* **Category Tag:** `EPINOIA 2026 • FLAGSHIP HACKATHON • ATHARV RANBHOOMI, IIM INDORE`
* **Title:** **TraceX**
* **Subtitle:** AI-Powered Cyber Fraud Intelligence & Correlation Console
* **Hook:** *Empowering police investigating officers to connect disparate telecom, banking, and digital evidence within minutes—stopping illicit fund transfers during the critical Golden Hour.*
* **Event Branding:** Official Atharv Ranbhoomi '26 Emblem & IIM Indore Qualifier Badge.
* **Attribution:** Presented by Team Thunderbytes • Shri Vaishnav Vidyapeeth Vishwavidyalaya (SVVV), Indore.

---

### Slide 2: The Real-World Challenge
* **Category Tag:** `The Real-World Challenge`
* **Title:** Why Investigating Cyber Fraud Takes Days Instead of Hours
* **Layout:** 3 spacious, high-contrast vertical cards.
* **1. Fragmented Evidence (Coral `#F43F5E`):**
  * Multi-Vendor Formats: Police receive messy raw Excel sheets from 10+ banks, CDR text dumps from telcos, and `.eml` logs.
  * Manual Spreadsheet Checks: Investigating Officers spend hours running VLOOKUPs across 10,000+ transaction rows.
  * Zero Interoperability: No standard schema connects cell towers, bank accounts, and UPI handles.
* **2. The Lost Golden Hour (Amber `#F59E0B`):**
  * Rapid Fund Layering: Stolen money is routed through 4 to 6 mule accounts and withdrawn at ATMs within 45 minutes.
  * 48-Hour Delay: Manual spreadsheet analysis takes 24 to 72 hours. By the time links are spotted, accounts are empty.
  * Disposable Infrastructure: Fraudsters abandon burner SIMs and temporary VPAs within hours, leaving cold trails.
* **3. Cross-Case Blind Spots (Purple `#939CFA`):**
  * Organized Crime Syndicates: The same mule account is active across 15+ FIRs in multiple districts simultaneously.
  * Station-Level Silos: Bhopal Cyber Cell has no automated way to know that Indore Police is tracking the same IMEI device.
  * Officer Workload Surge: Hundreds of complaints flood in daily on 1930/NCRP with limited cyber staff.

---

### Slide 3: Our Solution
* **Category Tag:** `Our Solution`
* **Title:** TraceX: A Unified Operations Console for Law Enforcement
* **Layout:** 2-column layout (Left: 2 Core Pillars; Right: Operational Advantages).
* **Core Pillars:**
  * **1. Ingestion to Correlation in Minutes (Cyan):** TraceX ingests messy real-world evidence—CDRs, bank account sheets, UPI logs, IPDR dumps, and email headers. Our automated normalization pipeline standardizes and links all entities on an interactive visual graph in seconds.
  * **2. Grounded AI & Statutory Freeze Directives (Emerald):** Combines an evidence-grounded AI Co-pilot with automated PDF generators that produce court-ready Section 91 CrPC Bank Debit-Freeze notices and Section 69A IT Act Emergency Takedowns with tamper-evident SHA-256 cryptographic verification.
* **Operational Advantages:**
  * **From 48h to 3m:** Case triage and entity correlation accelerated by 95% within the Golden Hour.
  * **100% Schema Agnostic:** Ingests telecom and bank files without requiring departments to change formats.
  * **Cross-Case Alerts:** Instantly highlights when a suspect account is tied to multiple police FIRs.
  * **Dual Operational UX:** Tactical Dark Mode for cyber analysts + Formal Government Skin for court documentation.

---

### Slide 4: System Workflow
* **Category Tag:** `System Workflow`
* **Title:** How TraceX Works: A Simple 4-Step Pipeline
* **Layout:** 4 linear, horizontal step cards connected logically.
* **Step 01: Ingestion & ETL (Cyan):**
  * Raw File Upload: Drop in CDR, Bank Excel, UPI statements, and `.eml` logs.
  * Sanitization: Normalizes phone numbers (E.164), UPI handles, and bank accounts.
  * Evidence Seal: Indexes files with SHA-256 integrity hashes.
* **Step 02: Correlation (Purple):**
  * Entity Extraction: Phones, Accounts, VPAs, IPs, IMEIs, and Domains.
  * Multi-Hop Graph: NetworkX builds 1st, 2nd, and 3rd-degree relationship chains.
  * Syndicate Match: Auto-flags entities shared across multiple cases.
* **Step 03: Risk Scoring (Coral):**
  * Fraud Profiles: Rules calibrated for UPI scams, investment fraud, and sextortion.
  * Velocity Indicators: Detects rapid fund transfers across multiple mule layers.
  * Composite Score: Produces an intuitive 0–100 threat rating.
* **Step 04: Action & Output (Emerald):**
  * Interactive Graph: Force-directed visual workspace with category filters.
  * Legal Directives: Instant generation of Section 91 CrPC Bank Freeze orders.
  * AI Assistant: Grounded Co-pilot answers queries with offline fallback.

---

### Slide 5: Implemented Capabilities
* **Category Tag:** `Implemented Capabilities`
* **Title:** Core Features Built & Working in GitHub Today
* **Layout:** 2x2 spacious card grid with exact repository paths.
* **1. Heterogeneous Evidence ETL (`backend/app/services/ingestion/`):**
  * Ingests and normalizes real-world CDRs, bank Excel dumps, UPI statements, and `.eml` email headers into clean entity records without requiring strict schemas.
* **2. Clustered Multi-Hop Graph (`frontend/src/pages/ConnectionsGraph.jsx`):**
  * Interactive force-directed graph with hub-and-spoke grouping, physics pause, and entity category color coding (phone, bank, UPI, IP, IMEI).
* **3. Scam-Profile Risk Scoring (`backend/app/services/risk/scoring.py`):**
  * Calculates composite 0–100 threat ratings based on transaction velocity, mule account reuse, burner SIMs, and cross-case linkage confidence.
* **4. Statutory Freeze Directives (`backend/app/services/reports/pdf_generator.py`):**
  * Instant ReportLab vector generation of Section 91 CrPC Bank Debit Freeze notices and Section 69A IT Act Takedown orders with SHA-256 seal.

---

### Slide 6: Technical Implementation
* **Category Tag:** `Technical Implementation`
* **Title:** Technology Stack & High-Level Architecture
* **Layout:** 2 equal columns (Simple architectural flow on left, actual tech stack on right).
* **Simple Architecture Flow:**
  * **User Interface (React 18 + Vite SPA):** Dual UX Cockpit: Tactical Dark Mode for analysts + Government Skin for formal court filing.
  * **REST APIs (FastAPI + Uvicorn):** High-concurrency ASGI server with OAuth2 JWT Auth, Pydantic v2 validation, and CORS middleware.
  * **Analytics Engine (NetworkX + Pandas):** Multi-hop graph builder, E.164 phone normalization, and scam-profile risk heuristics.
  * **Persistence & Reports (SQLAlchemy + ReportLab):** Case database with SHA-256 hash sealing and court-admissible vector PDF directives.
* **Actual GitHub Tech Stack:**
  * **Frontend:** React 18, Vite 5, Tailwind CSS, React Router v6, Lucide Icons.
  * **Backend Server:** Python 3.11+, FastAPI (ASGI), Uvicorn High-Concurrency Server.
  * **Graph & Analytics:** NetworkX (multi-hop graph theory), Pandas, OpenPyXL.
  * **AI Co-Pilot:** GPT-4o-mini with Grounded RAG + 100% Offline Rule Engine Fallback.
  * **Document Engine:** ReportLab Vector PDF Generator (with WeasyPrint fallback).
  * **Security:** OAuth2 JWT (HS256), Bcrypt Password Hashing, SHA-256 Verification.

---

### Slide 7: Innovation & Impact
* **Category Tag:** `Innovation & Impact`
* **Title:** Why TraceX Wins: Operational Reality & Governance Impact
* **Layout:** 2 high-contrast columns (Innovations vs Measurable Impact).
* **Key Technical Innovations:**
  * **Zero-Disruption Police Workflow:** Works natively with raw Excel and CDR dumps police already receive daily. No proprietary database formatting required.
  * **Dual-Engine Resilient AI:** Grounded RAG strictly constrained to case evidence + a 100% offline deterministic rule engine fallback for zero courtroom hallucinations.
  * **Dual Operational UX:** Tactical Dark SOC cockpit for forensic analysts + Minimalist Standard Government skin for senior administrative review.
* **Measurable Real-World Impact:**
  * **For Investigating Officers:** Cuts evidence parsing and correlation from 48+ hours to under 3 minutes, solving the Golden Hour bottleneck.
  * **For Cyber Crime Victims:** Freezes destination mule accounts before money is laundered through ATMs, drastically improving recovery rates.
  * **For Police Leadership & Courts:** Produces court-admissible forensic dossiers sealed with SHA-256 hashes to secure high conviction rates.

---

### Slide 8: Team & Ownership (Dedicated Team Slide)
* **Category Tag:** `Team & Ownership`
* **Title:** Team Thunderbytes • Shri Vaishnav Vidyapeeth Vishwavidyalaya
* **Layout:** 2x2 spacious grid of member profile cards.
* **1. Ankit Tank (Cyan Accent):**
  * Role: Team Leader & Product Strategist
  * Contact: `ankittank9977@gmail.com` • `+91 9977577014`
  * Focus: Lead coordination, legal workflow research, product scope, and police operational requirements.
* **2. Krishna Prajapat (Purple Accent):**
  * Role: System Architect & Frontend Lead
  * Contact: `krishnaaaprajapattt@gmail.com` • `LinkedIn: krishna-prajapat-k2102`
  * Focus: React 18 architecture, interactive SVG network graph visualization, state engine, and deployment.
* **3. Avnish Sharma (Amber Accent):**
  * Role: Backend & Correlation Engine Lead
  * Contact: `avnishsharma4316@gmail.com` • `LinkedIn: avnish-sharma-92a964376`
  * Focus: FastAPI backend, NetworkX multi-hop correlation engine, E.164 phone & UPI ingestion parsers.
* **4. Tarun Pandya (Emerald Accent):**
  * Role: Forensics & Risk Modeling Lead
  * Contact: `pandyatarun65@gmail.com` • `LinkedIn: tarun-pandya-9b91523a4`
  * Focus: ReportLab statutory legal PDF generation, scam-profile risk scoring models, test validation.

---

### Slide 9: Demonstration & Verification (Dedicated Demo & Closing)
* **Category Tag:** `Demonstration & Verification`
* **Title:** Live Demo, Open-Source Codebase & Final Synthesis
* **Layout:** 2 equal cards on top, full-width closing quote banner at bottom.
* **Card 1: Verified Project Assets (Emerald Accent):**
  * **Live Deployment:** `https://tracex-frontend-3.onrender.com/`
  * **Officer Test Login:** Badge ID: `MP-IO-4471` | Password: `demo1234`
  * **Video Walkthrough:** `https://youtu.be/oUuxdL-CVBA`
  * **GitHub Repository:** `https://github.com/Krishnaa-21/tracex`
* **Card 2: What You Will See in the Demo (Cyan Accent):**
  * **1. Multi-Format Evidence Ingestion:** Upload raw bank Excel sheets and CDR logs into an active case.
  * **2. Real-Time Network Graph:** Automatic force-directed correlation clustering suspect phones, accounts, and IPs.
  * **3. Dynamic Threat Scoring:** Composite 0-100 risk score calculation highlighting mule accounts.
  * **4. One-Click Statutory Orders:** Instant generation of court-admissible Section 91 CrPC Bank Freeze directives.
* **Closing Statement:**
  > *"Cyber criminals operate at machine speed. Law enforcement can no longer investigate at human speed. TraceX levels the playing field."*

---

## Design System & Theme Specifications

* **Canvas Background:** `#0A0F1D` (Deep Midnight Blue) — 100% consistent across all slides.
* **Surface Cards:** `#121C2F` (Deep Slate) with clean `#283A5A` borders.
* **Text Readability:** All headings in pure white (`#FFFFFF`), body text in high-contrast light slate (`#DAE4F0`), secondary metadata in muted slate (`#94A3B8`). Zero dark-on-dark text anywhere.
* **Accents:** Neon Cyan (`#00D4FF`), Sky Cyan (`#7DE3FF`), Emerald Green (`#10B981`), Crimson Coral (`#F43F5E`), Amber Gold (`#F59E0B`), Forensic Purple (`#939CFA`).
