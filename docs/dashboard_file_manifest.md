# Dashboard File Manifest

Dokumen ini adalah rekapitulasi mutlak (*Absolute Checklist*) khusus untuk Dashboard Developer. File-file di bawah wajib dikonsumsi tanpa dimanipulasi perhitungannya.

## A. Dokumentasi Utama (*Required Reading*)

1. **`docs/integration_contract.md`**
   - *Purpose*: Memaparkan Skema Data yang Dikeluarkan Backend.
   - *Format*: Markdown (Tabel / Kunci Data JSON).
   - *Used For*: Mengizinkan Developer FE menyiapkan antarmuka/tabel yang tepat untuk menampung field seperti `reference_id`, `financial_category`, dsb.

2. **`docs/status_dictionary.md`**
   - *Purpose*: Kamus terjemahan Enum/String yang diproduksi oleh backend.
   - *Format*: Markdown.
   - *Used For*: Memetakan status seperti `PENDING_REVIEW` ke komponen UI tertentu (misal: *Badge Warna Merah* dengan teks "Review Needed").

3. **`docs/DASHBOARD_HANDOFF.md`**
   - *Purpose*: Kontrak kerja yang menegaskan bahwa FE tidak boleh mengubah hitungan.
   - *Format*: Markdown.
   - *Used For*: Buku pegangan (*guideline*) batas wilayah kerja Dashboard.

## B. Presentation Bundles (*Output Files*)

Kelima file di bawah berada di direktori `reports/presentation/`.

1. **`presentation_predictions.csv`**
   - *Purpose*: Hasil mentah dari Prediction Engine, Mapping, Duplicate & Reconciliation.
   - *Format*: CSV (`date, channel, direction, description, amount, reference_id, predicted_label, confidence, processing_status, ...`)
   - *Used For*: Merender tabel **Master Transaction Log**, membedakan warna *row* bagi transaksi yang `READY` maupun `PENDING_REVIEW`.

2. **`presentation_monthly_financial_summary.csv`**
   - *Purpose*: Kalkulasi matematis per-bulan (Sisa uang, untung rugi, margin).
   - *Format*: CSV (Rangkuman per YYYY-MM).
   - *Used For*: Merender **Grafik Finansial (Line Chart / Bar Chart)** untuk tren Omzet (*Revenue*), Opex, dan Arus Kas.

3. **`presentation_financial_profile.csv`**
   - *Purpose*: Data proksi/kualitatif (stabilitas & konsistensi usaha).
   - *Format*: CSV (Telah di-*flatten* dalam struktur `dimension, status, metric, value`).
   - *Used For*: Merender status level usaha dalam bentuk kotak-kotak ringkasan, atau visualisasi indikator kualitatif.

4. **`presentation_rapi_financing_readiness_profile.json`**
   - *Purpose*: Kompilasi akhir dari 4 pilar (*Revenue Stability, Account Consistency, Payment Behaviour, Information Completeness*).
   - *Format*: JSON bersarang (*Nested*), dengan properti penjelas (`interpretation` dan `disclaimer`).
   - *Used For*: Merender kartu laporan pembiayaan (*Financing Readiness Profile Badge/Cards*) yang dilengkapi narasi pendukung yang *pre-computed*.

5. **`presentation_validation.json`**
   - *Purpose*: *Bird's Eye View* untuk total pergerakan uang selama periode waktu berlangsung.
   - *Format*: JSON (Kompilasi nilai akhir).
   - *Used For*: Mengisi widget **Key Metrics** di bagian teratas Dashboard (Contoh: "Total Data Diproses: 130", "Net Cash Movement Akhir: Rp20.600.000").
