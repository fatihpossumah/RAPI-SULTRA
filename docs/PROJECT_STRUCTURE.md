# RAPI-SULTRA Project Structure (v1.0 Frozen)

Dokumen ini menjelaskan tata letak direktori pada fase final backend (Siap untuk Integrasi Dashboard).

## Directory Tree

```
RAPI-SULTRA/
├── archive/
│   ├── data/           (Dataset eksperimen, training, dan baseline lama)
│   └── *.py            (Skrip generator sintetik & retrain model yang tidak di-deploy)
├── docs/
│   ├── backend_manifest.md       (Versi environment & komponen inti)
│   ├── dashboard_file_manifest.md(Daftar file hand-off untuk UI)
│   ├── DASHBOARD_HANDOFF.md      (Instruksi bagi Frontend)
│   ├── IMPORTANT_FILES.md        (Klasifikasi keparahan file)
│   ├── integration_contract.md   (Skema JSON/CSV mutlak)
│   ├── PROJECT_STRUCTURE.md      (Dokumen ini)
│   ├── README_BACKEND_v1.0.md    (Deklarasi pembekuan versi 1.0)
│   └── status_dictionary.md      (Pemetaan string enumerasi)
├── model/
│   └── transaction_classifier_v2.pkl (Model utama, TIDAK BOLEH DIUBAH)
├── reports/
│   ├── development/    (Output sisa pengujian development)
│   └── presentation/   (Output akhir *End-to-End Pipeline* untuk Dashboard)
├── src/                (CORE BACKEND)
│   ├── duplicate_detector.py
│   ├── financial_engine.py
│   ├── financial_mapping.py
│   ├── financial_profile.py
│   ├── prediction_engine.py
│   ├── rapi_readiness_profile.py
│   ├── reconciliation_engine.py
│   └── run_*.py        (Orkestrator untuk setiap fase/kumpulan fase)
├── test/
│   ├── conftest.py     (Bridging path untuk unit test)
│   ├── test_*.py       (Kumpulan Unit Test)
│   ├── rapi_presentation_demo.csv
│   └── rapi_presentation_ground_truth.csv
├── requirements.txt
└── README.md
```

## Aturan Utama
1. **Core Files**: Direktori `src/` dan `model/` adalah entitas *frozen*, jangan dimodifikasi untuk kebutuhan front-end.
2. **Dashboard Integration Files**: Semua data yang harus disedot oleh antarmuka pengguna berada murni di dalam `reports/presentation/`.
3. **Archive**: Berisi skrip yang tidak lagi dieksekusi di ranah *production/presentation*. Sangat aman untuk diabaikan oleh developer Dashboard.
