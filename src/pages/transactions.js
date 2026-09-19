/**
 * RAPI-SULTRA Transactions Page
 * Halaman Daftar Transaksi, Rekonsiliasi, dan Deteksi Duplikasi (Bahasa Indonesia)
 */

import { state, getFilteredTransactions, formatCurrency, formatDate } from '../state.js';

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
  return `
    <!-- Filters -->
    <div class="filters-bar">
      <input type="text" class="search-input" id="txn-search" placeholder="Cari transaksi, deskripsi, ref..."
        value="${state.filters.search}" />
      <select class="filter-select" id="filter-channel">
        <option value="all" ${state.filters.channel === 'all' ? 'selected' : ''}>Semua Kanal</option>
        <option value="QRIS" ${state.filters.channel === 'QRIS' ? 'selected' : ''}>QRIS</option>
        <option value="Transfer" ${state.filters.channel === 'Transfer' ? 'selected' : ''}>Transfer Bank</option>
        <option value="Cash" ${state.filters.channel === 'Cash' ? 'selected' : ''}>Tunai (Cash)</option>
        <option value="Invoice" ${state.filters.channel === 'Invoice' ? 'selected' : ''}>Invoice / Nota</option>
        <option value="Bank Mutation" ${state.filters.channel === 'Bank Mutation' ? 'selected' : ''}>Mutasi Bank</option>
      </select>
      <select class="filter-select" id="filter-category">
        <option value="all" ${state.filters.category === 'all' ? 'selected' : ''}>Semua Kategori</option>
        <option value="Revenue" ${state.filters.category === 'Revenue' ? 'selected' : ''}>Revenue (Pendapatan Usaha)</option>
        <option value="COGS" ${state.filters.category === 'COGS' ? 'selected' : ''}>COGS (HPP / Bahan Baku)</option>
        <option value="Operating_Expense" ${state.filters.category === 'Operating_Expense' ? 'selected' : ''}>Operating Expense (Beban Operasi)</option>
        <option value="Financing" ${state.filters.category === 'Financing' ? 'selected' : ''}>Financing (Pembiayaan)</option>
        <option value="Transfer_Internal" ${state.filters.category === 'Transfer_Internal' ? 'selected' : ''}>Transfer Internal</option>
        <option value="Other" ${state.filters.category === 'Other' ? 'selected' : ''}>Lain-lain (Other)</option>
      </select>
      <select class="filter-select" id="filter-status">
        <option value="all" ${state.filters.status === 'all' ? 'selected' : ''}>Semua Status</option>
        <option value="AUTO_CLASSIFIED" ${state.filters.status === 'AUTO_CLASSIFIED' ? 'selected' : ''}>Otomatis (≥70%)</option>
        <option value="REVIEW_REQUIRED" ${state.filters.status === 'REVIEW_REQUIRED' ? 'selected' : ''}>Perlu Review (<70%)</option>
        <option value="VALIDATED" ${state.filters.status === 'VALIDATED' ? 'selected' : ''}>Tervalidasi Analis</option>
      </select>
      <select class="filter-select" id="filter-direction">
        <option value="all" ${state.filters.direction === 'all' ? 'selected' : ''}>Semua Arah Dana</option>
        <option value="IN" ${state.filters.direction === 'IN' ? 'selected' : ''}>IN (Pemasukan)</option>
        <option value="OUT" ${state.filters.direction === 'OUT' ? 'selected' : ''}>OUT (Pengeluaran)</option>
      </select>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Deskripsi Transaksi</th>
            <th>Kanal</th>
            <th>Arah</th>
            <th>Nominal</th>
            <th>Kategori AI</th>
            <th>Keyakinan</th>
            <th>Status Verifikasi</th>
          </tr>
        </thead>
        <tbody>
          ${txns.length === 0 ? `
            <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">Tidak ada transaksi yang cocok dengan filter pencarian.</td></tr>
          ` : txns.map(t => {
            const label = t.validated_label || t.predicted_label;
            const confClass = t.confidence >= 0.80 ? 'high' : t.confidence >= 0.70 ? 'medium' : 'low';
            const statusClass = t.review_status === 'AUTO_CLASSIFIED' ? 'badge-auto' :
              t.review_status === 'VALIDATED' ? 'badge-validated' : 'badge-review';
            const statusText = t.review_status === 'AUTO_CLASSIFIED' ? 'Otomatis' :
              t.review_status === 'VALIDATED' ? 'Tervalidasi' : 'Perlu Review';
            return `
              <tr class="clickable" data-txn-id="${t.id}">
                <td style="white-space:nowrap">${formatDate(t.date)}</td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
                <td><span class="badge badge-channel">${t.channel}</span></td>
                <td><span class="badge ${t.direction === 'IN' ? 'badge-in' : 'badge-out'}">${t.direction === 'IN' ? 'IN' : 'OUT'}</span></td>
                <td class="${t.direction === 'IN' ? 'amount-in' : 'amount-out'}" style="white-space:nowrap">
                  ${t.direction === 'IN' ? '+' : '-'}${formatCurrency(t.amount)}
                </td>
                <td>${label.replace(/_/g, ' ')}</td>
                <td>
                  <div class="confidence-bar">
                    <div class="confidence-track"><div class="confidence-fill ${confClass}" style="width:${t.confidence * 100}%"></div></div>
                    <span class="confidence-value">${(t.confidence * 100).toFixed(1)}%</span>
                  </div>
                </td>
                <td>
                  <span class="badge ${statusClass}">
                    <span class="badge-dot"></span>
                    ${statusText}
                  </span>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
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
      ${pairs.map(pair => `
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
      ${dupes.map(dup => `
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
