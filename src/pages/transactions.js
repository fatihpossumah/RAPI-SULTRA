/**
 * RAPI-SULTRA Transactions Page
 * Halaman Daftar Transaksi, Rekonsiliasi, dan Deteksi Duplikasi (Bahasa Indonesia)
 */

import { state, getFilteredTransactions, formatCurrency, formatDate } from '../state.js';

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

function getIndonesianStatus(status) {
  if (!status) return 'TIDAK DIKETAHUI';
  const mapping = {
    'AUTO_CLASSIFIED': 'Diproses Otomatis',
    'REVIEW_REQUIRED': 'Perlu Diperiksa',
    'VALIDATED': 'Tervalidasi',
    'PENDING_REVIEW': 'Perlu Diperiksa',
    'POSSIBLE_DUPLICATE': 'Kemungkinan Ganda',
    'RECONCILIATION_REVIEW': 'Perlu Rekonsiliasi'
  };
  return mapping[status] || status.replace(/_/g, ' ');
}

function getPaginationArray(current, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export function renderTransactions() {
  if (!state.demoLoaded || state.transactions.length === 0) {
    return `
      <div class="page">
        <div class="page-header">
          <div class="page-header-text">
            <h2>Daftar Transaksi</h2>
            <p>Pantau dan telusuri jejak transaksi multi-kanal yang telah diproses oleh AI.</p>
          </div>
        </div>
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M6 8h24M6 14h24M6 20h18M6 26h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <div class="empty-title">Belum ada data transaksi yang dimuat.</div>
          <div class="empty-subtitle">Buka halaman Ikhtisar lalu klik "Muat Data Simulasi" untuk memulai.</div>
        </div>
      </div>`;
  }

  const tab = state.transactionTab || 'all';
  const txns = getFilteredTransactions();
  const reconCount = state.reconciliationPairs.length;
  const dupCount = state.duplicatePairs.filter(d => d.status === 'PENDING').length;

  return `
    <div class="page">
      <div class="page-header">
        <div class="page-header-text">
          <h2>Daftar Transaksi</h2>
          <p>Pantau dan telusuri jejak transaksi multi-kanal yang telah diproses oleh AI.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btn-add-txn-page">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Tambah Transaksi
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab ${tab === 'all' ? 'active' : ''}" data-tab="all">Semua Transaksi<span class="tab-count">${state.transactions.length}</span></button>
        <button class="tab ${tab === 'reconciliation' ? 'active' : ''}" data-tab="reconciliation">Rekonsiliasi Lintas Kanal<span class="tab-count">${reconCount}</span></button>
        <button class="tab ${tab === 'duplicates' ? 'active' : ''}" data-tab="duplicates">Potensi Duplikasi<span class="tab-count">${dupCount}</span></button>
      </div>

      ${tab === 'all' ? renderAllTransactions(txns) : ''}
      ${tab === 'reconciliation' ? renderReconciliation() : ''}
      ${tab === 'duplicates' ? renderDuplicates() : ''}
    </div>
  `;
}

function renderAllTransactions(txns) {
  const pageSize = state.pagination?.pageSize || 10;
  const currentPage = state.pagination?.currentPage || 1;
  const totalItems = txns.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTxns = txns.slice(startIndex, endIndex);

  return `
    <!-- Filters -->
    <div class="filters-bar" style="align-items: center; justify-content: space-between;">
      <div style="display: flex; gap: 10px; flex-wrap: wrap; flex: 1; align-items: center;">
        <input type="text" class="search-input" id="txn-search" placeholder="Cari transaksi, deskripsi, ref..."
          value="${state.filters.search || ''}" style="min-width: 200px;" />
          
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 13px; color: var(--text-secondary); font-weight: 500;" for="filter-start-date">Mulai:</label>
          <input type="date" class="date-input" id="filter-start-date" value="${state.filters.startDate || ''}" />
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 13px; color: var(--text-secondary); font-weight: 500;" for="filter-end-date">Akhir:</label>
          <input type="date" class="date-input" id="filter-end-date" value="${state.filters.endDate || ''}" />
        </div>
        
        <select class="filter-select" id="filter-category">
          <option value="all" ${state.filters.category === 'all' ? 'selected' : ''}>Semua Kategori</option>
          <option value="Revenue" ${state.filters.category === 'Revenue' ? 'selected' : ''}>Pendapatan Usaha</option>
          <option value="COGS" ${state.filters.category === 'COGS' ? 'selected' : ''}>Biaya Barang dan Bahan</option>
          <option value="Operating_Expense" ${state.filters.category === 'Operating_Expense' ? 'selected' : ''}>Biaya Operasional</option>
          <option value="Financing" ${state.filters.category === 'Financing' ? 'selected' : ''}>Pembiayaan</option>
          <option value="Transfer_Internal" ${state.filters.category === 'Transfer_Internal' ? 'selected' : ''}>Pindah Dana</option>
          <option value="Other" ${state.filters.category === 'Other' ? 'selected' : ''}>Lain-lain</option>
        </select>
        
        <button class="btn btn-secondary btn-sm" id="btn-reset-filters">Reset</button>
      </div>
    </div>

    <!-- Summary & Page Size -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
      <div style="font-size: 13px; color: var(--text-secondary);">
        Menampilkan ${totalItems === 0 ? 0 : startIndex + 1}–${endIndex} dari ${totalItems} transaksi
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 13px; color: var(--text-secondary);">Tampilkan:</span>
        <select class="filter-select" id="filter-page-size" style="padding: 6px 12px; min-width: 60px; font-size: 13px;">
          <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
          <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
          <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
          <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Deskripsi</th>
            <th>Sumber / Channel</th>
            <th>Arah</th>
            <th>Nominal</th>
            <th>Klasifikasi</th>
            <th>Tingkat Keyakinan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${paginatedTxns.length === 0 ? `
            <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">Tidak ada transaksi pada periode atau kriteria yang dipilih.</td></tr>
          ` : paginatedTxns.map(t => {
            const label = t.validated_label || t.predicted_label;
            const confClass = t.confidence >= 0.80 ? 'high' : t.confidence >= 0.70 ? 'medium' : 'low';
            const statusClass = t.review_status === 'AUTO_CLASSIFIED' ? 'badge-auto' :
              t.review_status === 'VALIDATED' ? 'badge-validated' : 'badge-review';
            return `
              <tr class="clickable" data-txn-id="${t.id}">
                <td style="white-space:nowrap">${formatDate(t.date)}</td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
                <td><span class="badge badge-channel">${t.channel}</span></td>
                <td><span class="badge ${t.direction === 'IN' ? 'badge-in' : 'badge-out'}">${t.direction === 'IN' ? 'IN' : 'OUT'}</span></td>
                <td class="${t.direction === 'IN' ? 'amount-in' : 'amount-out'}" style="white-space:nowrap">
                  ${t.direction === 'IN' ? '+' : '-'}${formatCurrency(t.amount)}
                </td>
                <td>
                  <span class="badge ${getCategoryBadgeClass(label, t.review_status)}">
                    ${getIndonesianCategory(label, t.direction, t.review_status)}
                  </span>
                </td>
                <td>
                  <div class="confidence-bar">
                    <div class="confidence-track"><div class="confidence-fill ${confClass}" style="width:${t.confidence * 100}%"></div></div>
                    <span class="confidence-value">${(t.confidence * 100).toFixed(1)}%</span>
                  </div>
                </td>
                <td>
                  <span class="badge ${statusClass}">
                    <span class="badge-dot"></span>
                    ${getIndonesianStatus(t.review_status)}
                  </span>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    ${totalPages > 1 ? `
    <div style="display: flex; justify-content: center; gap: 4px; margin-top: 20px;">
      <button class="btn btn-secondary page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed"' : ''}>&lt; Prev</button>
      
      ${getPaginationArray(currentPage, totalPages).map(p => 
        p === '...' 
          ? `<span style="padding: 9px 12px; color: var(--text-secondary);">...</span>`
          : `<button class="btn ${p === currentPage ? 'btn-primary' : 'btn-secondary'} page-btn" data-page="${p}">${p}</button>`
      ).join('')}
      
      <button class="btn btn-secondary page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed"' : ''}>Next &gt;</button>
    </div>
    ` : ''}
  `;
}

function renderReconciliation() {
  const pairs = state.reconciliationPairs;

  if (pairs.length === 0) {
    return `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
        <p style="font-size:15px;font-weight:600;color:var(--text-secondary)">Tidak ada pasangan rekonsiliasi yang terdeteksi.</p>
        <p style="font-size:13px;margin-top:6px">Rekonsiliasi mencocokkan transaksi antar-kanal dengan nominal dan tanggal berdekatan.</p>
      </div>`;
  }

  return `
    <div style="margin-top:8px">
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">
        Pasangan transaksi lintas kanal yang memiliki kecocokan nominal dan waktu yang sama, membuktikan alur mutasi dana riil:
      </p>
      ${pairs.filter(p => p.transactionA && p.transactionB).map(pair => `
        <div class="recon-pair">
          <div class="recon-txn">
            <div class="recon-txn-channel">${pair.transactionA.channel}</div>
            <div class="recon-txn-amount ${pair.transactionA.direction === 'IN' ? 'amount-in' : 'amount-out'}">
              ${formatCurrency(pair.transactionA.amount)}
            </div>
            <div class="recon-txn-desc">${pair.transactionA.description}</div>
            <div class="recon-txn-desc" style="margin-top:4px">${formatDate(pair.transactionA.date)}</div>
          </div>
          <div class="recon-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="badge badge-reconciled">COCOK (MATCHED)</span>
          </div>
          <div class="recon-txn">
            <div class="recon-txn-channel">${pair.transactionB.channel}</div>
            <div class="recon-txn-amount ${pair.transactionB.direction === 'IN' ? 'amount-in' : 'amount-out'}">
              ${formatCurrency(pair.transactionB.amount)}
            </div>
            <div class="recon-txn-desc">${pair.transactionB.description}</div>
            <div class="recon-txn-desc" style="margin-top:4px">${formatDate(pair.transactionB.date)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDuplicates() {
  const dupes = state.duplicatePairs;

  if (dupes.length === 0) {
    return `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
        <p style="font-size:15px;font-weight:600;color:var(--text-secondary)">Tidak ditemukan potensi duplikasi transaksi.</p>
        <p style="font-size:13px;margin-top:6px">Deteksi duplikasi meneliti transaksi pada kanal yang sama dengan nominal identik dan tanggal berdekatan.</p>
      </div>`;
  }

  return `
    <div style="margin-top:8px">
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">
        Transaksi yang terdeteksi memiliki kemiripan tinggi. Tentukan keputusan analis tanpa menghapus catatan asal:
      </p>
      ${dupes.filter(d => d.transactionA && d.transactionB).map(dup => `
        <div class="dup-card" id="dup-${dup.id}">
          <div class="dup-header">
            <span style="font-size:13px;font-weight:600">${dup.id}</span>
            <div style="display:flex;align-items:center;gap:12px">
              <span class="dup-similarity">Tingkat Kemiripan: ${dup.similarity}%</span>
              <span class="badge ${dup.status === 'PENDING' ? 'badge-review' : dup.status === 'RESOLVED' || dup.status === 'KEPT_BOTH' ? 'badge-auto' : 'badge-channel'}">
                ${dup.status === 'PENDING' ? 'Perlu Keputusan' : dup.status === 'KEPT_BOTH' ? 'Pertahankan Keduanya' : dup.status === 'MERGED' ? 'Digabungkan' : 'Diabaikan'}
              </span>
            </div>
          </div>
          <div class="dup-txns">
            <div class="dup-txn">
              <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px">CATATAN TRANSAKSI A</div>
              <div style="font-size:13px;font-weight:600">${dup.transactionA.description}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${dup.transactionA.channel} · ${formatDate(dup.transactionA.date)}</div>
              <div style="font-size:15px;font-weight:700;margin-top:6px" class="${dup.transactionA.direction === 'IN' ? 'amount-in' : 'amount-out'}">${formatCurrency(dup.transactionA.amount)}</div>
            </div>
            <div class="dup-txn">
              <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px">CATATAN TRANSAKSI B</div>
              <div style="font-size:13px;font-weight:600">${dup.transactionB.description}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${dup.transactionB.channel} · ${formatDate(dup.transactionB.date)}</div>
              <div style="font-size:15px;font-weight:700;margin-top:6px" class="${dup.transactionB.direction === 'IN' ? 'amount-in' : 'amount-out'}">${formatCurrency(dup.transactionB.amount)}</div>
            </div>
          </div>
          ${dup.status === 'PENDING' ? `
          <div class="dup-actions">
            <button class="btn btn-sm btn-secondary dup-action" data-dup-id="${dup.id}" data-action="keep">Pertahankan Keduanya</button>
            <button class="btn btn-sm btn-primary dup-action" data-dup-id="${dup.id}" data-action="merge">Gabungkan (Merge)</button>
            <button class="btn btn-sm btn-ghost dup-action" data-dup-id="${dup.id}" data-action="ignore">Abaikan</button>
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

export function initTransactions() {
  // Event delegation diatur di main.js
}
