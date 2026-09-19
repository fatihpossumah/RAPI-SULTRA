# RAPI-SULTRA Financial Processing

Dokumen ini menjelaskan tahapan yang dilakukan pada modul *Financial Processing* (Financial Mapping, Duplicate Detection, dan Reconciliation) sebagai jembatan antara **Prediction Engine** dan **Financial Engine**.

## 1. Financial Mapping
Modul ini bertugas menerjemahkan `predicted_label` dan `direction` menjadi kategori finansial standar.

**Aturan Mapping Utama**:
- **Revenue** (IN) -> `REVENUE` (Operating)
- **COGS** (OUT) -> `COGS` (Operating)
- **Operating_Expense** (OUT) -> `OPERATING_EXPENSE` (Operating)
- **Financing** -> `FINANCING`. Status terpisah berdasar direction (IN = Inflow, OUT = Outflow). Financing IN *tidak* masuk ke Revenue.
- **Transfer_Internal** -> `INTERNAL_TRANSFER`. Tidak mempengaruhi total Revenue/Expense.
- **Other** -> `OTHER` (Unresolved), otomatis masuk status review.

**Review Handling**:
Jika model klasifikasi menandai record sebagai `REVIEW_REQUIRED` (misalnya karena *confidence* < 0.70) atau dilabeli `Other`, maka `financial_processing_status` otomatis menjadi `PENDING_REVIEW`.

## 2. Duplicate Detection
Mendeteksi kemungkinan transaksi yang tercatat lebih dari satu kali menggunakan metode hierarki tanpa penghapusan paksa (*No Auto-Delete*).

- **Level 1 (Exact Match)**: Kombinasi date, channel, direction, description, amount, dan reference_id identik mutlak. -> `EXACT_DUPLICATE`
- **Level 2 (Reference Match)**: Amount dan reference_id sama, dengan jarak tanggal berdekatan. -> `POSSIBLE_DUPLICATE`
- **Level 3 (Similarity Match)**: Amount sama, direction sama, channel sama, namun reference kosong dengan tingkat kemiripan *description* >= 80%. -> `POSSIBLE_DUPLICATE`

## 3. Reconciliation Engine
Bertujuan untuk menyatukan dua *record* (transaksi) dari channel berbeda yang sebenarnya merepresentasikan peristiwa keuangan yang sama (misal pembayaran di *Invoice* yang dibayarkan melalui *Transfer* lalu tercatat di *Bank_Mutation*).

- **Channel Relationship yang Diperbolehkan**:
  - QRIS ↔ Bank_Mutation
  - Transfer ↔ Bank_Mutation
  - Invoice ↔ Transfer
  - Invoice ↔ QRIS
- **Pengecualian**: Channel **Cash** tidak secara otomatis direkonsiliasi walau nominalnya sama karena membutuhkan bukti/konteks fisik.
- **Confidence Level**:
  - `HIGH` (Match Reference & Amount) -> `RECONCILED`
  - `MEDIUM` (Match Amount & Description >= 60%) -> `POSSIBLE_MATCH`
- Status akhir tidak menggabung row secara fisik pada tahap ini, melainkan menandai pasangan lewat `reconciliation_group_id`.

## 4. Processing Status
Status akhir diputuskan secara hierarkis (prioritas tertinggi hingga terendah) di modul `run_financial_processing.py`:
1. `PENDING_REVIEW` (jika prediksi ragu atau kategori *Other*)
2. `POSSIBLE_DUPLICATE` (jika terdeteksi indikasi duplikat, tapi bukan *Exact* jika butuh konfirmasi)
3. `RECONCILIATION_REVIEW` (jika ada rekonsiliasi yang *Medium Confidence*)
4. `READY` (jika transaksi tunggal terklasifikasi, tervalidasi unik, atau telah di-*reconciled* dengan pasti).

## 5. Limitasi Proof-of-Concept (PoC)
- Duplicate Check berjalan secara `O(n^2)` untuk baris data karena hanya disimulasikan untuk skema PoC dengan data skala kecil-menengah.
- Belum ada penggabungan (*merge*) fisik baris, seluruh *raw_transaction* disimpan demi menjaga *data traceability*.
- Seluruh *threshold* untuk NLP (Similarity) diset konstan menggunakan fungsi `difflib.SequenceMatcher` standar Python tanpa menggunakan pemodelan LLM lanjutan, guna efisiensi demonstrasi.
