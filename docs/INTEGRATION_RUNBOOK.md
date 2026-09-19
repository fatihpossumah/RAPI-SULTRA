# RAPI-SULTRA Integration Runbook

## Overview
Dokumen ini menjelaskan arsitektur integrasi antara Backend (Python/Pandas/Scikit-Learn) dan Dashboard Frontend (Vanilla JS/Vite). Sesuai dengan prinsip utama: **Backend adalah Source of Truth**. Dashboard telah direfaktor untuk hanya bertindak sebagai *Presentation Layer*.

## Arsitektur Integrasi
1. **API Layer (Adapter)**
   - Dibuat menggunakan Python murni (`http.server`) di `src/api.py`.
   - Melayani endpoint REST API ringan (GET/POST) di port `8000`.
   - Mengambil data dari *presentation files* JSON/CSV yang berada di dalam folder `reports/presentation/`.

2. **Dashboard Layer**
   - Menghapus total `mock-engine.js` dan `demo-data.js` yang sebelumnya menduplikasi business logic.
   - Mengambil (fetch) data langsung dari `http://localhost:8000/api`.
   - Mengandalkan backend untuk segala perhitungan *Financial Summary*, *RAPI Readiness*, dan *Reconciliation*.

## Cara Menjalankan

### 1. Menjalankan Backend API
Buka terminal baru di root direktori proyek (`RAPI-SULTRA/`), lalu jalankan:
```bash
python src/api.py
```
Server akan berjalan di `http://localhost:8000`.

### 2. Menjalankan Dashboard UI
Buka terminal baru di direktori `RAPI-SULTRA/Rapi-Sultra/`, lalu jalankan:
```bash
npm install
npm run dev
```
Akses UI di browser pada port yang diberikan (biasanya `http://localhost:5173`).

## Data Flow (Alur Pembaruan Data)
1. **Upload CSV**: Saat analis meng-upload CSV via UI, Dashboard mengirim POST ke `/api/upload`.
2. **Processing Pipeline**: API memicu `src/run_presentation_pipeline.py`.
3. **Artifact Generation**: Model klasifikasi, duplikasi, rekonsiliasi, dan agregasi finansial dijalankan. Output baru disimpan di `reports/presentation/`.
4. **UI Refresh**: Dashboard mengambil ulang data (`fetchSummary`, `fetchTransactions`) dari API, memantulkan perubahan secara otomatis tanpa mengulangi perhitungan di browser.
