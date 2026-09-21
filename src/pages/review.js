/**
 * RAPI-SULTRA Review Center Page
 * Human-in-the-loop validation for low-confidence AI predictions (< 0.70) (Bahasa Indonesia)
 */

import { state, getReviewTransactions, formatCurrency, formatDate } from '../state.js';

const CATEGORIES = [
  { value: 'Revenue', label: 'Revenue (Pendapatan Usaha)' },
  { value: 'COGS', label: 'COGS (HPP / Bahan Baku)' },
  { value: 'Operating_Expense', label: 'Operating Expense (Beban Operasional)' },
  { value: 'Financing', label: 'Financing (Aktivitas Pembiayaan)' },
  { value: 'Transfer_Internal', label: 'Transfer Internal (Pindah Rekening)' },
  { value: 'Other', label: 'Other (Lain-lain)' }
];

export function renderReview() {
  if (!state.demoLoaded || state.transactions.length === 0) {
    return `
      <div class="page">
        <div class="page-header">
          <div class="page-header-text">
            <h2>Pusat Review Analis</h2>
            <p>Validasi manual untuk transaksi dengan skor keyakinan AI di bawah ambang batas 70%.</p>
          </div>
        </div>
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
          </div>
          <div class="empty-title">Belum ada data transaksi yang dimuat.</div>
          <div class="empty-subtitle">Buka halaman Ikhtisar lalu klik "Muat Data Simulasi" untuk mengeksplorasi Pusat Review.</div>
        </div>
      </div>
    `;
  }

  const reviewTxns = getReviewTransactions();
  const totalTxns = state.transactions.length;
  const validatedTxns = state.transactions.filter(t => t.review_status === 'VALIDATED');
  const autoTxns = state.transactions.filter(t => t.review_status === 'AUTO_CLASSIFIED');

  const avgConf = reviewTxns.length > 0
    ? (reviewTxns.reduce((acc, t) => acc + t.confidence, 0) / reviewTxns.length * 100).toFixed(1)
    : '0.0';

  return `
    <div class="page">
      <div class="page-header">
        <div class="page-header-text">
          <h2>Pusat Review (Human-in-the-Loop)</h2>
          <p>Verifikasi keputusan pos akuntansi transaksi dengan skor kepastian di bawah ambang batas 70.0%.</p>
        </div>
        <div class="page-actions">
          ${reviewTxns.length > 0 ? `
            <button class="btn btn-primary" id="btn-batch-validate">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Validasi Semua Terprediksi
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Metrics Row -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card">
          <div class="kpi-icon icon-review">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z" stroke="currentColor" stroke-width="1.5"/></svg>
          </div>
          <div class="kpi-label">Menunggu Review</div>
          <div class="kpi-value" style="color:${reviewTxns.length > 0 ? 'var(--warning)' : 'var(--success)'}">${reviewTxns.length}</div>
          <div class="kpi-sub">${reviewTxns.length === 0 ? 'Semua antrean tuntas' : 'Menunggu validasi analis'}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-rate">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Divalidasi Analis</div>
          <div class="kpi-value" style="color:var(--info)">${validatedTxns.length}</div>
          <div class="kpi-sub">Disetujui & masuk ke profil</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-transactions">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14M3 8h14M3 12h10M3 16h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Otomatis Terklasifikasi</div>
          <div class="kpi-value" style="color:var(--success)">${autoTxns.length}</div>
          <div class="kpi-sub">${totalTxns > 0 ? Math.round((autoTxns.length / totalTxns) * 100) : 0}% tingkat automasi (≥70%)</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-revenue">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Rata-rata Keyakinan Antrean</div>
          <div class="kpi-value">${avgConf}%</div>
          <div class="kpi-sub">Ambang batas otomatis: ≥ 70.0%</div>
        </div>
      </div>

      <!-- Process Rule Notice -->
      <div class="evidence-disclaimer" style="margin-bottom: 20px;">
        <strong>Protokol Audit:</strong> Transaksi berstatus <code>REVIEW_REQUIRED</code> belum diikutsertakan ke dalam kalkulasi Laporan Laba Rugi dan RAPI Profile sampai diverifikasi oleh analis pembiayaan. Hal ini menjamin integritas data (data hygiene) profil keuangan UMKM.
      </div>

      <!-- Review Queue -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Antrean Transaksi Menunggu Validasi (${reviewTxns.length})</div>
          <span style="font-size:12px;color:var(--text-secondary)">Pilih kategori akuntansi yang tepat lalu klik "Validasi"</span>
        </div>
        <div class="card-body">
          ${reviewTxns.length === 0 ? `
            <div class="empty-state" style="padding: 40px 0;">
              <div class="empty-icon" style="color:var(--success)">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="16" stroke="currentColor" stroke-width="2"/><path d="M11 18l5 5 9-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="empty-title">Antrean Review Bersih!</div>
              <div class="empty-subtitle">Semua transaksi memiliki keyakinan tinggi (≥70%) atau telah selesai divalidasi oleh analis. Laporan keuangan siap dianalisis.</div>
            </div>
          ` : `
            <div class="review-list">
              ${reviewTxns.map(t => {
                const confPercent = (t.confidence * 100).toFixed(1);
                const confClass = t.confidence >= 0.60 ? 'medium' : 'low';
                return `
                  <div class="review-card" id="review-card-${t.id}">
                    <div class="review-card-header">
                      <div>
                        <div class="review-card-title">${t.description}</div>
                        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                          Ref: <code>${t.referenceId}</code> · ID: ${t.id}
                        </div>
                      </div>
                      <div style="text-align:right">
                        <div class="metric-value ${t.direction === 'IN' ? 'positive' : 'negative'}">
                          ${t.direction === 'IN' ? '+' : '-'}${formatCurrency(t.amount)}
                        </div>
                        <span class="badge ${t.direction === 'IN' ? 'badge-in' : 'badge-out'}" style="margin-top:4px;">${t.direction === 'IN' ? 'IN' : 'OUT'}</span>
                      </div>
                    </div>

                    <div class="review-card-meta">
                      <span class="review-meta-item">Tanggal: <strong>${formatDate(t.date)}</strong></span>
                      <span class="review-meta-item">Kanal: <span class="badge badge-channel">${t.channel}</span></span>
                      <span class="review-meta-item">Arah: <strong>${t.direction === 'IN' ? 'Pemasukan (Inflow)' : 'Pengeluaran (Outflow)'}</strong></span>
                    </div>

                    <div class="review-prediction">
                      <div>
                        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.3px;margin-bottom:2px;">Prediksi Model AI</div>
                        <div style="font-size:13px;font-weight:700;color:var(--primary);">
                          ${t.predicted_label.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div style="min-width: 180px;">
                        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
                          <span>Skor Keyakinan</span>
                          <strong style="color:var(--warning)">${confPercent}%</strong>
                        </div>
                        <div class="confidence-bar">
                          <div class="confidence-track" style="flex:1;">
                            <div class="confidence-fill ${confClass}" style="width:${confPercent}%"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="review-reason">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v4M8 11.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                      Skor keyakinan di bawah 70.0% ambang batas otomatis — memerlukan verifikasi kategori oleh analis.
                    </div>

                    <div class="review-actions">
                      <div style="flex:1;display:flex;align-items:center;gap:8px;">
                        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);white-space:nowrap;">Kategori Akuntansi:</label>
                        <select class="review-select" id="select-category-${t.id}">
                          ${CATEGORIES.map(c => `
                            <option value="${c.value}" ${c.value === t.predicted_label ? 'selected' : ''}>${c.label}</option>
                          `).join('')}
                        </select>
                      </div>
                      <button class="btn btn-secondary btn-inspect-txn" data-id="${t.id}" style="padding:6px 12px;font-size:12px;">
                        Detail Transaksi
                      </button>
                      <button class="btn btn-primary btn-validate-txn" data-id="${t.id}" style="padding:6px 16px;font-size:12px;">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Validasi
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

export function initReview() {
  // Handled via main.js event delegation
}
