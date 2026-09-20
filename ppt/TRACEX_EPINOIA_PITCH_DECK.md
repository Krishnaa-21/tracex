# TraceX — EPINOIA 2026 Pitch Deck Specification
**Flagship Hackathon Event | Atharv Ranbhoomi 2026 × IIM Indore**  
**Team Name:** Thunderbytes | **Institution:** Shri Vaishnav Vidyapeeth Vishwavidyalaya (SVVV), Indore  
**Round:** Round 1 (Online Qualifier / Idea Screening Round)  
**Live Application:** [https://tracex-frontend-3.onrender.com/](https://tracex-frontend-3.onrender.com/)  
**Video Demonstration:** [https://youtu.be/oUuxdL-CVBA](https://youtu.be/oUuxdL-CVBA)  
**GitHub Repository:** [https://github.com/Krishnaa-21/tracex](https://github.com/Krishnaa-21/tracex)  

---

## Executive Summary & Hackathon Context

**EPINOIA** is the flagship hackathon of **Atharv Ranbhoomi**, organized by the Integrated Programme in Management (IPM) at the **Indian Institute of Management (IIM) Indore**. Rather than evaluating raw coding speed or theoretical slides, EPINOIA prioritizes **problem-solving instinct, technical depth, real-world viability, and the execution of a shippable product**.

This deck is engineered specifically for **Round 1 shortlisting**. It converts the complex digital forensics and graph theory implemented in the repository into a crisp, judge-friendly narrative that proves **TraceX is a functioning, deployed operations console**, not a concept mockup.

---

## Complete Slide-by-Slide Content & Visual Direction

---

### Slide 1: Cover / Powerful Hook

* **Category Tag:** `EPINOIA 2026 • FLAGSHIP HACKATHON • ATHARV RANBHOOMI × IIM INDORE`
* **Slide Title:** **TraceX**
* **Subtitle:** Unified Cyber Fraud Intelligence & Forensic Correlation Console
* **Value Hook:** *Automating multi-hop entity correlation, cross-case syndicate discovery, and statutory freeze directives for Law Enforcement during the critical Golden Hour.*

#### On-Slide Content (Cards & Badges)
```
[Left Side / Hero]
• TraceX: Unified Cyber Fraud Intelligence & Forensic Correlation Console
• "From Ingested Evidence to Court-Admissible Freeze Directives in Under 3 Minutes."

[Team Credentials Card]
TEAM THUNDERBYTES • Shri Vaishnav Vidyapeeth Vishwavidyalaya (SVVV), Indore
• Ankit Tank (Team Leader) — ankittank9977@gmail.com | +91 9977577014
• Krishna Prajapat (System Architect & Frontend) — krishnaaaprajapattt@gmail.com
• Avnish Sharma (Backend & Correlation Engine) — avnishsharma4316@gmail.com
• Tarun Pandya (Forensic Reports & Risk Models) — pandyatarun65@gmail.com

[Verified Project Links Card]
• Live Deployment: https://tracex-frontend-3.onrender.com/
• Video Demonstration: https://youtu.be/oUuxdL-CVBA
• GitHub Repository: https://github.com/Krishnaa-21/tracex
• Default Officer Login: Badge ID: MP-IO-4471 | Password: demo1234
```

#### Visual & Layout Direction
* **Layout:** Asymmetric 2-column split. Left side features high-contrast typography with neon cyan (`#00D4FF`) accents. Right side features an official emblem card housing the **Atharv Ranbhoomi 2026** crest with clean event badges.
* **Colors:** Deep midnight navy (`#0B1120`) background, subtle glowing border on the team card.
* **Assets Required:** [atharv_ranbhoomi_logo.png](file:///d:/tracex/ppt/assets/atharv_ranbhoomi_logo.png) and [tracex_logo.png](file:///d:/tracex/ppt/assets/tracex_logo.png).

#### Speaker Notes
> *"Respected jury members, we are Team Thunderbytes from SVVV Indore presenting TraceX for EPINOIA at Atharv Ranbhoomi, IIM Indore. TraceX is an operational cyber fraud intelligence operations room engineered for police investigating officers to connect disparate telecom, banking, and digital evidence within seconds during the critical Golden Hour."*

---

### Slide 2: The Problem

* **Category Tag:** `Problem Statement & Real-World Friction`
* **Slide Title:** The Golden Hour Paralysis in Cyber Crime Investigation
* **Core Takeaway:** *Evidence silos and manual spreadsheet matching allow fraud syndicates to launder funds before police can act.*

#### On-Slide Content (3 Problem Cards)

1. **Card 1: Fragmented Evidence Silos (Color: Coral `#F43F5E`)**
   * **Heterogeneous Formats:** Investigating Officers (IOs) receive Excel dumps from 10+ different banks, CDR/IPDR raw text from telcos, and `.eml` email logs.
   * **Manual Cell-by-Cell Cross Checks:** Officers spend hours performing manual spreadsheet VLOOKUPs across 10,000+ transaction rows.
   * **Zero Unified Schema:** No interoperability exists between bank statements, UPI merchant sheets, and cellular tower coordinates.

2. **Card 2: Lost Golden Hour (< 2 Hours) (Color: Amber `#F59E0B`)**
   * **Rapid Multi-Hop Laundering:** Stolen cyber funds are routed through 4 to 6 mule accounts and withdrawn at ATMs within 45 minutes of the fraud.
   * **48-Hour Investigation Delay:** Manual analysis takes 24–72 hours per case. By the time links are found, accounts are empty.
   * **Disposable Infrastructure:** Cyber syndicates discard SIM cards and burner VPAs within hours, turning trails cold.

3. **Card 3: Cross-Case Blind Spots (Color: Purple `#818CF8`)**
   * **Organized Crime Syndicates:** The same beneficiary bank account or phone number is often active across 15 FIRs in 4 different districts simultaneously.
   * **Station-Level Silos:** A police station in Bhopal has no automated way of knowing Indore Cyber Cell is tracking the exact same IMEI device.
   * **Officer Workload Surge:** Thousands of daily complaints on 1930/NCRP with limited technical cyber staff.

#### Visual & Layout Direction
* **Layout:** 3 vertical cards side-by-side. Each card has a distinctive colored top border (Coral, Amber, Purple) to visually categorize the friction points.
* **Typography:** Bold card titles with concise, scannable bullet points.

#### Speaker Notes
> *"In cyber fraud investigations, the first 2 hours are known as the 'Golden Hour'. Right now, Indian police officers receive unstructured CDR text logs and bank spreadsheets from dozens of financial institutions. Sifting through these manually takes days, allowing cyber syndicates to layer and withdraw funds through mule networks. Furthermore, police stations work in isolation, failing to detect syndicates operating across state borders."*

---

### Slide 3: Our Solution

* **Category Tag:** `Solution Overview`
* **Slide Title:** TraceX: Unified Cyber Crime Operations Console
* **Core Takeaway:** *A single operational console that converts raw evidence into connected intelligence and legal action in minutes.*

#### On-Slide Content (Pillars & Metrics Grid)

* **Pillar 1: Ingestion to Correlation in Seconds (Accent: Cyan `#00D4FF`)**
  * TraceX ingests disparate digital evidence—CDRs, bank account sheets, UPI transaction dumps, IPDR records, and email headers. Our automated normalization pipeline extracts, standardizes, and resolves entities into a unified graph in real time.
* **Pillar 2: Grounded AI & Statutory Freeze Directives (Accent: Emerald `#10B981`)**
  * Combines an offline-resilient AI Co-pilot grounded in case evidence with automated PDF generators that produce court-admissible Section 91 CrPC Bank Debit Freeze notices and Section 69A IT Act Emergency Takedown orders with SHA-256 integrity verification.

* **Quantifiable Advantages:**
  * **From 48 Hours to 3 Minutes:** Evidence processing and case triage accelerated by 95% within the Golden Hour.
  * **100% Schema Agnostic:** Native parsing for telecom CDRs, Indian bank spreadsheets, and device logs.
  * **Cross-Case Syndicate Discovery:** Automatically alerts officers when an entity appears in other ongoing police cases.
  * **Dual Operational UX:** Tactical Dark SOC cockpit for forensic analysts + Minimalist Standard Government skin for senior administrative review.

#### Visual & Layout Direction
* **Layout:** 2/3 split. Left side displays the 2 core value pillars with glowing left accent borders. Right side displays a structured metrics card highlighting quantifiable operational improvements.

#### Speaker Notes
> *"TraceX solves this by acting as a single, unified operations room. We eliminate manual Excel comparisons by providing an end-to-end pipeline: evidence ingestion, graph correlation, heuristic risk scoring, and one-click statutory directive generation. What previously took an officer 48 hours is achieved in under three minutes."*

---

### Slide 4: How It Works (End-to-End Pipeline)

* **Category Tag:** `System Pipeline`
* **Slide Title:** End-to-End Investigative Architecture Flow
* **Core Takeaway:** *From raw evidence to statutory freeze orders in a seamless 4-stage automated pipeline.*

#### On-Slide Content (4 Horizontal Steps)

1. **STEP 01: INGESTION & ETL (Accent: Cyan)**
   * **Raw Ingestion:** Drag-and-drop CDR, Bank Excel, UPI statements, and `.eml` logs.
   * **Sanitization:** E.164 phone normalizer, UPI VPA cleanups, IFSC validator.
   * **Evidence Store:** Hash-indexed storage of original files in database.
2. **STEP 02: GRAPH CORRELATION (Accent: Purple)**
   * **Entity Extraction:** Phones, Accounts, VPAs, IPs, IMEIs, Domains.
   * **NetworkX Graph:** Resolves 1st, 2nd, and 3rd-hop connection chains.
   * **Syndicate Match:** Flags entities overlapping with other FIR cases.
3. **STEP 03: RISK SCORING (Accent: Coral)**
   * **Scam Profiles:** Heuristic models for UPI scam, investment fraud, and sextortion.
   * **Velocity Logic:** Rapid fund transfer indicators across mule layers.
   * **Composite Score:** 0–100 threat rating with confidence calculations.
4. **STEP 04: ACTION & REPORT (Accent: Emerald)**
   * **Interactive Graph:** Force layout with physics control and entity filters.
   * **Statutory PDF:** Instant Sec 91 CrPC & Sec 69A IT Act legal orders.
   * **Forensic AI Chat:** Grounded Co-pilot answers case queries with offline fallback.

#### Visual & Layout Direction
* **Layout:** 4-column horizontal pipeline cards connected with directional chevron arrows (`➔`).
* **Visual Elements:** Numbered step badges (`STEP 01` to `STEP 04`) with color-coded headers.

#### Speaker Notes
> *"Here is the exact technical pipeline we built. Step 1 ingests raw evidence and standardizes identifiers like phone numbers and IFSC codes. Step 2 builds a NetworkX correlation graph that links multiple cases together. Step 3 applies heuristic risk models based on the specific fraud type. Step 4 presents an interactive visual workspace and generates court-admissible PDF orders ready to be dispatched to banks and telecom operators."*

---

### Slide 5: Key Implemented Features

* **Category Tag:** `Functional Capabilities`
* **Slide Title:** 6 Production-Ready Implemented Features
* **Core Takeaway:** *Every feature is fully implemented in active code, rigorously tested, and live.*

#### On-Slide Content (2x3 Grid)

1. **Heterogeneous Evidence ETL** (`backend/app/services/ingestion/`)
   * Parses CDRs, Bank statements, UPI sheets, IPDRs, and `.eml` email headers into normalized entity records.
2. **Clustered Multi-Hop Graph** (`frontend/src/pages/ConnectionsGraph.jsx`)
   * Force-directed interactive visualization with hub-and-spoke clustering, entity category color coding, and physics control.
3. **Dynamic Scam-Profile Risk Scoring** (`backend/app/services/risk/scoring.py`)
   * Calculates composite 0-100 threat scores using transaction velocity, shared mule accounts, and burner SIM patterns.
4. **Automated Statutory Legal Orders** (`backend/app/services/reports/pdf_generator.py`)
   * Instant ReportLab generation of Section 91 CrPC Bank Freeze & Section 69A IT Act Takedown orders with SHA-256 seal.
5. **Grounded Cyber Intelligence Co-Pilot** (`backend/app/services/ai/chat_engine.py`)
   * GPT-4o-mini powered investigative assistant with strict RAG case-grounding and seamless offline rule-based fallback.
6. **Dual Operational UX Architecture** (`frontend/src/context/ModeContext.jsx`)
   * One-click switch between dark Tactical Analysis Mode (SOC cockpit) and formal Standard Mode (government portal skin).

#### Visual & Layout Direction
* **Layout:** 2 rows × 3 columns grid of clean cards. Each card displays the feature title, the exact backend/frontend repository module path in monospace font (`JetBrains Mono`), and a concise description.

#### Speaker Notes
> *"Every single feature listed here is fully written and running in our repository today. We built real ingestion parsers, a mathematical graph correlation engine, scam-calibrated risk scoring, automated statutory PDF directives, an offline-resilient AI Co-pilot, and dual operational skins designed specifically for Indian police workflows."*

---

### Slide 6: Technology & Architecture

* **Category Tag:** `Technical Architecture`
* **Slide Title:** Full-Stack Codebase Stack from GitHub
* **Core Takeaway:** *Modern, high-performance architecture built for low latency, security, and evidentiary integrity.*

#### On-Slide Content (4 Layer Columns)

1. **FRONTEND LAYER (Cyan)**
   * **Core Framework:** React 18 SPA + Vite 5
   * **Styling System:** Tailwind CSS + Lucide Icons
   * **Client Routing:** React Router DOM v6 with SPA rewrites
   * **Visualization:** Custom SVG Clustered Graph Engine
   * **State Engine:** ModeContext (Analysis vs Standard)
2. **BACKEND API LAYER (Purple)**
   * **Framework:** Python 3.11+ / FastAPI (ASGI)
   * **Web Server:** Uvicorn High-Concurrency ASGI Server
   * **Data Schemas:** Pydantic v2 strict typing & validations
   * **Security & Auth:** OAuth2 JWT (HS256) + Bcrypt hashing
   * **Network & CORS:** Production regex middleware
3. **ANALYTICS & AI CORE (Coral)**
   * **Graph Theory:** NetworkX multi-hop entity graphs
   * **Evidence Parsing:** Pandas + OpenPyXL tabular ETL
   * **AI Model:** GPT-4o-mini with Grounded RAG
   * **Failover Safety:** Deterministic offline rule engine
   * **Scam Profiles:** Custom heuristic weighting models
4. **DATABASE & REPORTS (Emerald)**
   * **Database ORM:** SQLAlchemy (PostgreSQL / SQLite)
   * **PDF Core:** ReportLab Vector Engine
   * **Fallback PDF:** WeasyPrint CSS Paged Media
   * **Integrity Seal:** SHA-256 cryptographic verification
   * **PDF Security:** Standard AES encryption support

#### Visual & Layout Direction
* **Layout:** 4 structured vertical technical stack pillars.
* **Styling:** Monospace bullet points for technical specs, category color coding.

#### Speaker Notes
> *"Our architecture is modern, clean, and highly scalable. On the frontend, React 18 and Vite deliver a sub-second, highly responsive interface. On the backend, FastAPI and NetworkX handle multi-hop graph resolution in milliseconds. Our AI layer features strict RAG grounding, and ReportLab produces court-admissible vector PDFs with cryptographic verification."*

---

### Slide 7: What Makes Us Different

* **Category Tag:** `Competitive Advantage`
* **Slide Title:** Evidence-Backed Technical Differentiators
* **Core Takeaway:** *Purpose-built for police operational constraints, legal admissibility, and zero workflow disruption.*

#### On-Slide Content (4 Differentiator Cards)

1. **1. ZERO-DISRUPTION POLICE WORKFLOW (Accent: Cyan)**
   * Conventional forensic tools require custom hardware or expensive proprietary database formats. TraceX works directly with raw Excel dumps, CDR text files, and bank statements that officers already receive daily from telecom and banking nodal officers.
2. **2. DUAL-ENGINE RESILIENT AI (NO HALLUCINATIONS) (Accent: Emerald)**
   * Most AI prototypes break when APIs fail or invent fake case facts. TraceX uses strict RAG prompting where the LLM is constrained to case data, backed by a 100% offline deterministic rule engine fallback for courtroom evidentiary integrity.
3. **3. AUTOMATED CROSS-CASE SYNDICATE DETECTION (Accent: Purple)**
   * While standard police tools analyze cases in isolation, TraceX automatically correlates entities across different FIRs to reveal multi-district mule rings, shared phone numbers, and common fraud infrastructure.
4. **4. COURT-READY STATUTORY DIRECTIVES (Accent: Amber)**
   * TraceX doesn't just show visual charts; it automates legal action. Generating Section 91 CrPC and Section 69A IT Act orders with SHA-256 hashes and password encryption transforms analytical insight into immediate law enforcement action.

#### Visual & Layout Direction
* **Layout:** 2x2 grid of wide cards with glowing left accent borders.
* **Focus:** Highlighting practical, operational advantages that matter to judges and police leadership.

#### Speaker Notes
> *"Unlike generic student projects, TraceX is designed around the realities of Indian police work. We don't ask officers to change their evidence formats. Our AI never hallucinates in court because it is strictly grounded in evidence with offline fallback. And most importantly, we bridge the gap between intelligence and legal action through automated statutory freeze directives."*

---

### Slide 8: Impact & Roadmap

* **Category Tag:** `Impact & Scalability`
* **Slide Title:** Measurable Impact & Future Growth Scope
* **Core Takeaway:** *Direct citizen and police impact today, with a clear enterprise roadmap for national cyber scale.*

#### On-Slide Content (2 Split Columns)

* **Column 1: MEASURABLE REAL-WORLD IMPACT**
  * **Investigating Officers (IOs):** Cuts evidence parsing and spreadsheet matching from 48+ hours to under 3 minutes, accelerating triage.
  * **Cyber Fraud Victims:** Immediate identification of destination accounts allows freezing funds during the Golden Hour before cash is laundered.
  * **Police Leadership:** Standardized, tamper-evident forensic dossiers with SHA-256 hash verification for charge sheets.
  * **State Cyber Coordination (I4C):** Reveals statewide criminal syndicates operating across city and district jurisdictions.

* **Column 2: PHASED SCALABILITY ROADMAP (Implemented vs Future Scope)**
  * **Currently Implemented (v1.0 Ready):** Full multi-format ingestion, multi-hop graph, scam-profile risk scoring, ReportLab statutory PDFs, dual UX, AI chat.
  * **Phase 2: NCRP / 1930 API Integration:** Direct webhook connector to National Cyber Crime Reporting Portal for real-time complaint ingestion.
  * **Phase 3: Telecom Tower Streaming:** Real-time cell-tower triangulation and automated Subscriber Detail Record (SDR) lookup via telecom APIs.
  * **Phase 4: Crypto / Blockchain Tracking:** Automated tracking for crypto-wallet hops and P2P crypto exchanges used in international scam laundering.

#### Visual & Layout Direction
* **Layout:** 2 equal columns. Left column focuses on tangible human & departmental impact. Right column cleanly distinguishes what is **Implemented Today** from **Future Scope Phases** to maintain credibility with judges.

#### Speaker Notes
> *"TraceX directly protects citizen funds by enabling rapid account freezing in the Golden Hour. For scalability, our roadmap clearly separates what is already implemented today from future integrations like 1930 NCRP portals, telecom tower streams, and crypto tracking."*

---

### Slide 9: Closing / Why This Matters

* **Category Tag:** `Conclusion & Pitch Summary`
* **Slide Title:** TraceX: Leveling the Playing Field in Cyber Warfare
* **Core Takeaway:** *A complete, verified, and deployable product ready for state-level deployment.*

#### On-Slide Content

* **The Synthesis Card:**
  > *"Cyber criminals operate at machine speed. Law enforcement can no longer investigate at human speed. TraceX transforms raw, disconnected evidence into immediate, court-admissible legal action within the Golden Hour."*

* **Access & Verification Grid (3 Cards):**
  1. **Live Deployment (Emerald):**
     * URL: `https://tracex-frontend-3.onrender.com/`
     * Officer Badge ID: `MP-IO-4471` | Password: `demo1234`
     * Fully loaded with pre-seeded demo investigations.
  2. **Repository & Video (Cyan):**
     * GitHub: `https://github.com/Krishnaa-21/tracex`
     * Video Walkthrough: `https://youtu.be/oUuxdL-CVBA`
     * Comprehensive unit test suite and clean commit history.
  3. **Submission Contact (Purple):**
     * Team Thunderbytes | Leader: Ankit Tank
     * Phone: `+91 9977577014` | Email: `ankittank9977@gmail.com`
     * Shri Vaishnav Vidyapeeth Vishwavidyalaya (SVVV), Indore
     * Submitted for EPINOIA 2026, Atharv Ranbhoomi, IIM Indore.

#### Visual & Layout Direction
* **Layout:** Top full-width quote card with neon cyan border. Bottom row has 3 high-contrast access cards displaying live URLs, credentials, and team contact.

#### Speaker Notes
> *"Thank you esteemed jury. TraceX is not just an idea—it is a functional, tested platform with live deployment, comprehensive test suites, and authentic law-enforcement capabilities. We are ready to answer your questions and look forward to demonstrating TraceX in the offline finale at IIM Indore."*

---

## Design System & Aesthetic Specifications

| Element | Specification | Hex / Value | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | Deep Midnight Navy | `#0B1120` (RGB: 11, 17, 32) | Foundation for dark cyber-intelligence SOC cockpit. |
| **Card Surface** | Deep Slate Surface | `#131E32` (RGB: 19, 30, 50) | Container surface for content chunks. |
| **Card Border** | Subdued Slate Stroke | `#25354F` (RGB: 37, 53, 79) | Clean 1px card boundary. |
| **Primary Accent** | Electric Neon Cyan | `#00D4FF` (RGB: 0, 212, 255) | Main brand highlight, active states, key metrics. |
| **Secondary Accent** | Sky Blue | `#38BDF8` (RGB: 56, 189, 248) | Sub-headers, secondary tags. |
| **Alert / Risk Color** | Crimson Coral | `#F43F5E` (RGB: 244, 63, 94) | High risk scores, evidence silos, threat nodes. |
| **Warning Color** | Amber Gold | `#F59E0B` (RGB: 245, 158, 11) | Medium risk, golden hour timer, warnings. |
| **Success Color** | Emerald Green | `#10B981` (RGB: 16, 185, 129) | Low risk, verified links, statutory clearance. |
| **Syndicate Color** | Forensic Purple | `#818CF8` (RGB: 129, 140, 248) | Cross-case clusters, multi-hop linkages. |
| **Primary Typography** | Inter / Arial | Clean Sans-Serif | Headings: 800 Bold, Body: 400 Regular. |
| **Technical Typography**| JetBrains Mono | Monospace | File paths, code modules, badge IDs. |
