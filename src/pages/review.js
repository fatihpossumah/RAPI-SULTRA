/**
 * RAPI-SULTRA Review Center Page
 * Human-in-the-loop validation for low-confidence AI predictions (< 0.70) (Bahasa Indonesia)
 */

import { state, getReviewTransactions, formatCurrency, formatDate } from '../state.js';

const CATEGORIES = [
  { value: 'Revenue', label: 'Pendapatan Usaha' },
  { value: 'COGS', label: 'Biaya Barang dan Bahan' },
  { value: 'Operating_Expense', label: 'Biaya Operasional' },
  { value: 'Financing', label: 'Pembiayaan' },
  { value: 'Transfer_Internal', label: 'Pindah Dana Antar Rekening' },
  { value: 'Other', label: 'Belum Dikategorikan' }
];

function getIndonesianCategory(label, direction, status) {
  if (!label) {
    return (status === 'REVIEW_REQUIRED' || status === 'PENDING_REVIEW') ? 'Perlu Diperiksa' : 'Belum Dikategorikan';
  }
  const l = label.toUpperCase();
  if (l === 'REVENUE') return 'Pendapatan Usaha';
  if (l === 'COGS') return 'Biaya Barang dan Bahan';
  if (l === 'OPERATING_EXPENSE') return 'Biaya Operasional';
  if (l === 'FINANCING') {
    if (direction === 'IN') return 'Dana Pembiayaan Masuk';
    if (direction === 'OUT') return 'Pembayaran Pembiayaan';
    return 'Pembiayaan';
  }
  if (l === 'TRANSFER_INTERNAL') return 'Pindah Dana Antar Rekening';
  if (l === 'OTHER') {
    return (status === 'REVIEW_REQUIRED' || status === 'PENDING_REVIEW') ? 'Perlu Diperiksa' : 'Belum Dikategorikan';
  }
  return label.replace(/_/g, ' ');
}

function getCategoryBadgeClass(label, status) {
  if (!label) return 'badge-channel';
  const l = label.toUpperCase();
  if (l === 'REVENUE') return 'badge-success'; 
  if (l === 'COGS' || l === 'OPERATING_EXPENSE') return 'badge-danger';
  if (l === 'FINANCING') return 'badge-info'; 
  if (l === 'TRANSFER_INTERNAL') return 'badge-channel'; 
  if (l === 'OTHER' || status === 'REVIEW_REQUIRED') return 'badge-warning'; 
  return 'badge-channel';
}

function getPaginationArray(current, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

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
          <h2>Pusat Pemeriksaan Transaksi</h2>
          <p>Tinjau dan pastikan jenis transaksi Anda agar pencatatan keuangan lebih akurat.</p>
        </div>
        <div class="page-actions">
          ${reviewTxns.length > 0 ? `
            <button class="btn btn-primary" id="btn-batch-validate">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Simpan Semua Pemeriksaan
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
          <div class="kpi-label">Menunggu Diperiksa</div>
          <div class="kpi-value" style="color:${reviewTxns.length > 0 ? 'var(--warning)' : 'var(--success)'}">${reviewTxns.length}</div>
          <div class="kpi-sub">${reviewTxns.length === 0 ? 'Semua transaksi sudah diperiksa' : 'Transaksi perlu dilihat kembali'}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-rate">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Telah Diperiksa</div>
          <div class="kpi-value" style="color:var(--info)">${validatedTxns.length}</div>
          <div class="kpi-sub">Transaksi yang sudah benar</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-transactions">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14M3 8h14M3 12h10M3 16h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Diproses Otomatis</div>
          <div class="kpi-value" style="color:var(--success)">${autoTxns.length}</div>
          <div class="kpi-sub">${totalTxns > 0 ? Math.round((autoTxns.length / totalTxns) * 100) : 0}% transaksi tidak perlu dicek manual</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-revenue">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Rata-rata Tingkat Keyakinan</div>
          <div class="kpi-value">${avgConf}%</div>
          <div class="kpi-sub">Untuk transaksi yang masih diperiksa</div>
        </div>
      </div>

      <!-- Process Rule Notice -->
      <div class="evidence-disclaimer" style="margin-bottom: 20px;">
        <strong>Pemeriksaan Transaksi:</strong> Sistem membantu menemukan transaksi yang perlu diperiksa sebelum digunakan dalam pencatatan. Transaksi ini belum dimasukkan ke laporan keuangan hingga Anda memeriksanya.
      </div>
      
      <!-- Kategori Akuntansi Legenda -->
      <div class="section-title"><span class="dot" style="background:var(--primary)"></span> Penjelasan Klasifikasi Transaksi</div>
      <div class="grid-3" style="margin-bottom: 24px; font-size: 13px;">
        <div class="card" style="padding: 12px; border-left: 4px solid var(--success);">
          <strong>Pendapatan Usaha</strong><br/><span class="text-muted">Penerimaan dari penjualan barang atau jasa.</span>
        </div>
        <div class="card" style="padding: 12px; border-left: 4px solid var(--danger);">
          <strong>Biaya Barang dan Bahan</strong><br/><span class="text-muted">Pembelian barang, stok, atau bahan baku.</span>
        </div>
        <div class="card" style="padding: 12px; border-left: 4px solid var(--warning);">
          <strong>Biaya Operasional</strong><br/><span class="text-muted">Pengeluaran untuk menjalankan usaha sehari-hari.</span>
        </div>
        <div class="card" style="padding: 12px; border-left: 4px solid var(--info);">
          <strong>Pembiayaan</strong><br/><span class="text-muted">Dana terkait pinjaman atau pembiayaan usaha.</span>
        </div>
        <div class="card" style="padding: 12px; border-left: 4px solid var(--text-muted);">
          <strong>Pindah Dana Antar Rekening</strong><br/><span class="text-muted">Perpindahan dana antar rekening milik usaha.</span>
        </div>
        <div class="card" style="padding: 12px; border-left: 4px solid var(--warning);">
          <strong>Belum Dikategorikan</strong><br/><span class="text-muted">Transaksi yang masih memerlukan pemeriksaan.</span>
        </div>
      </div>

      <!-- Review Queue -->
      <div class="card">
        <div class="card-header" style="flex-wrap: wrap; gap: 10px;">
          <div>
            <div class="card-title">Daftar Transaksi Perlu Diperiksa</div>
            <span style="font-size:12px;color:var(--text-secondary)">
              ${(() => {
                const pageSize = state.reviewPagination?.pageSize || 10;
                const currentPage = state.reviewPagination?.currentPage || 1;
                const totalItems = reviewTxns.length;
                if (totalItems === 0) return 'Tidak ada transaksi';
                const start = (currentPage - 1) * pageSize + 1;
                const end = Math.min(currentPage * pageSize, totalItems);
                return `Menampilkan ${start}&ndash;${end} dari ${totalItems} transaksi`;
              })()}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13px; color: var(--text-secondary);">Tampilkan:</span>
            <select class="filter-select" id="review-page-size" style="padding: 6px 12px; min-width: 60px; font-size: 13px;">
              <option value="5" ${state.reviewPagination?.pageSize === 5 ? 'selected' : ''}>5</option>
              <option value="10" ${state.reviewPagination?.pageSize === 10 ? 'selected' : (!state.reviewPagination?.pageSize ? 'selected' : '')}>10</option>
              <option value="25" ${state.reviewPagination?.pageSize === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${state.reviewPagination?.pageSize === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${state.reviewPagination?.pageSize === 100 ? 'selected' : ''}>100</option>
            </select>
          </div>
        </div>
        <div class="card-body">
          ${reviewTxns.length === 0 ? `
            <div class="empty-state" style="padding: 40px 0;">
              <div class="empty-icon" style="color:var(--success)">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="16" stroke="currentColor" stroke-width="2"/><path d="M11 18l5 5 9-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="empty-title">Tidak ada transaksi yang perlu diperiksa.</div>
              <div class="empty-subtitle">Semua transaksi yang tersedia sudah melewati pemeriksaan otomatis atau telah Anda periksa.</div>
            </div>
          ` : `
            <div class="review-list">
              ${(() => {
                const pageSize = state.reviewPagination?.pageSize || 10;
                const currentPage = state.reviewPagination?.currentPage || 1;
                const totalItems = reviewTxns.length;
                const totalPages = Math.ceil(totalItems / pageSize) || 1;
                const startIndex = (currentPage - 1) * pageSize;
                const paginatedReview = reviewTxns.slice(startIndex, startIndex + pageSize);
                
                return paginatedReview.map(t => {
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
                      <span class="review-meta-item">Sumber: <span class="badge badge-channel">${t.channel}</span></span>
                      <span class="review-meta-item">Arah Dana: <strong>${t.direction === 'IN' ? 'Pemasukan' : 'Pengeluaran'}</strong></span>
                    </div>

                    <div class="review-prediction">
                      <div>
                        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.3px;margin-bottom:2px;">Klasifikasi Awal</div>
                        <div style="font-size:13px;font-weight:700;color:var(--primary);">
                          <span class="badge ${getCategoryBadgeClass(t.predicted_label, t.review_status)}">
                            ${getIndonesianCategory(t.predicted_label, t.direction, t.review_status)}
                          </span>
                        </div>
                      </div>
                      <div style="min-width: 180px;">
                        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
                          <span>Tingkat Keyakinan</span>
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
                      Informasi transaksi belum sepenuhnya meyakinkan. Mohon periksa kembali klasifikasi di bawah ini.
                    </div>

                    <div class="review-actions">
                      <div style="flex:1;display:flex;align-items:center;gap:8px;">
                        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);white-space:nowrap;">Klasifikasi Seharusnya:</label>
                        <select class="review-select" id="select-category-${t.id}">
                          ${CATEGORIES.map(c => `
                            <option value="${c.value}" ${c.value === t.predicted_label ? 'selected' : ''}>${c.label}</option>
                          `).join('')}
                        </select>
                      </div>
                      <button class="btn btn-secondary btn-inspect-txn" data-id="${t.id}" style="padding:6px 12px;font-size:12px;">
                        Lihat Detail
                      </button>
                      <button class="btn btn-primary btn-validate-txn" data-id="${t.id}" style="padding:6px 16px;font-size:12px;">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Simpan
                      </button>
                    </div>
                  </div>
                `;
              }).join('');
              })()}
            </div>
            
            ${(() => {
              const pageSize = state.reviewPagination?.pageSize || 10;
              const currentPage = state.reviewPagination?.currentPage || 1;
              const totalItems = reviewTxns.length;
              const totalPages = Math.ceil(totalItems / pageSize) || 1;
              
              if (totalPages > 1) {
                return `
                  <div style="display: flex; justify-content: center; gap: 4px; margin-top: 20px; border-top: 1px solid var(--border); padding-top: 16px;">
                    <button class="btn btn-secondary page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed"' : ''}>&lt; Prev</button>
                    
                    ${getPaginationArray(currentPage, totalPages).map(p => 
                      p === '...' 
                        ? `<span style="padding: 9px 12px; color: var(--text-secondary);">...</span>`
                        : `<button class="btn ${p === currentPage ? 'btn-primary' : 'btn-secondary'} page-btn" data-page="${p}">${p}</button>`
                    ).join('')}
                    
                    <button class="btn btn-secondary page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed"' : ''}>Next &gt;</button>
                  </div>
                `;
              }
              return '';
            })()}
          `}
        </div>
      </div>
    </div>
  `;
}

export function initReview() {
  // Handled via main.js event delegation
}
