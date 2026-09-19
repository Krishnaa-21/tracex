# TraceX — Cyber Fraud Operations Room

A unified evidence ingestion, entity correlation, and investigative reporting console for cyber-fraud investigating officers.

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

5. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

#### AI Assistant (optional LLM)

The bottom-right chat assistant works out of the box: it answers case-specific and cross-case
questions directly from the case database. To let an LLM phrase the answers (using the same
grounded case data), set these in `backend/.env`:

```
AI_SUMMARY_API_KEY=<your key>          # placeholder "your_key_here" keeps LLM off
AI_SUMMARY_API_URL=https://api.openai.com/v1/chat/completions
AI_SUMMARY_MODEL=gpt-4o-mini
AI_CHAT_TIMEOUT_SECONDS=15
```

If the LLM is slow, rate-limited or unreachable, the assistant automatically falls back to the
data-driven answer (with a short note) instead of failing. The same key also powers case narratives.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## Running the demo

Follow these exact steps to launch and demonstrate the full TraceX platform live:

1. **Start the backend server**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
   *The backend starts at `http://localhost:8000`. On first launch, the database automatically seeds default investigating officer `MP-IO-4471` and 4 pre-correlated multi-hop demo cases (#4471 – #4474) across all risk tiers and scam types.*

2. **Start the frontend application**:
   ```bash
   cd frontend
   npm run dev
   ```
   *The frontend dashboard opens at `http://localhost:5173`.*

3. **Log in to the console**:
   - **Officer / Badge ID**: `MP-IO-4471`
   - **Password**: `demo1234`
   - Click **"Secure login"** to access the Cyber Fraud Operations Room.

### Live Presentation Walkthrough (Demo Flow)

Begin on the **Home** priority queue to observe the real-time operational dashboard featuring the urgent action banner, live case load statistics, four seeded multi-hop cases ranked by risk score, the evidence processing tray, and the jurisdictional fraud density heatmap. Next, click **"+ New investigation"** to open the modal, input a victim's name (e.g., *Rajesh Kumar*), choose **Digital Scam**, and upload the pre-bundled evidentiary files from `backend/data/sample/` (`mock_cdr.csv` into Telecom, `mock_bank_upi.xlsx` into Bank-UPI, `mock_apk_dump.json` and `mock_email.eml` into Other Artifacts), watching each artifact normalize, compute SHA-256 integrity hashes, and index in real time. Click **"Find connections & view graph"** to run the correlation and scam-type-aware risk scoring engines; this automatically redirects to the interactive **Connections & Network Graph** where you can filter nodes by entity type (UPI, phone, IMEI, IP), zoom and inspect court-admissible edge confidence rationales (such as shared UPI handles and cross-case device overlaps), review top risk entities, and view the auto-generated AI case narrative. Finally, navigate to **Reports** to generate both a single-page **Investigative Brief** with immediate Section 91 CrPC freeze directives and a Section 69A IT Act **Takedown Request Package** cross-matched against locally bundled threat intelligence feeds, triggering automated PDF downloads stamped with cryptographic SHA-256 verification hashes for evidentiary compliance.

