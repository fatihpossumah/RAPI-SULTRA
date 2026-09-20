# DASHBOARD HANDOFF

**PROJECT**: RAPI-SULTRA
**BACKEND STATUS**: READY FOR DASHBOARD INTEGRATION

---

## Model
The AI engine is locked. Dashboard UI does not need to load the model unless deploying a realtime inference container.
- `model/transaction_classifier_v2.pkl`

## Presentation Data 
- **Demo Dataset**: `test/rapi_presentation_demo.csv` (130 sample records)
- **Ground Truth**: `test/rapi_presentation_ground_truth.csv`

## Output Bundles (The Core Handoff)
The following files located in `reports/presentation/` are the absolute dependencies for your Dashboard views:

1. **`presentation_predictions.csv`**
   - Use this to populate the raw transaction list and highlight rows needing manual `PENDING_REVIEW` or duplicate resolution.
2. **`presentation_monthly_financial_summary.csv`**
   - Use this to plot line/bar charts showing Omzet, Opex, and Net Cash trends over time.
3. **`presentation_financial_profile.csv`**
   - Use this to display the heuristic statuses (e.g., STABLE, VULNERABLE, etc.) in a tabular format.
4. **`presentation_rapi_financing_readiness_profile.json`**
   - This is the Master Evidence object. Use this to render the final RAPI badge/cards.
5. **`presentation_validation.json`**
   - Use this for top-level Dashboard Key Metrics (e.g., total active months, total processed transactions).
6. **`docs/integration_contract.md`**
   - Your primary schema documentation.

## Pipeline Architecture

Input CSV 
 ↓ 
Prediction 
 ↓ 
Financial Processing 
 ↓ 
Financial Engine 
 ↓ 
Financial Profile 
 ↓ 
RAPI Financing Readiness Profile

## Dashboard Governance (MUST OBEY)

**DASHBOARD SHOULD:**
- Consume backend outputs directly.
- Display transaction records transparently.
- Display classification/review statuses visually (e.g., amber for pending, green for ready).
- Display financial summaries and monthly trends using charts.
- Display Financial Profile descriptive tags.
- Display the RAPI R/A/P/I evidence profile exactly as formatted in the JSON.

**DASHBOARD SHOULD NOT:**
- Retrain the classification model.
- Recalculate financial engine metrics independently on the client side.
- Create another duplicate detector or reconciliation logic.
- Create an aggregate credit score (e.g., converting RAPI into a number 1-100).
- Create a loan approval or rejection flag.
- Modify backend business logic.
