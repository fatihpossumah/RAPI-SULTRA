/**
 * RAPI-SULTRA Financial Profile Page
 * Automated Financial Record, Income Statement & Cash Flow (Bahasa Indonesia)
 */

import { state, formatCurrency } from '../state.js';
import { createRevenueTrendChart, createExpenseBreakdownChart } from '../charts.js';

const INDO_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatMonthLabel(monthStr) {
  if (!monthStr) return 'Unknown';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const [y, m] = parts;
  return `${INDO_MONTHS[parseInt(m) - 1]} ${y}`;
}

export function renderFinancial() {
  if (!state.demoLoaded || !state.financialSummary) {
    return `
      <div class="page">
        <div class="page-header">
          <div class="page-header-text">
            <h2>Profil Keuangan Otomatis</h2>
            <p>Catatan keuangan terstandarisasi yang disusun berdasarkan riwayat transaksi usaha Anda.</p>
          </div>
        </div>
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M4 28V14l6-4 6 4 6-6 6 6 6-4v18H4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
          </div>
          <div class="empty-title">Data keuangan belum tersedia.</div>
          <div class="empty-subtitle">Data belum mencukupi untuk memberikan gambaran periode ini. Klik "Muat Data Simulasi" untuk mengimpor dari backend.</div>
        </div>
      </div>
    `;
  }

  const fin = state.financialSummary;
  const val = state.validation || {};
  const pendingReviewCount = fin.pending_review_count || 0;
  const validTxnsCount = fin.included_transaction_count || 0;
  
  const cogsVal = fin.cogs || 0;
  const opexVal = fin.operating_expense || 0;
  const hasExpenseData = (cogsVal !== 0 || opexVal !== 0);

  return `
    <style>
      .section-title {
        font-size: 15px;
        font-weight: 600;
        margin: 24px 0 12px 0;
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .calc-flow-horizontal {
        display: flex;
        align-items: stretch;
        flex-wrap: wrap;
        gap: 12px;
        background: var(--bg-primary);
        padding: 16px;
        border-radius: 8px;
        border: 1px solid var(--border);
        margin-bottom: 24px;
      }
      .flow-item {
        flex: 1;
        min-width: 130px;
        padding: 12px;
        border-radius: 6px;
        background: var(--bg-secondary);
        display: flex;
        flex-direction: column;
      }
      .flow-math {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-muted);
      }
      .flow-negative {
        background: var(--danger-bg);
        border: 1px solid rgba(220, 38, 38, 0.2);
      }
      .flow-positive {
        background: var(--success-bg);
        border: 1px solid rgba(22, 163, 74, 0.2);
      }
      .flow-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }
      .flow-value {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
      }
      .flow-note {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 6px;
        line-height: 1.3;
      }
      .kpi-card {
        padding: 24px 16px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        height: 100% !important;
        box-sizing: border-box !important;
      }
      .kpi-icon {
        margin: 0 auto 16px auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 48px !important;
        height: 48px !important;
        border-radius: 50% !important;
      }
      .kpi-label {
        font-size: 13px !important;
        font-weight: 600 !important;
        margin: 0 0 8px 0 !important;
        color: var(--text-secondary) !important;
        width: 100% !important;
      }
      .kpi-value {
        font-size: 22px !important;
        font-weight: 700 !important;
        margin: 0 0 8px 0 !important;
        color: var(--text-primary) !important;
        width: 100% !important;
      }
      .kpi-sub {
        font-size: 12px !important;
        color: var(--text-muted) !important;
        line-height: 1.5 !important;
        margin: 0 !important;
        width: 100% !important;
      }
    </style>

    <div class="page">
      <div class="page-header" style="margin-bottom: 16px;">
        <div class="page-header-text">
          <h2>Profil Keuangan Otomatis</h2>
          <p>Catatan keuangan terstandarisasi yang disusun berdasarkan riwayat transaksi usaha Anda.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btn-export-financial">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4 4 4-4M2 13h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Cetak Laporan
          </button>
        </div>
      </div>

      <!-- Basis Perhitungan (Global Source) -->
      <div class="evidence-disclaimer" style="margin-bottom: 16px; padding: 12px 16px;">
        <strong>Basis Perhitungan:</strong> Profil ini menggunakan <strong>${validTxnsCount} transaksi yang sudah dapat digunakan dalam pencatatan</strong>. 
        ${pendingReviewCount > 0 ? `${pendingReviewCount} transaksi yang masih perlu diperiksa belum dimasukkan dalam perhitungan utama.` : 'Semua transaksi yang tersedia telah masuk ke dalam perhitungan.'}
      </div>

      <!-- PENDAPATAN & BIAYA -->
      <div class="kpi-grid" style="margin-bottom: 16px;">
        <div class="kpi-card kpi-revenue">
          <div class="kpi-icon icon-revenue" style="background:var(--success-bg);color:var(--success)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 20V4m0 0l-6 6m6-6l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Pendapatan Usaha</div>
          <div class="kpi-value" style="color:var(--success)">${formatCurrency(fin.revenue || 0)}</div>
          <div class="kpi-sub">Penerimaan dari penjualan usaha.</div>
        </div>
        <div class="kpi-card kpi-expense">
          <div class="kpi-icon icon-cogs" style="background:var(--danger-bg);color:var(--danger)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Biaya Barang dan Bahan</div>
          <div class="kpi-value" style="color:var(--danger)">${formatCurrency(fin.cogs || 0)}</div>
          <div class="kpi-sub">Untuk stok dan barang usaha.</div>
        </div>
        <div class="kpi-card kpi-expense">
          <div class="kpi-icon icon-transactions" style="background:var(--danger-bg);color:var(--danger)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Biaya Operasional</div>
          <div class="kpi-value" style="color:var(--danger)">${formatCurrency(fin.operating_expense || 0)}</div>
          <div class="kpi-sub">Untuk menjalankan kegiatan usaha.</div>
        </div>
      </div>

      <!-- HASIL USAHA (FLOW) -->
      <h3 class="section-title">Hasil Usaha</h3>
      <div class="calc-flow-horizontal">
        <div class="flow-item">
          <div class="flow-label">Pendapatan Usaha</div>
          <div class="flow-value">${formatCurrency(fin.revenue || 0)}</div>
        </div>
        
        <div class="flow-math">−</div>
        
        <div class="flow-item">
          <div class="flow-label">Biaya Barang & Bahan</div>
          <div class="flow-value">${formatCurrency(fin.cogs || 0)}</div>
        </div>
        
        <div class="flow-math">=</div>
        
        <div class="flow-item ${(fin.gross_profit || 0) < 0 ? 'flow-negative' : 'flow-positive'}">
          <div class="flow-label">Laba Kotor</div>
          <div class="flow-value" style="color:${(fin.gross_profit || 0) < 0 ? 'var(--danger)' : 'var(--success)'}">
            ${(fin.gross_profit || 0) < 0 ? '-' : ''}${formatCurrency(Math.abs(fin.gross_profit || 0))}
          </div>
          <div class="flow-note">
            ${(fin.gross_profit || 0) < 0 
              ? 'Biaya barang dan bahan tercatat lebih besar daripada pendapatan.' 
              : 'Margin Laba Kotor: ' + (fin.gross_margin || 0).toFixed(1) + '%'}
          </div>
        </div>
        
        <div class="flow-math">−</div>
        
        <div class="flow-item">
          <div class="flow-label">Biaya Operasional</div>
          <div class="flow-value">${formatCurrency(fin.operating_expense || 0)}</div>
        </div>
        
        <div class="flow-math">=</div>
        
        <div class="flow-item ${(fin.operating_result || 0) < 0 ? 'flow-negative' : 'flow-positive'}">
          <div class="flow-label">Hasil Operasi</div>
          <div class="flow-value" style="font-size:18px; color:${(fin.operating_result || 0) < 0 ? 'var(--danger)' : 'var(--success)'}">
            ${(fin.operating_result || 0) < 0 ? '-' : ''}${formatCurrency(Math.abs(fin.operating_result || 0))}
          </div>
          <div class="flow-note">
            ${(fin.operating_result || 0) < 0 
              ? 'Setelah biaya operasional, hasil usaha berada di bawah nol.' 
              : 'Usaha mencatat keuntungan setelah seluruh biaya diperhitungkan.'}
          </div>
        </div>
      </div>

      <!-- PEMBIAYAAN & ARUS KAS -->
      <h3 class="section-title">Pembiayaan & Arus Kas</h3>
      
      <div style="background: var(--info-bg); padding: 16px 20px; border-radius: 8px; border: 1px solid rgba(37,99,235,0.15); margin-bottom: 24px; display: flex; gap: 16px; align-items: center;">
        <div style="font-size:20px; display:flex; align-items:center; justify-content:center;">ℹ️</div>
        <div style="font-size:13px; line-height:1.5; color:var(--text-primary); margin:0;">
          Laba menunjukkan hasil usaha dari pendapatan dan biaya. Arus kas menunjukkan perubahan dana yang masuk dan keluar secara total.
        </div>
      </div>

      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card" style="border: 1px solid rgba(22, 163, 74, 0.2);">
          <div class="kpi-icon" style="background:var(--success-bg);color:var(--success)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Pembiayaan Masuk</div>
          <div class="kpi-value" style="color:var(--success)">${formatCurrency(fin.financing_inflow || 0)}</div>
          <div class="kpi-sub">Dana dari pembiayaan atau pinjaman.</div>
        </div>

        <div class="kpi-card" style="border: 1px solid rgba(220, 38, 38, 0.2);">
          <div class="kpi-icon" style="background:var(--danger-bg);color:var(--danger)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Pembiayaan Keluar</div>
          <div class="kpi-value" style="color:var(--danger)">${formatCurrency(fin.financing_outflow || 0)}</div>
          <div class="kpi-sub">Pembayaran kembali pembiayaan.</div>
        </div>

        <div class="kpi-card" style="border: 1px solid ${(fin.net_cash_movement || 0) >= 0 ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'};">
          <div class="kpi-icon" style="background:var(--info-bg);color:var(--info)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Arus Kas Bersih</div>
          <div class="kpi-value" style="color:${(fin.net_cash_movement || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}">
            ${(fin.net_cash_movement || 0) < 0 ? '-' : ''}${formatCurrency(Math.abs(fin.net_cash_movement || 0))}
          </div>
          <div class="kpi-sub">Menunjukkan selisih dana masuk dan keluar.</div>
        </div>
      </div>

      <!-- SECTION 6: GRAFIK & DETAIL -->
      <div class="grid-2" style="margin-bottom: 24px;">
        <div class="card">
          <div class="card-header" style="padding-bottom:12px;">
            <div>
              <h3 style="font-size:15px; margin-bottom:4px;">Perkembangan Keuangan Bulanan</h3>
              <p style="font-size:12px; color:var(--text-secondary); margin:0;">Melihat perubahan pendapatan usaha dari bulan ke bulan.</p>
            </div>
          </div>
          <div class="chart-container" style="min-height:200px;">
            <canvas id="chart-revenue"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header" style="padding-bottom:12px;">
            <div>
              <h3 style="font-size:15px; margin-bottom:4px;">Penggunaan Biaya Usaha</h3>
              <p style="font-size:12px; color:var(--text-secondary); margin:0;">Melihat pembagian biaya usaha antara barang dan bahan serta biaya operasional.</p>
            </div>
          </div>
          ${hasExpenseData ? `
          <div class="chart-container" style="position: relative; height: 280px; width: 100%; margin-top: 16px;">
            <canvas id="chart-expense-breakdown"></canvas>
          </div>
          <p style="text-align: center; font-size: 11px; color: var(--text-muted); margin-top: 16px; margin-bottom: 0;">
            Bagian ini membantu melihat biaya mana yang paling banyak digunakan dalam menjalankan usaha.
          </p>
          ` : `
          <div style="display:flex; justify-content:center; align-items:center; height:280px; color:var(--text-muted); font-size:13px; text-align:center;">
            Belum ada data biaya usaha.
          </div>
          `}
        </div>
      </div>

    </div>
  `;
}

export function initFinancial() {
  if (!state.demoLoaded || !state.monthlySummary) return;

  const monthly = state.monthlySummary;
  
  // Filter empty rows
  const validMonthly = monthly.filter(m => m.month && m.month.trim() !== '');

  // Format data for Revenue Chart
  const revenueData = {
    labels: validMonthly.map(m => formatMonthLabel(m.month)),
    data: validMonthly.map(m => parseFloat(m.revenue || 0))
  };
  createRevenueTrendChart('chart-revenue', revenueData);

  // Expense Breakdown
  const finSum = state.financialSummary;
  const sumCogs = finSum.cogs || 0;
  const sumOpex = finSum.operating_expense || 0;
  if (sumCogs !== 0 || sumOpex !== 0) {
    createExpenseBreakdownChart('chart-expense-breakdown', sumCogs, sumOpex);
  }
}
