# AI-Based Intelligent Food Packaging Material Recommendation System
### SIH Problem Statement 26236 — Prototype

A web-based decision-support system that recommends suitable food packaging materials and packaging specifications based on food commodity properties, storage conditions, and transportation hazards.

---

> ### ⚠️ Mandatory Scientific Integrity Disclaimer
> *"This prototype provides decision support based on available food and packaging data. Packaging selection for commercial production should be validated by qualified food-packaging professionals and appropriate laboratory testing."*
>
> In accordance with scientific integrity guidelines:
> - Qualitative barrier categories (`VERY_LOW`, `LOW`, `MEDIUM`, `HIGH`, `VERY_HIGH`) are utilized rather than unverified numerical OTR/WVTR claims.
> - All sample records are explicitly labeled with `data_status: "DEMO DATA"` until individually verified against lab trials or recognized standard handbooks.
> - Cost metrics are presented solely as a relative prototype index/category (`LOW`, `MEDIUM`, `HIGH`, `VERY_HIGH`).

---

## Project Structure

```
food-packaging-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application, CORS & lifespan seeding
│   │   ├── database.py                 # SQLite configuration via SQLAlchemy
│   │   ├── models.py                   # ORM models (FoodCommodity, PackagingMaterial, History)
│   │   ├── schemas.py                  # Pydantic schemas for request/response validation
│   │   ├── seed_data.py                # 12 packaging materials & 5 preset food commodities
│   │   ├── engine/                     # Recommendation & scoring engine (Phase 1B)
│   │   │   └── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── commodities.py          # GET /api/commodities & GET /api/commodities/{id}
│   │       └── materials.py            # GET /api/materials & GET /api/materials/{id}
│   ├── requirements.txt                # Python dependencies
│   ├── run.py                          # Single-command launcher
├── frontend/                           # React + Vite + Tailwind CSS frontend (Phase 1C)
│   ├── src/
│   │   ├── components/                 # Navbar, DisclaimerBanner, Footer
│   │   ├── pages/                      # LandingPage, WizardPage, ResultsPage, MaterialsPage, MethodologyPage
│   │   ├── services/                   # Axios API client
│   │   ├── App.jsx                     # Router & layout
│   │   └── main.jsx                    # React entrypoint
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Frontend Setup & Execution (Phase 1C)

### 1. Prerequisites
- Node.js v18+ (Tested on v24)
- npm

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Launch Frontend Development Server
```bash
npm run dev
```
The interactive web application will be accessible at: **http://127.0.0.1:5173**

---

## Backend Setup & Execution

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.11)

### 2. Install Dependencies
From the repository root or `backend/` directory:
```bash
cd backend
pip install -r requirements.txt
```

### 3. Run the Backend Server
Launch the server using the entrypoint script:
```bash
python run.py
```
Or directly with Uvicorn:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The server will automatically:
1. Initialize the SQLite database (`backend/food_packaging.db`).
2. Create all required tables (`food_commodities`, `packaging_materials`, `recommendation_history`).
3. Seed the 12 packaging materials and 5 preset food commodities if not already present.

Interactive API Documentation (Swagger UI) is available at:
**http://127.0.0.1:8000/docs**

---

## Available API Endpoints (Phase 1A & Phase 1B)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health, database connectivity, item counts, and disclaimer |
| `GET` | `/api/commodities` | List all preset commodities (supports optional `?category=` and `?search=`) |
| `GET` | `/api/commodities/{id}` | Detailed properties for a specific commodity by ID |
| `GET` | `/api/materials` | List all 12 packaging materials (supports `?material_type=`, `?biodegradable=`, `?breathable=`) |
| `GET` | `/api/materials/{id}` | Detailed properties & parsed layer stack for a material |
| `POST`| `/api/recommend` | **Recommendation Engine**: Evaluates risks, applies safety rules, scores candidates, and returns primary + 2 alternatives + XAI reasons |
| `POST`| `/api/materials/compare` | Compare 2 to 4 materials side-by-side for radar charts & comparison matrices |

---

## Recommendation Engine Architecture (Phase 1B)

The engine operates deterministically through **5 verifiable stages**:

1. **Risk Identification (`risk_analyzer.py`)**:
   - Analyzes moisture content vs. ambient relative humidity for crispness loss / caking risk.
   - Evaluates fat content for lipid oxidation & photo-oxidation rancidity.
   - Assesses pH for acid reactivity.
   - Translates storage duration and transit hazards (vibration/puncture) into packaging barrier targets.

2. **Fresh Produce & MAP Module (`fresh_produce.py`)**:
   - Analyzes respiration rates (`LOW`, `MODERATE`, `HIGH`, `EXTREMELY_HIGH`).
   - Advises on optimal MAP equilibrium gas mixtures (e.g., $3-5\% O_2, 10-15\% CO_2, \text{Balance } N_2$).
   - Flags anti-fog and micro-perforation requirements to prevent condensation rot.

3. **Deterministic Compatibility Filtering (`rule_filter.py`)**:
   - Eliminates materials violating temperature limits ($T < T_{min}$ or $T > T_{max}$).
   - Disqualifies airtight non-breathable films for fresh produce without MAP (prevents anaerobic rotting).
   - Disqualifies breathable films for dry or moisture-sensitive foods.
   - Disqualifies materials with poor oil resistance when fat content $> 20\%$.

4. **Multi-Criteria Scoring (`scorer.py`)**:
   - Scores eligible materials on a $0 - 100$ scale across 6 criteria:
     - **Barrier suitability** (Moisture, Oxygen, and Light matching)
     - **Food compatibility** (Fat resistance & chemical inertness)
     - **Storage suitability** (Operating thermal margin)
     - **Mechanical resilience** (Tensile strength & seal hermeticity)
     - **Cost viability** (`LOW` = 100, `VERY_HIGH` = 40)
     - **Sustainability rating** (Recyclability code & biodegradability)
   - Dynamic weight adjustment based on user priority:
     - **Balanced**: Barrier $35\%$, Compat $20\%$, Storage $15\%$, Mech $10\%$, Cost $10\%$, Eco $10\%$
     - **Cost**: Barrier $25\%$, Compat $15\%$, Storage $10\%$, Mech $10\%$, Cost $30\%$, Eco $10\%$
     - **Sustainability**: Barrier $25\%$, Compat $15\%$, Storage $10\%$, Mech $10\%$, Cost $10\%$, Eco $30\%$
     - **Barrier Performance**: Barrier $50\%$, Compat $20\%$, Storage $15\%$, Mech $10\%$, Cost $2.5\%$, Eco $2.5\%$

5. **Explainable Selection (`explainer.py`)**:
   - Selects **Primary Recommendation** (highest overall score).
   - Selects **Sustainable Alternative** (top circular recyclable or compostable option).
   - Selects **Budget Alternative** (lowest relative cost index option).
   - Generates human-readable scientific rationale for why the primary was selected and why alternatives were considered or rejected.

---

## Seed Database Summary

### 12 Packaging Materials Catalog
1. **LDPE** — Mono-Polymer (Low Cost, High Sealability, Medium Moisture Barrier)
2. **HDPE** — Mono-Polymer (Low Cost, High Moisture Barrier, Good Rigidity)
3. **PP (CPP)** — Cast Polypropylene (Low Cost, High Clarity, Good Heat Seal)
4. **BOPP** — Biaxially Oriented Polypropylene (Medium Cost, High Tensile, Good Moisture Barrier)
5. **PET** — Biaxially Oriented PET (Medium Cost, Very High Strength, Good Aroma Barrier)
6. **Metallized BOPP** — Metallized Multi-layer (Medium Cost, Very High Moisture & High Gas Barrier, Opaque)
7. **EVOH Coextruded Film** — Barrier Multi-layer (High Cost, Very High Oxygen Barrier, Recyclable Structure)
8. **Aluminum Foil Laminate** — PET/Alu/PE Triplex (Very High Cost, Extremely High Barrier to Gas & Light)
9. **Paper / PE Laminate** — Kraft Paper / PE Extrusion (Low Cost, Bio-derived structure, Medium Moisture Barrier)
10. **PLA Bio-Film** — Polylactic Acid (High Cost, Industrial Compostable, Rigid)
11. **PBAT/PLA Compostable Blend** — Bio-Polymer (High Cost, Home Compostable, Tough & Flexible)
12. **Micro-Perforated Breathable Film** — Perforated PE (Medium Cost, Gas Permeable for Fresh Produce Respiration)

### 5 Preset Food Commodities
1. **Potato Chips** — High Fat (34.5%), Low Moisture (1.8%), N2 flush required
2. **Fresh Strawberries** — Fresh Produce, High Respiration, High Moisture (91%), MAP suitable
3. **Raw Paneer** — Dairy, High Moisture (54%), High Fat (22%), MAP suitable (CO2/N2)
4. **Tomato Puree** — Sauces/Liquids, Acidic (pH 4.1), Moisture (88.5%), Hot-fill / Vacuum
5. **Whole Wheat Flour** — Grains/Powders, Moisture (12.5%), Low Fat (1.2%), Ambient storage

---

## 🎯 SIH 2026 Jury Presentation & Live Demo Script

Follow this step-by-step walkthrough during the jury evaluation to showcase all capabilities:

### Step 1: Open the Platform
- Navigate to **http://127.0.0.1:5173**
- Highlight the **Zero-Fabrication Scientific Notice** in the top banner. Explain that the prototype rejects pseudo-scientific invented numbers in favor of verified qualitative barrier tiers (`VERY_LOW` to `VERY_HIGH`) and explicit `DEMO DATA` provenance labels.

### Step 2: Demo Case A — High-Fat Dry Snack (Potato Chips)
1. Click **"Launch Recommendation Wizard"**.
2. Select preset **"Potato Chips"**.
   - Note how Moisture auto-sets to `1.8%`, Fat to `34.5%`, and Shelf Life to `180 days`.
   - Point out the **Automated Risk Anticipation** box on the right: it immediately flags both *Crispness Loss Hazard* and *Lipid Oxidation Rancidity*.
3. Set Transportation to **"Rough Terrain"**.
4. Click **"Generate Packaging Recommendation"**.
5. **Showcase on Results Page**:
   - **Primary Recommendation**: *Triplex Aluminum Foil Laminate (PET/Alu/PE)* or *Metallized BOPP*.
   - **2D Cross-Section Visualizer**: Walk the jury through the individual film plies: Outer Print PET (12µm) $\to$ Middle Barrier Aluminum (9µm) $\to$ Inner Sealant LDPE (50µm).
   - **Explainable Rationale**: Read the bullet points explaining how the opaque barrier eliminates UV rancidity in the 34.5% lipid matrix.
   - **Rejection Audit**: Show how *Micro-Perforated Breathable Film* was disqualified because its microscopic pores would cause instant staling.
   - **Performance Radar Chart**: Toggle the *Eco* and *Budget* overlays to visualize trade-offs.

### Step 3: Demo Case B — Produce Asphyxiation Prevention (Strawberries)
1. Return to the Wizard and select **"Fresh Strawberries"**.
2. Note how the **Fresh Produce Mode** automatically activates with `HIGH` respiration rate.
3. **First run with MAP OFF**:
   - Show how the rule engine **disqualifies all airtight films** (*Met-BOPP*, *EVOH*, *Alu Foil*) with the reason: *"Produce respiration will deplete oxygen to < 1%, causing anaerobic fermentation, off-odors, and rotting."*
4. **Next run with MAP ON**:
   - Show how the system recommends *LDPE / Micro-perforated film* and prescribes the exact equilibrium gas mixture: `3–5% O2, 10–15% CO2, Balance N2`.

### Step 4: Demo Case C — Side-by-Side Matrix Comparison
1. Click **"Full Comparison Matrix"** at the top of the Results Dashboard.
2. Observe how the Primary and Alternative materials are automatically loaded into a 12-parameter comparison table.
3. Toggle on additional materials (e.g. *PLA Bio-Film*) to demonstrate multi-material evaluation.

### Step 5: Demo Case D — Generate PDF Specification Sheet
1. Click **"Generate PDF / Print Spec Sheet"**.
2. Review the clean, official A4 document layout complete with query reference ID, food profile, layer stack table, produce protocol, and literature citations.
3. Click **"Print / Save as PDF"** to produce an export-ready specification sheet.

