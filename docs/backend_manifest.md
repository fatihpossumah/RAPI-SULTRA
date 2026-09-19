# RAPI-SULTRA Backend Manifest

Dokumen ini mendeskripsikan versi dan status final komponen backend dari project Proof-of-Concept (PoC) RAPI-SULTRA.

## 1. Version Information
- **Project Name:** RAPI-SULTRA PoC
- **Backend Version:** 1.0 (Frozen)
- **Model Version:** V2 (transaction_classifier_v2.pkl)
- **Python Version:** 3.x (Compatible with typical data science stack)
- **Pandas Version:** (As pinned in requirements.txt)
- **NumPy Version:** (As pinned in requirements.txt)
- **Scikit-learn Version:** 1.3.0 (Atau versi saat training model V2, perhatikan InconsistentVersionWarning)
- **Joblib Version:** (As pinned in requirements.txt)

## 2. Core Files (Business Logic)
Modul-modul ini **TIDAK BOLEH DIUBAH** oleh tim UI/Dashboard:
- `src/prediction_engine.py` (AI Prediction Layer)
- `src/financial_mapping.py` (Categorization logic)
- `src/duplicate_detector.py` (Redundancy detection)
- `src/reconciliation_engine.py` (Multi-channel bridging)
- `src/financial_engine.py` (Canonicalization & Totals)
- `src/financial_profile.py` (Heuristic proxy metrics)
- `src/rapi_readiness_profile.py` (RAPI Evidence Layer mapping)

## 3. Runners / Orchestrators
- `src/run_financial_processing.py`
- `src/run_financial_engine.py`
- `src/run_financial_profile.py`
- `src/run_rapi_readiness_profile.py`
- `src/run_presentation_pipeline.py` (End-to-End master runner)

## 4. Models
- `model/transaction_classifier_v2.pkl` (FROZEN - Do Not Retrain)

## 5. Input Data (Presentation Phase)
- `test/rapi_presentation_demo.csv` (130 demo records without labels)
- `test/rapi_presentation_ground_truth.csv` (Ground truth references)

## 6. Output Data (Final Bundles)
Semua diekspor ke direktori `reports/presentation/`:
- `presentation_predictions.csv`
- `presentation_reconciliation_matches.csv`
- `presentation_duplicate_candidates.csv`
- `presentation_canonical_transactions.csv`
- `presentation_financial_summary.json`
- `presentation_monthly_financial_summary.csv`
- `presentation_monthly_transaction_trend.csv`
- `presentation_financial_profile_input.csv`
- `presentation_financial_profile.json`
- `presentation_financial_profile.csv`
- `presentation_rapi_financing_readiness_profile.json`
- `presentation_rapi_financing_readiness_profile.csv`
- `presentation_validation.json`

## 7. Test Files
Seluruh unit test wajib dipertahankan untuk memastikan tidak ada *regression*.
- `src/test_financial_processing.py`
- `src/test_financial_engine.py`
- `src/test_financial_profile.py`
- `src/test_rapi_readiness_profile.py`

## 8. Documentation
- `docs/backend_manifest.md` (This file)
- `docs/status_dictionary.md`
- `docs/integration_contract.md`
- `docs/DASHBOARD_HANDOFF.md`
- `docs/README_BACKEND_v1.0.md`
