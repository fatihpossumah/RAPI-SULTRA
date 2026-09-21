/**
 * RAPI-SULTRA Overview Page
 * Halaman Ikhtisar Utama (Bahasa Indonesia)
 */

import { state, getReviewTransactions, getValidTransactions, formatCurrency, formatDate } from '../state.js';

function getIndonesianRapiStatus(status) {
  if (!status) return 'Tidak Tersedia';
  const mapping = {
    'HIGH_STABILITY': 'Stabilitas Tinggi',
    'MODERATE_VARIABILITY': 'Variasi Sedang',
    'HIGH_VARIABILITY': 'Variasi Tinggi',
    'LOW_STABILITY': 'Stabilitas Rendah',
    'HIGHLY_POSITIVE': 'Sangat Positif',
    'MODERATELY_POSITIVE': 'Cenderung Positif',
    'NEUTRAL': 'Netral',
    'MODERATELY_NEGATIVE': 'Cenderung Negatif',
    'NEGATIVE': 'Negatif',
    'STRONG_PAYMENT_ACTIVITY': 'Aktivitas Kuat',
    'OBSERVED_PAYMENT_ACTIVITY': 'Aktivitas Teramati',
    'LIMITED_PAYMENT_ACTIVITY': 'Aktivitas Terbatas',
    'NO_PAYMENT_ACTIVITY': 'Tidak Ada Aktivitas',
    'HIGHLY_COMPLETE': 'Sangat Lengkap',
    'MODERATELY_COMPLETE': 'Cukup Lengkap',
    'LOW_COMPLETENESS': 'Kurang Lengkap'
  };
  return mapping[status] || status.replace(/_/g, ' ');
}

function getRapiEvidence(dim, status) {
  if (!status) return 'Data belum memadai untuk dianalisis.';
  const s = status;
  if (dim === 'R') {
    if (s.includes('HIGH') || s === 'MODERATE_VARIABILITY') return 'Pendapatan stabil dengan variasi wajar.';
    return 'Fluktuasi pendapatan tercatat cukup tinggi.';
  }
  if (dim === 'A') {
    if (s.includes('POSITIVE')) return 'Pemasukan menutupi pengeluaran dengan baik.';
    return 'Arus kas keluar seringkali melebihi pemasukan.';
  }
  if (dim === 'P') {
    if (s.includes('STRONG') || s.includes('OBSERVED')) return 'Terdapat riwayat pembayaran yang terdata.';
    return 'Riwayat pembayaran minim atau tidak terdata.';
  }
  if (dim === 'I') {
    if (s.includes('HIGH') || s.includes('MODERATE')) return 'Data usaha dan finansial terisi dengan lengkap.';
    return 'Masih banyak data pendukung yang kosong.';
  }
  return 'Data dalam tahap observasi.';
}

function getIndonesianStatus(status) {
  if (!status) return 'TIDAK DIKETAHUI';
  const mapping = {
    'AUTO_CLASSIFIED': 'DIPROSES OTOMATIS',
    'REVIEW_REQUIRED': 'PERLU DIPERIKSA',
    'VALIDATED': 'TERVALIDASI',
    'PENDING_REVIEW': 'MENUNGGU DIPERIKSA',
    'POSSIBLE_DUPLICATE': 'KEMUNGKINAN GANDA',
    'RECONCILIATION_REVIEW': 'PERLU REKONSILIASI'
  };
  return mapping[status] || status.replace(/_/g, ' ');
}

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

function renderEmptyState() {
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-header-text">
          <h2>Ikhtisar RAPI-SULTRA</h2>
          <p>Transformasi jejak transaksi multi-kanal menjadi catatan keuangan terstruktur dan profil kesiapan pembiayaan UMKM.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-load-demo-overview" style="height: 42px;">
            Muat Data Simulasi
          </button>
        </div>
      </div>
      <div class="empty-state" style="margin-top: 40px;">
        <div class="empty-icon">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M18 10v16M10 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <div class="empty-title">Belum ada data</div>
        <div class="empty-subtitle">Klik tombol Muat Data Simulasi untuk mengambil data dari backend RAPI-SULTRA.</div>
        <button class="btn btn-primary" id="btn-load-demo-empty" style="margin-top: 16px;">Muat Data Simulasi</button>
      </div>
    </div>
  `;
}

function getStrengthClass(status) {
  if (!status) return 'rapi-status-limited';
  if (status.includes('HIGH') || status.includes('POSITIVE') || status.includes('COMPLETE')) return 'rapi-status-strong';
  if (status.includes('MODERATE') || status.includes('OBSERVED')) return 'rapi-status-moderate';
  return 'rapi-status-limited';
}

function getBadgeClass(status) {
  switch (status) {
    case 'AUTO_CLASSIFIED':
    case 'READY':
      return 'badge-success';
    case 'VALIDATED':
      return 'badge-info';
    case 'REVIEW_REQUIRED':
    case 'PENDING_REVIEW':
      return 'badge-warning';
    case 'POSSIBLE_DUPLICATE':
      return 'badge-danger';
    case 'RECONCILIATION_REVIEW':
      return 'badge-warning';
    default:
      return 'badge-channel';
  }
}

export function renderOverview() {
  if (!state.demoLoaded || state.transactions.length === 0 || !state.financialSummary) {
    return renderEmptyState();
  }

  const txns = state.transactions;
  const fin = state.financialSummary;
  const rapi = state.rapiProfile;
  
  const totalRevenue = fin.revenue || 0;
  const totalExpenses = (fin.cogs || 0) + (fin.operating_expense || 0);
  const netFinancing = (fin.financing_inflow || 0) - (fin.financing_outflow || 0);
  
  const reviewCount = getReviewTransactions().length;
  const autoClassified = txns.length - reviewCount;
  const automationRate = txns.length > 0 ? Math.round((autoClassified / txns.length) * 100) : 0;

  // Recent transactions (last 5)
  const recent = [...txns].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return `
    <div class="page">
      <div class="page-header">
        <div class="page-header-text">
          <h2>Ikhtisar RAPI-SULTRA</h2>
          <p>Transformasi jejak transaksi multi-kanal menjadi catatan keuangan terstruktur dan profil kesiapan pembiayaan UMKM.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btn-add-txn-overview" style="height: 42px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Upload CSV Transaksi
          </button>
          <button class="btn btn-primary" id="btn-load-demo-overview" style="height: 42px;">
            Muat Ulang Data Backend
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
          <div class="kpi-sub">HPP + Beban Operasional</div>
        </div>
        <div class="kpi-card kpi-financing">
          <div class="kpi-icon icon-financing">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h14" stroke="currentColor" stroke-width="1.5"/></svg>
          </div>
          <div class="kpi-label">Pembiayaan Bersih</div>
          <div class="kpi-value" style="color:var(--info)">${formatCurrency(netFinancing)}</div>
          <div class="kpi-sub">Pencairan − Angsuran Pinjaman</div>
        </div>
        <div class="kpi-card kpi-review">
          <div class="kpi-icon icon-review">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v3M10 13h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Perlu Review</div>
          <div class="kpi-value" style="color:${reviewCount > 0 ? 'var(--warning)' : 'var(--success)'}">${reviewCount}</div>
          <div class="kpi-sub">${reviewCount > 0 ? 'Menunggu verifikasi analis' : 'Semua terverifikasi'}</div>
        </div>
      </div>

      <!-- AI Transaction Processing Overview -->
      <div class="section">
        <div class="section-title"><span class="dot"></span> Ringkasan Pengolahan Transaksi</div>
        <div class="card">
          <div class="ai-processing">
            <div class="ai-stat">
              <div class="ai-stat-value">${automationRate}%</div>
              <div class="ai-stat-label">Transaksi Diproses Otomatis</div>
            </div>
            <div class="ai-stat highlight">
              <div class="ai-stat-value">${autoClassified} / ${txns.length}</div>
              <div class="ai-stat-label">Diproses Otomatis</div>
            </div>
            <div class="ai-stat">
              <div class="ai-stat-value">${reviewCount} / ${txns.length}</div>
              <div class="ai-stat-label">Perlu Diperiksa</div>
            </div>
          </div>
          <div class="mt-16 text-muted fs-13 text-center" style="margin-top: 16px;">
            Transaksi yang masuk diproses secara otomatis untuk membantu mengelompokkan transaksi usaha. Sebagian transaksi diteruskan untuk diperiksa agar pencatatan tetap akurat.
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Financial Summary -->
        <div class="section">
          <div class="section-title"><span class="dot" style="background:var(--success)"></span> Ringkasan Keuangan</div>
          <div class="card" style="padding: 16px 24px;">
            <div class="metric-row">
              <span class="metric-label">Pendapatan Usaha</span>
              <span class="metric-value positive">${formatCurrency(fin.revenue)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">HPP / COGS</span>
              <span class="metric-value negative">${formatCurrency(fin.cogs)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Beban Operasional</span>
              <span class="metric-value negative">${formatCurrency(fin.operating_expense)}</span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-row">
              <span class="metric-label">Laba Kotor</span>
              <span class="metric-value ${fin.gross_profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(fin.gross_profit)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Arus Kas Bersih</span>
              <span class="metric-value ${fin.net_cash_movement >= 0 ? 'positive' : 'negative'}">${formatCurrency(fin.net_cash_movement)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Pembiayaan Masuk</span>
              <span class="metric-value positive">${formatCurrency(fin.financing_inflow)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Pembiayaan Keluar</span>
              <span class="metric-value negative">${formatCurrency(fin.financing_outflow)}</span>
            </div>
          </div>
        </div>

        <!-- RAPI Profile -->
        <div class="section">
          <div class="section-title"><span class="dot" style="background:var(--primary)"></span> Profil Kesiapan Pembiayaan RAPI</div>
          <div class="text-muted fs-13 mb-16" style="margin-bottom: 16px; font-size: 13px; color: var(--text-secondary);">Profil deskriptif berbasis data usaha</div>
          <div class="grid-2">
            <div class="rapi-card rapi-r" style="padding: 20px;">
              <div class="rapi-letter">R</div>
              <div class="rapi-dim-name">Stabilitas Pendapatan</div>
              <div class="rapi-dim-status ${getStrengthClass(rapi?.revenue_stability?.status)}">${getIndonesianRapiStatus(rapi?.revenue_stability?.status)}</div>
              <div class="rapi-dim-desc mt-8" style="margin-top: 12px;">${getRapiEvidence('R', rapi?.revenue_stability?.status)}</div>
            </div>
            <div class="rapi-card rapi-a" style="padding: 20px;">
              <div class="rapi-letter">A</div>
              <div class="rapi-dim-name">Konsistensi Arus Kas</div>
              <div class="rapi-dim-status ${getStrengthClass(rapi?.cash_flow_consistency?.status)}">${getIndonesianRapiStatus(rapi?.cash_flow_consistency?.status)}</div>
              <div class="rapi-dim-desc mt-8" style="margin-top: 12px;">${getRapiEvidence('A', rapi?.cash_flow_consistency?.status)}</div>
            </div>
            <div class="rapi-card rapi-p" style="padding: 20px;">
              <div class="rapi-letter">P</div>
              <div class="rapi-dim-name">Aktivitas Pembayaran</div>
              <div class="rapi-dim-status ${getStrengthClass(rapi?.payment_behaviour?.status)}">${getIndonesianRapiStatus(rapi?.payment_behaviour?.status)}</div>
              <div class="rapi-dim-desc mt-8" style="margin-top: 12px;">${getRapiEvidence('P', rapi?.payment_behaviour?.status)}</div>
            </div>
            <div class="rapi-card rapi-i" style="padding: 20px;">
              <div class="rapi-letter">I</div>
              <div class="rapi-dim-name">Kelengkapan Informasi</div>
              <div class="rapi-dim-status ${getStrengthClass(rapi?.information_completeness?.status)}">${getIndonesianRapiStatus(rapi?.information_completeness?.status)}</div>
              <div class="rapi-dim-desc mt-8" style="margin-top: 12px;">${getRapiEvidence('I', rapi?.information_completeness?.status)}</div>
            </div>
          </div>
          <div class="evidence-disclaimer mt-16" style="margin-top: 16px; margin-bottom: 0;">
            Profil Kesiapan Pembiayaan RAPI merupakan ringkasan deskriptif berbasis data yang tersedia dan bukan skor kredit final atau keputusan pembiayaan.
          </div>
        </div>
      </div>

      <!-- Recent Transactions Table -->
      <div class="section">
        <div class="section-title"><span class="dot" style="background:var(--info)"></span> Jejak Transaksi Terbaru</div>
        <div class="text-muted fs-13 mb-16" style="margin-bottom: 16px; font-size: 13px; color: var(--text-secondary);">Jenis transaksi dikelompokkan otomatis untuk membantu pencatatan usaha. Beberapa transaksi mungkin memerlukan pemeriksaan agar pencatatan tetap tepat.</div>
        <div class="card p-0" style="padding: 0;">
          <div class="table-container table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>TANGGAL</th>
                  <th>REFERENCE ID</th>
                  <th>DESKRIPSI</th>
                  <th>SUMBER</th>
                  <th>NOMINAL</th>
                  <th>JENIS TRANSAKSI</th>
                  <th>TINGKAT KEYAKINAN</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${recent.map(t => {
                  return `
                    <tr data-txn-id="${t.id}" class="clickable">
                      <td>${formatDate(t.date).split(',')[0]}</td>
                      <td class="fs-12 text-muted" style="font-size: 12px; color: var(--text-muted);">#${t.referenceId || t.id.split('-')[0]}</td>
                      <td>${t.description}</td>
                      <td>${t.channel}</td>
                      <td>
                        <span class="${t.direction === 'IN' ? 'amount-in' : 'amount-out'}">
                          ${t.direction === 'IN' ? '+' : '-'}${formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td>
                        <span class="badge ${getCategoryBadgeClass(t.predicted_label || t.financial_category, t.review_status)}">${getIndonesianCategory(t.predicted_label || t.financial_category, t.direction, t.review_status)}</span>
                      </td>
                      <td>
                        ${t.confidence ? (t.confidence * 100).toFixed(1) + '%' : '-'}
                      </td>
                      <td>
                        <span class="badge ${getBadgeClass(t.review_status)}">${getIndonesianStatus(t.review_status)}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div style="padding: 16px 24px; text-align: center; border-top: 1px solid var(--border-light);">
            <a href="#transactions" class="btn btn-secondary">Lihat Semua Transaksi</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initOverview() {
  // Init not needed for overview currently
}
