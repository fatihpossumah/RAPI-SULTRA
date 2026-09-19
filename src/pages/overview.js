/**
 * RAPI-SULTRA Overview Page
 * Halaman Ikhtisar Utama (Bahasa Indonesia)
 */

import { state, getReviewTransactions, getValidTransactions, formatCurrency, formatDate } from '../state.js';
import { calculateFinancials, getRevenueTrend } from '../mock-engine.js';
import { createRevenueTrendChart, createExpenseBreakdownChart } from '../charts.js';

export function renderOverview() {
  if (!state.demoLoaded || state.transactions.length === 0) {
    return renderEmptyState();
  }

  const txns = state.transactions;
  const valid = getValidTransactions();
  const review = getReviewTransactions();
  const fin = calculateFinancials(txns);
  const autoClassified = txns.filter(t => t.review_status === 'AUTO_CLASSIFIED').length;
  const automationRate = txns.length > 0 ? Math.round((autoClassified / txns.length) * 100) : 0;

  const totalRevenue = fin.revenue;
  const totalExpenses = fin.cogs + fin.opex;

  // Source counts
  const sources = {};
  ['QRIS', 'Transfer', 'Cash', 'Invoice', 'Bank Mutation'].forEach(ch => {
    sources[ch] = txns.filter(t => t.channel === ch).length;
  });

  // Recent transactions (last 8)
  const recent = [...txns].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return `
    <div class="page">
      <div class="page-header">
        <div class="page-header-text">
          <h2>Ikhtisar RAPI-SULTRA</h2>
          <p>Transformasi jejak transaksi multi-kanal menjadi catatan keuangan terstruktur dan profil kesiapan pembiayaan UMKM.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btn-add-txn-overview">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Tambah Transaksi
          </button>
          <button class="btn btn-primary" id="btn-load-demo-overview">
            Muat Data Simulasi
          </button>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-transactions">
          <div class="kpi-icon icon-transactions">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14M3 8h14M3 12h10M3 16h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Total Transaksi</div>
          <div class="kpi-value">${txns.length}</div>
          <div class="kpi-sub">Lintas seluruh kanal pembayaran</div>
        </div>
        <div class="kpi-card kpi-revenue">
          <div class="kpi-icon icon-revenue">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M6 6l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Pendapatan Usaha</div>
          <div class="kpi-value" style="color:var(--success)">${formatCurrency(totalRevenue)}</div>
          <div class="kpi-sub">Dari transaksi terklasifikasi</div>
        </div>
        <div class="kpi-card kpi-expense">
          <div class="kpi-icon icon-expense">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M6 14l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Total Beban Usaha</div>
          <div class="kpi-value" style="color:var(--danger)">${formatCurrency(totalExpenses)}</div>
          <div class="kpi-sub">HPP (Bahan Baku) + Beban Operasional</div>
        </div>
        <div class="kpi-card kpi-financing">
          <div class="kpi-icon icon-financing">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h14" stroke="currentColor" stroke-width="1.5"/></svg>
          </div>
          <div class="kpi-label">Pembiayaan Bersih</div>
          <div class="kpi-value" style="color:var(--info)">${formatCurrency(fin.netFinancing)}</div>
          <div class="kpi-sub">Pencairan − Angsuran Pinjaman</div>
        </div>
        <div class="kpi-card kpi-review">
          <div class="kpi-icon icon-review">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v3M10 13h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Perlu Review</div>
          <div class="kpi-value" style="color:${review.length > 0 ? 'var(--warning)' : 'var(--success)'}">${review.length}</div>
          <div class="kpi-sub">${review.length > 0 ? 'Menunggu verifikasi analis' : 'Semua terverifikasi'}</div>
        </div>
      </div>

      <!-- AI Transaction Processing -->
      <div class="section">
        <div class="section-title"><span class="dot"></span> Pemrosesan Mesin Transaksi AI</div>
        <div class="card">
          <div class="ai-processing">
            <div class="ai-stat">
              <div class="ai-stat-value">${txns.length}</div>
              <div class="ai-stat-label">Total Transaksi</div>
            </div>
            <div class="ai-stat">
              <div class="ai-stat-value" style="color:var(--success)">${autoClassified}</div>
              <div class="ai-stat-label">Otomatis Terklasifikasi (≥70%)</div>
            </div>
            <div class="ai-stat">
              <div class="ai-stat-value" style="color:var(--warning)">${review.length}</div>
              <div class="ai-stat-label">Perlu Review Analis (<70%)</div>
            </div>
            <div class="ai-stat highlight">
              <div class="ai-stat-value">${automationRate}%</div>
              <div class="ai-stat-label">Tingkat Automasi AI</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid-2 section">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Tren Pendapatan Bulanan</span>
          </div>
          <div class="chart-container">
            <canvas id="chart-revenue-trend"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">Komposisi Beban Usaha</span>
          </div>
          <div class="chart-container">
            <canvas id="chart-expense-breakdown"></canvas>
          </div>
        </div>
      </div>

      <!-- Transaction Sources -->
      <div class="section">
        <div class="section-title"><span class="dot"></span> Distribusi Kanal Sumber Transaksi</div>
        <div class="source-grid">
          ${Object.entries(sources).map(([ch, count]) => {
            const icons = { 'QRIS': '📱', 'Transfer': '🏦', 'Cash': '💵', 'Invoice': '📄', 'Bank Mutation': '📊' };
            const indoChannel = ch === 'Cash' ? 'Tunai (Cash)' : ch === 'Transfer' ? 'Transfer Bank' : ch === 'Bank Mutation' ? 'Mutasi Bank' : ch;
            return `
              <div class="source-item">
                <div class="source-icon">${icons[ch] || '📋'}</div>
                <div class="source-label">${indoChannel}</div>
                <div class="source-count">${count} transaksi</div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="section">
        <div class="section-title"><span class="dot"></span> Transaksi Terkini Lintas Kanal</div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Deskripsi Transaksi</th>
                <th>Kanal</th>
                <th>Kategori AI</th>
                <th>Keyakinan</th>
                <th>Status Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              ${recent.map(t => {
                const label = t.validated_label || t.predicted_label;
                const confClass = t.confidence >= 0.80 ? 'high' : t.confidence >= 0.70 ? 'medium' : 'low';
                const statusClass = t.review_status === 'AUTO_CLASSIFIED' ? 'badge-auto' :
                  t.review_status === 'VALIDATED' ? 'badge-validated' : 'badge-review';
                const statusText = t.review_status === 'AUTO_CLASSIFIED' ? 'Otomatis' :
                  t.review_status === 'VALIDATED' ? 'Tervalidasi' : 'Perlu Review';
                return `
                  <tr class="clickable" data-txn-id="${t.id}">
                    <td>${formatDate(t.date)}</td>
                    <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
                    <td><span class="badge badge-channel">${t.channel}</span></td>
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
      </div>
    </div>
  `;
}

export function initOverview() {
  if (!state.demoLoaded || state.transactions.length === 0) return;

  const fin = calculateFinancials(state.transactions);
  const revTrend = getRevenueTrend(state.transactions);

  if (revTrend.labels.length > 0) {
    createRevenueTrendChart('chart-revenue-trend', revTrend);
  }
  if (fin.cogs > 0 || fin.opex > 0) {
    createExpenseBreakdownChart('chart-expense-breakdown', fin.cogs, fin.opex);
  }
}

function renderEmptyState() {
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-header-text">
          <h2>Ikhtisar RAPI-SULTRA</h2>
          <p>Transformasi jejak transaksi multi-kanal menjadi catatan keuangan terstruktur dan profil kesiapan pembiayaan UMKM.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btn-add-txn-overview">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Tambah Transaksi
          </button>
          <button class="btn btn-primary" id="btn-load-demo-overview">
            Muat Data Simulasi
          </button>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 6v24M6 18h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="empty-title">Belum ada data transaksi yang dimuat.</div>
        <div class="empty-subtitle">Muat dataset simulasi RAPI-SULTRA untuk mengeksplorasi alur lengkap transformasi transaksi ke profil kesiapan pembiayaan.</div>
        <button class="btn btn-primary" id="btn-load-demo-empty">Muat Data Simulasi</button>
      </div>
    </div>
  `;
}
