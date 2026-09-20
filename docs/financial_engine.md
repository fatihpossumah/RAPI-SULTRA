# RAPI-SULTRA Financial Engine

Dokumen ini menjelaskan tahapan yang dilakukan pada modul *Financial Engine*. Modul ini mengambil input dari *Financial Processing* dan mentransformasikannya menjadi metrik keuangan komprehensif, total bulanan, serta profil input.

## 1. Proses Canonicalization
Tujuan dari proses ini adalah memastikan setiap aktivitas ekonomi **hanya dihitung satu kali**.
- **Pending Review**: Transaksi yang masih berstatus `REVIEW_REQUIRED` (termasuk *Other*) di-set menjadi `EXCLUDED_PENDING_REVIEW` dan dikeluarkan dari kalkulasi final (tidak dihitung di Profit atau Total).
- **Exact Duplicates**: Semua baris yang terdeteksi sebagai `EXACT_DUPLICATE` akan dimasukkan, **kecuali** baris pertama per *group* yang di-set sebagai `INCLUDED`. Sisanya `EXCLUDED_DUPLICATE`.
- **Reconciliation**: Pasangan transaksi beda *channel* (seperti QRIS dan Bank Mutation) yang berstatus `RECONCILED` tidak boleh dihitung dua kali (sebagai Rp300.000 jika aslinya Rp150.000). Modul ini hanya akan mempertahankan 1 perwakilan (dengan status `CANONICAL_RECONCILED`) dan me-*reject* sisanya (`EXCLUDED_RECONCILED`).
- **Possible Duplicates**: Di-set `EXCLUDED_DUPLICATE` sementara agar tidak masuk pembukuan sebelum dikonfirmasi oleh petugas.
- Seluruh baris asli (raw) tidak dihapus dan diekspor ke `reports/canonical_transactions.csv` demi *traceability*.

## 2. Financial Metrics (Totals)
- **Revenue**: Total baris canonical berstatus `REVENUE`.
- **COGS**: Total baris canonical berstatus `COGS`.
- **Operating Expense**: Total baris canonical berstatus `OPERATING_EXPENSE`.
- **Financing Inflow/Outflow**: Dipisahkan dari *Revenue/Expense* dan dicatat murni pada metrik *Financing*.
- **Internal Transfer**: Tidak masuk dalam *Revenue* maupun *Expense*.
- Seluruh *amount* asli tidak diubah.

## 3. Profit Calculation
- **Gross Profit**: `Revenue - COGS`
- **Gross Margin**: `(Gross Profit / Revenue) * 100` (mengembalikan null jika Revenue = 0 untuk menghindari *Division by Zero*).
- **Operating Result**: `Revenue - COGS - Operating Expense`. Financing tidak diikutsertakan di sini.

## 4. Cash Flow Calculation
- **Total Cash Inflow**: Jumlah nominal dari semua transaksi canonical yang `direction == 'IN'`.
- **Total Cash Outflow**: Jumlah nominal dari semua transaksi canonical yang `direction == 'OUT'`.
- **Net Cash Movement**: `(Cash Inflow - Transfer Internal IN) - (Cash Outflow - Transfer Internal OUT)`. Langkah ini memastikan pemindahan dana mandiri antar bank tidak membuat perputaran arus kas membengkak palsu (*double inflated*).

## 5. Profiling Input & Monthly Aggregation
- **Monthly Summary**: Menghitung 8 metrik finansial di atas dikelompokkan per bulan.
- **Monthly Trends**: Menghitung *volume* (jumlah record) dari setiap *label* (Revenue, Opex, dll) per bulan.
- **Financial Profile Input**: Menyediakan metrik dasar seperti total pendapatan, standar deviasi, proporsi kelengkapan (informasi/field tidak kosong), dan tingkat kegagalan review/duplikat (*review rate*, *duplicate rate*). Semua data ini disediakan sebagai input mentah untuk *RAPI Profile Scoring* berikutnya, BUKAN sebagai output skor final.

## 6. Limitasi Proof-of-Concept (PoC)
- Ini merupakan modul *Canonical Aggregation*, **Bukan Laporan Akuntansi Standar Penuh** (seperti PSAK).
- Tidak ada validasi kelayakan kredit (*Credit Scoring*) atau Rekomendasi/Approval yang dilakukan oleh modul ini.
- Beberapa *edge cases* rekonsiliasi spesifik per *biller* dapat dimodelkan lebih kompleks dalam implementasi produksi.
