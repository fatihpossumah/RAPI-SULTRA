# Status Dictionary (RAPI-SULTRA)

Dokumen ini memetakan seluruh *enum* atau *status string* yang dihasilkan oleh pipeline backend RAPI-SULTRA, agar pengembang Dashboard dapat menampilkannya dengan deskripsi yang konsisten dan akurat.

## 1. Processing Status (Modul: Prediction & Processing)
Menggambarkan status kelayakan record awal.
| Status | Modul | Makna / Kondisi | Dashboard Display Meaning |
|--------|--------|-----------------|---------------------------|
| `READY` | Processing | Klasifikasi sukses (Confidence > 0.70) | "Auto Classified - Ready" |
| `PENDING_REVIEW` | Processing | Confidence rendah atau label ambigu | "Manual Review Required" |

## 2. Duplicate Status (Modul: Duplicate Detection)
Menggambarkan apakah ada redundansi pada *transaction records*.
| Status | Modul | Makna / Kondisi | Dashboard Display Meaning |
|--------|--------|-----------------|---------------------------|
| `NOT_DUPLICATE` | Duplicate Engine | Baris unik. | "Unique" |
| `EXACT_DUPLICATE` | Duplicate Engine | Terdeteksi persis ganda dalam 1 *channel* dan hari yang sama. | "Exact Duplicate" |
| `POSSIBLE_DUPLICATE` | Duplicate Engine | Mirip tapi tidak 100%, perlu direview. | "Possible Duplicate" |

## 3. Reconciliation Status (Modul: Reconciliation Engine)
Menghubungkan transaksi pembayaran dengan *settlement* pencairan (misal QRIS ke Rekening).
| Status | Modul | Makna / Kondisi | Dashboard Display Meaning |
|--------|--------|-----------------|---------------------------|
| `NOT_RECONCILED` | Recon Engine | Transaksi mandiri, tidak ada pasangan penyelesaian. | "Standalone" |
| `RECONCILED` | Recon Engine | Transaksi berhasil diikat dengan rekannya (*matched*). | "Reconciled Match" |
| `RECONCILIATION_REVIEW` | Recon Engine | Kemungkinan *match* (beda tanggal), perlu diperiksa. | "Recon Review Required" |

## 4. Canonical Status (Modul: Financial Engine)
Status pembukuan agregat akhir untuk menentukan apakah suatu nilai uang akan dijumlahkan atau tidak.
| Status | Modul | Makna / Kondisi | Dashboard Display Meaning |
|--------|--------|-----------------|---------------------------|
| `INCLUDED` | Fin Engine | Dijumlahkan ke dalam laporan finansial. | "Included in Totals" |
| `CANONICAL_RECONCILED` | Fin Engine | Representasi tunggal dari pasangan rekonsiliasi (Dijumlahkan). | "Included (Reconciled)" |
| `EXCLUDED_RECONCILED` | Fin Engine | Baris sisanya dari pasangan rekonsiliasi (Tidak dijumlahkan). | "Excluded (Double Entry)" |
| `EXCLUDED_DUPLICATE` | Fin Engine | Duplikat, tidak dijumlahkan. | "Excluded (Duplicate)" |
| `EXCLUDED_PENDING_REVIEW` | Fin Engine | Belum direview (atau 'OTHER'), tidak dijumlahkan. | "Excluded (Pending)" |

## 5. Financial Profile Statuses (Modul: Financial Profile)
Status heuristik profil kinerja.
| Status | Modul | Makna / Kondisi | Dashboard Display Meaning |
|--------|--------|-----------------|---------------------------|
| `STABLE` | Fin Profile (Revenue) | Variabilitas (*Coefficient of Variation*) rendah (< 0.25). | "Stable" |
| `MODERATE_VARIABILITY` | Fin Profile (Revenue) | Variabilitas menengah (0.25 - 0.50). | "Moderate Variability" |
| `HIGH_VARIABILITY` | Fin Profile (Revenue) | Variabilitas tinggi (> 0.50). | "High Variability" |
| `CONSISTENTLY_POSITIVE` | Fin Profile (Cash Flow) | >= 80% bulan memiliki saldo kas plus. | "Consistently Positive" |
| `MODERATELY_POSITIVE` | Fin Profile (Cash Flow) | >= 50% bulan memiliki saldo kas plus. | "Moderately Positive" |
| `VULNERABLE` | Fin Profile (Cash Flow) | Mayoritas bulan bersaldo kas negatif. | "Vulnerable" |
| `OBSERVED_PAYMENTS` / `OBSERVED_PAYMENT_ACTIVITY` | Fin Profile (Payment) | Ditemukan transaksi `FINANCING` *Outflow*. | "Payments Observed" |
| `INSUFFICIENT_DATA` | Fin Profile (Semua) | Data transaksi kosong / tidak mencukupi untuk dihitung. | "Insufficient Data" |
| `HIGHLY_COMPLETE` | Fin Profile (Completeness) | Informasi kolom terisi >= 90%. | "Highly Complete" |
| `MODERATELY_COMPLETE` | Fin Profile (Completeness) | Informasi kolom terisi 70% - 89%. | "Moderately Complete" |
| `INCOMPLETE` | Fin Profile (Completeness) | Informasi kolom terisi < 70%. | "Incomplete" |

## 6. RAPI Readiness Data Sufficiency (Modul: RAPI Readiness Profile)
Menunjukkan tingkat kelayakan data yang di-*supply* kepada ekosistem pembiayaan.
| Status | Modul | Makna / Kondisi | Dashboard Display Meaning |
|--------|--------|-----------------|---------------------------|
| `SUFFICIENT` | RAPI Profile | Data memadai untuk menggambarkan bukti observasi. | "Data Sufficient" |
| `LIMITED` | RAPI Profile | Data tersedia namun berkarakter terbatas (proxy). | "Data Limited" |
| `INSUFFICIENT` | RAPI Profile | Ketiadaan data pada pilar dimensi tersebut. | "Data Insufficient" |
