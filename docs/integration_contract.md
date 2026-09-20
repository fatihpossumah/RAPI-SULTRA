# RAPI-SULTRA Integration Contract

Dokumen ini mendefinisikan skema komunikasi antara layer Backend dan UI/Dashboard untuk RAPI-SULTRA. Kontrak ini **FROZEN** dan tidak boleh diubah secara sepihak.

## 1. Input Data Schema
Data transaksi mentah harus memiliki struktur berikut:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `date` | String (YYYY-MM-DD) | Yes | Tanggal transaksi | "2026-01-15" |
| `channel` | String | Yes | Metode pembayaran. Wajib salah satu: `Transfer`, `Bank_Mutation`, `Cash`, `Invoice`, `QRIS` | "QRIS" |
| `direction` | String | Yes | Arah kas: `IN` (Masuk) atau `OUT` (Keluar) | "IN" |
| `description` | String | Yes | Catatan atau narasi transaksi | "Pencairan KUR" |
| `amount` | Float/Int | Yes | Nilai nominal transaksi | 25000000 |
| `reference_id`| String | Yes | ID Unik eksternal | "FIN-IN-01" |

## 2. Prediction Output Schema
Ditambahkan oleh Prediction Engine ke dalam record transaksi.

| Field | Description |
|-------|-------------|
| `predicted_label` | Label kategori ML (Misal: `REVENUE`, `COGS`, `OTHER`) |
| `confidence` | Tingkat probabilitas model (0.0 - 1.0). **BUKAN jaminan akurasi.** |
| `review_status` | `READY` jika confidence > 0.70, jika tidak `PENDING_REVIEW` |

## 3. Processing Output Schema
Ditambahkan oleh Engine gabungan.

| Field | Description |
|-------|-------------|
| `financial_category` | Kategori agregasi akhir. |
| `processing_status` | Status kelayakan awal (`READY`, `PENDING_REVIEW`). |
| `duplicate_status` | Redundansi (`NOT_DUPLICATE`, `EXACT_DUPLICATE`, `POSSIBLE_DUPLICATE`). |
| `reconciliation_status` | Pasangan rekonsiliasi (`NOT_RECONCILED`, `RECONCILED`, `RECONCILIATION_REVIEW`). |

*(Untuk rincian makna status di atas, rujuk `status_dictionary.md`)*

## 4. Financial Summary Schema
Total yang disajikan dalam `presentation_financial_summary.json`. 
- `revenue`: Total `REVENUE` IN. (Tidak termasuk pencairan dana pihak ketiga)
- `cogs`: Total `COGS` OUT.
- `operating_expense`: Total beban operasional.
- `financing_inflow`: Total pencairan pinjaman (Terpisah dari Revenue).
- `financing_outflow`: Total cicilan.
- `gross_profit`: `revenue - cogs`.
- `gross_margin`: `gross_profit / revenue`. (Jika revenue = 0, gross_margin = 0).
- `operating_result`: `gross_profit - operating_expense`.
- `net_cash_movement`: Arus kas kotor total.

## 5. Monthly Summary
Kolom pada file `presentation_monthly_financial_summary.csv`:
- `month`: (Format YYYY-MM)
- `revenue`, `cogs`, `operating_expense`, `financing_inflow`, `financing_outflow`
- `gross_profit`, `gross_margin`, `operating_result`, `net_cash_movement`

## 6. Financial Profile Structure
Output kualitatif per-UMKM, terletak di `presentation_financial_profile.json`:
- `revenue_stability`: Status stabilitas omzet (berdasar *Coefficient of Variation*).
- `cash_flow_consistency`: Status rasio surplus vs defisit bulan-bulan berjalan.
- `payment_behaviour`: Status keberadaan cicilan.
- `information_completeness`: Persentase baris dengan data referensi penuh.

## 7. RAPI Readiness Profile
*Evidence Layer* akhir yang direstrukturisasi untuk mitra pembiayaan (`presentation_rapi_financing_readiness_profile.json`).

| RAPI | Elemen |
|------|--------|
| **R** | Revenue Stability |
| **A** | Account / Cash-flow Consistency |
| **P** | Payment Behaviour |
| **I** | Information Completeness |

**PERHATIAN DASHBOARD:**
Setiap dimensi memiliki objek `interpretation`. RAPI Profile ini **hanya bukti observasi empiris** (*Evidence Layer*).
Ini **BUKAN:** 
- Credit score agregat
- Loan approval decision
- Predictive risk index

Dashboard **DILARANG** menjumlahkan, menimbang (*weighting*), atau menyimpulkan kelayakan kredit final dari profil ini.

## 8. Traceability
Dashboard dapat melakukan *drill-down*:
1. Baca baris agregat pada `presentation_monthly_financial_summary.csv`.
2. Periksa sumbernya pada `presentation_canonical_transactions.csv` yang hanya memuat data dengan status `INCLUDED` atau `CANONICAL_RECONCILED`.
3. Dari sana, `reference_id` atau `transaction_id` akan mengarah langsung kembali ke transaksi mentah pada `presentation_predictions.csv` (atau input CSV awal). Traceability ini difasilitasi penuh oleh *backend*.
