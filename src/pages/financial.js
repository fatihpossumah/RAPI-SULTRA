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
            <p>Catatan keuangan terstandarisasi dan analitik arus kas operasional berbasis jejak transaksi multi-kanal.</p>
          </div>
        </div>
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M4 28V14l6-4 6 4 6-6 6 6 6-4v18H4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
          </div>
          <div class="empty-title">Belum ada data dari backend RAPI-SULTRA.</div>
          <div class="empty-subtitle">Klik "Muat Data Simulasi" untuk mengambil data presentasi dari backend.</div>
        </div>
      </div>
    `;
  }

  const fin = state.financialSummary;
  const val = state.validation || {};
  const pendingReviewCount = fin.pending_review_count || 0;
  const validTxnsCount = fin.included_transaction_count || 0;

  return `
    <div class="page">
      <div class="page-header">
        <div class="page-header-text">
          <h2>Profil Keuangan Otomatis</h2>
          <p>Catatan keuangan terstandarisasi dan analitik arus kas operasional berbasis jejak transaksi multi-kanal.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btn-export-financial">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 6l4 4 4-4M2 13h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Cetak / Ekspor Laporan Keuangan
          </button>
        </div>
      </div>

      <!-- Scope / Quality Banner -->
      <div class="evidence-disclaimer" style="margin-bottom: 24px;">
        <strong>Basis Perhitungan:</strong> Profil keuangan dihitung dari <strong>${validTxnsCount} transaksi terverifikasi</strong> (Auto-classified & Validated). 
        ${pendingReviewCount > 0 ? `<span style="color:var(--warning);font-weight:600">⚠ ${pendingReviewCount} transaksi dalam Pusat Review dikecualikan</span> untuk menjaga kemurnian pembukuan.` : 'Semua transaksi telah tervalidasi 100%.'}
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card kpi-revenue">
          <div class="kpi-icon icon-revenue">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M14 6H8.5a3.5 3.5 0 000 7h3a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Pendapatan Usaha Bruto</div>
          <div class="kpi-value" style="color:var(--success)">${formatCurrency(fin.revenue || 0)}</div>
          <div class="kpi-sub">Arus masuk penjualan multi-kanal</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-cogs" style="background:rgba(220,38,38,0.1);color:var(--danger)">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M3 10h14M3 14h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">HPP (Bahan Baku / COGS)</div>
          <div class="kpi-value" style="color:var(--danger)">${formatCurrency(fin.cogs || 0)}</div>
          <div class="kpi-sub">Biaya persediaan & bahan baku langsung</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-rate" style="background:rgba(37,99,235,0.1);color:var(--info)">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 5v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Laba Kotor (Gross Profit)</div>
          <div class="kpi-value">${formatCurrency(fin.gross_profit || 0)}</div>
          <div class="kpi-sub">Margin Laba Kotor: <strong>${(fin.gross_margin || 0).toFixed(1)}%</strong></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-transactions" style="background:rgba(15,118,110,0.1);color:var(--rapi-p)">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 14l4-4 3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 8V4h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Hasil Operasi Bersih (EBIT)</div>
          <div class="kpi-value" style="color:${(fin.operating_result || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}">
            ${formatCurrency(fin.operating_result || 0)}
          </div>
          <div class="kpi-sub">Setelah Beban Operasional: ${formatCurrency(fin.operating_expense || 0)}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(22, 163, 74, 0.1);color:var(--success)">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10l5 5 5-5M10 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Pembiayaan Masuk</div>
          <div class="kpi-value" style="color:var(--success)">${formatCurrency(fin.financing_inflow || 0)}</div>
          <div class="kpi-sub">Inflow pendanaan operasional</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(220, 38, 38, 0.1);color:var(--danger)">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10l5-5 5 5M10 17V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Pembiayaan Keluar</div>
          <div class="kpi-value" style="color:var(--danger)">${formatCurrency(fin.financing_outflow || 0)}</div>
          <div class="kpi-sub">Pelunasan atau outflow pembiayaan</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(99, 102, 241, 0.1);color:var(--primary)">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 8c-1-1-3-1-4-1s-3 1-3 3 1 3 4 3 3 1 3 3-1 3-3 3-4-1-5-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 3v14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kpi-label">Pergerakan Kas Bersih</div>
          <div class="kpi-value" style="color:${(fin.net_cash_movement || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}">
            ${(fin.net_cash_movement || 0) < 0 ? '-' : ''}${formatCurrency(fin.net_cash_movement || 0)}
          </div>
          <div class="kpi-sub">Hasil akhir ketersediaan dana</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div style="margin-bottom: 24px;">
        <div class="card">
          <div class="card-header">
            <h3>Tren Pendapatan</h3>
          </div>
          <div class="chart-container">
            <canvas id="chart-revenue"></canvas>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3>Struktur Biaya Usaha</h3>
          </div>
          <div class="chart-container" style="display:flex; justify-content:center;">
            <div style="width: 250px; height: 250px;">
              <canvas id="chart-expense-breakdown"></canvas>
            </div>
          </div>
        </div>

        <!-- Income Statement Summary List -->
        <div class="card p-0">
          <div class="card-header" style="padding: 20px;">
            <h3>Laporan Laba Rugi Singkat</h3>
          </div>
          <div class="list-group">
            <div class="list-item" style="justify-content: space-between; padding: 16px 20px;">
              <span style="font-weight: 500;">(+) Pendapatan Usaha</span>
              <span style="color:var(--success);font-weight:600">${formatCurrency(fin.revenue || 0)}</span>
            </div>
            <div class="list-item" style="justify-content: space-between; padding: 16px 20px; background:var(--bg-secondary)">
              <span>(-) HPP / Bahan Baku</span>
              <span style="color:var(--danger)">${formatCurrency(fin.cogs || 0)}</span>
            </div>
            <div class="list-item" style="justify-content: space-between; padding: 16px 20px; border-bottom: 2px solid var(--border-color)">
              <span style="font-weight: 600;">Laba Kotor</span>
              <span style="font-weight: 600; color:${(fin.gross_profit || 0) < 0 ? 'var(--danger)' : 'var(--text-primary)'}">
                ${(fin.gross_profit || 0) < 0 ? '-' : ''}${formatCurrency(fin.gross_profit || 0)}
              </span>
            </div>
            <div class="list-item" style="justify-content: space-between; padding: 16px 20px; background:var(--bg-secondary)">
              <span>(-) Beban Operasional</span>
              <span style="color:var(--danger)">${formatCurrency(fin.operating_expense || 0)}</span>
            </div>
            <div class="list-item" style="justify-content: space-between; padding: 16px 20px;">
              <span style="font-weight: 600; font-size: 1.1em;">Hasil Operasi (EBIT)</span>
              <span style="font-weight: 700; font-size: 1.1em; color:${(fin.operating_result || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}">
                ${(fin.operating_result || 0) < 0 ? '-' : ''}${formatCurrency(fin.operating_result || 0)}
              </span>
            </div>
            <div class="list-item" style="justify-content: space-between; padding: 16px 20px; background:var(--bg-secondary)">
              <span>Pergerakan Kas Bersih (Net Cash)</span>
              <span style="font-weight: 600; color:${(fin.net_cash_movement || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}">
                ${(fin.net_cash_movement || 0) < 0 ? '-' : ''}${formatCurrency(fin.net_cash_movement || 0)}
              </span>
            </div>
          </div>
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
  const fin = state.financialSummary;
  createExpenseBreakdownChart('chart-expense-breakdown', fin.cogs || 0, fin.operating_expense || 0);
}
