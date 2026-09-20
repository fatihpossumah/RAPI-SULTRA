# Important Files Classification (RAPI-SULTRA)

Untuk menjaga *safety* dan mencegah hilangnya logika sentral, seluruh komponen pada repositori dikelompokkan berdasarkan level kepentingannya.

## 1. CRITICAL (Must Not Be Modified or Deleted)
Kerusakan pada file ini berakibat pada lumpuhnya seluruh sistem Backend.
- `model/transaction_classifier_v2.pkl`
- `src/prediction_engine.py`
- `src/financial_mapping.py`
- `src/duplicate_detector.py`
- `src/reconciliation_engine.py`
- `src/financial_engine.py`
- `src/financial_profile.py`
- `src/rapi_readiness_profile.py`
- `src/run_presentation_pipeline.py`

## 2. IMPORTANT (Required for Validation & Frontend)
File pendukung yang menjadi urat nadi presentasi demo maupun pengujian konsistensi (*Regression/Reproducibility*).
- `test/test_*.py` (Seluruh test module)
- `test/conftest.py`
- `test/rapi_presentation_demo.csv` (Dataset input Demo)
- `test/rapi_presentation_ground_truth.csv`
- `requirements.txt`
- `docs/integration_contract.md`
- `docs/DASHBOARD_HANDOFF.md`
- `docs/status_dictionary.md`
- `reports/presentation/*` (Seluruh Output final)

## 3. OPTIONAL (Documentation)
Aman dibaca, tidak digunakan secara internal di runtime program.
- `docs/backend_manifest.md`
- `docs/README_BACKEND_v1.0.md`
- `docs/PROJECT_STRUCTURE.md`
- `README.md`

## 4. ARCHIVE (Historical Record, Do Not Put Back in Runtime)
Meskipun diletakkan di rak arsip, ini BUKAN untuk dihapus, melainkan untuk diteliti di masa mendatang jika model perlu diturunkan skalanya atau di-retrain.
- `archive/train_model.py`
- `archive/retrain_model.py`
- `archive/generate_*.py`
- `archive/data/training_transactions_v2.csv`
- Dll.

## 5. SAFE TO DELETE
File dan *folder* temporer yang dapat dihapus kapan saja (sudah dibersihkan di versi 1.0 Frozen).
- `__pycache__/`
- `.pytest_cache/`
- `*.pyc`
- `reports/development/*` (Jika hasil eksperimen itu sudah kedaluwarsa).
