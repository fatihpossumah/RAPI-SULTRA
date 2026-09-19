/**
 * RAPI-SULTRA Financial Profile Page
 * Automated Financial Record, Income Statement & Cash Flow (Bahasa Indonesia)
 */

import { state, formatCurrency, getValidTransactions } from '../state.js';
import { calculateFinancials, getRevenueTrend, getCashFlowTrend, getInformationCompleteness } from '../mock-engine.js';
import { createRevenueTrendChart, createCashFlowChart, createExpenseBreakdownChart } from '../charts.js';

export function renderFinancial() {
  if (!state.demoLoaded || state.transactions.length === 0) {
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
          <div class="empty-title">Belum ada data transaksi yang dimuat.</div>
          <div class="empty-subtitle">Buka halaman Ikhtisar lalu klik "Muat Data Simulasi" untuk menyusun profil keuangan otomatis.</div>
        </div>
      </div>
    `;
  }

  const txns = state.transactions;
  const validTxns = getValidTransactions();
  const fin = calculateFinancials(txns);
  const comp = getInformationCompleteness(txns);
  const pendingReviewCount = txns.length - validTxns.length;

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
        <strong>Basis Perhitungan:</strong> Profil keuangan dihitung dari <strong>${validTxns.length} transaksi terverifikasi</strong> (Auto-classified & Validated). 
        ${pendingReviewCount > 0 ? `<span style="color:var(--warning);font-weight:600">⚠ ${pendingReviewCount} transaksi dalam Pusat Review dikecualikan</span> untuk menjaga kemurnian pembukuan.` : 'Semua transaksi telah tervalidasi 100%.'}
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card kpi-revenue">
          <div class="kpi-icon icon-revenue">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M14 6H8.5a3.5 3.5 0 000 7h3a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Pendapatan Usaha Bruto</div>
          <div class="kpi-value" style="color:var(--success)">${formatCurrency(fin.revenue)}</div>
          <div class="kpi-sub">Arus masuk penjualan multi-kanal</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-cogs" style="background:rgba(220,38,38,0.1);color:var(--danger)">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M3 10h14M3 14h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">HPP (Bahan Baku / COGS)</div>
          <div class="kpi-value" style="color:var(--danger)">${formatCurrency(fin.cogs)}</div>
          <div class="kpi-sub">Biaya persediaan & bahan baku langsung</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-rate" style="background:rgba(37,99,235,0.1);color:var(--info)">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 5v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Laba Kotor (Gross Profit)</div>
          <div class="kpi-value">${formatCurrency(fin.grossProfit)}</div>
          <div class="kpi-sub">Margin Laba Kotor: <strong>${fin.grossMargin}%</strong></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-transactions" style="background:rgba(15,118,110,0.1);color:var(--rapi-p)">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 14l4-4 3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 8V4h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Hasil Operasi Bersih (EBIT)</div>
          <div class="kpi-value" style="color:${fin.operatingResult >= 0 ? 'var(--success)' : 'var(--danger)'}">
            ${formatCurrency(fin.operatingResult)}
          </div>
          <div class="kpi-sub">Setelah Beban Operasional: ${formatCurrency(fin.opex)}</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid-2" style="margin-bottom: 24px;">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Tren Pendapatan Bulanan</div>
            <span style="font-size:12px;color:var(--text-secondary)">Fluktuasi omzet per bulan</span>
          </div>
          <div class="card-body">
            <div class="chart-container" style="height: 260px;">
              <canvas id="chart-fin-revenue"></canvas>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Arus Kas Masuk vs Keluar</div>
            <span style="font-size:12px;color:var(--text-secondary)">Perbandingan Inflow vs Outflow</span>
          </div>
          <div class="card-body">
            <div class="chart-container" style="height: 260px;">
              <canvas id="chart-fin-cashflow"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Income Statement & Expenses Breakdown -->
      <div class="grid-2" style="margin-bottom: 24px;">
        <!-- Standard Income Statement -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Catatan Keuangan Otomatis (Laba Rugi)</div>
            <span class="badge badge-auto">Standar SAK EMKM</span>
          </div>
          <div class="card-body">
            <div class="metric-row">
              <span class="metric-label" style="font-weight:600;color:var(--text-primary)">1. Pendapatan Usaha (Revenue)</span>
              <span class="metric-value positive">${formatCurrency(fin.revenue)}</span>
            </div>
            <div class="metric-row" style="padding-left:14px;">
              <span class="metric-label">2. Beban Pokok Penjualan (HPP / COGS)</span>
              <span class="metric-value negative">(${formatCurrency(fin.cogs)})</span>
            </div>
            
            <div class="metric-divider"></div>
            
            <div class="metric-row" style="background:var(--bg);padding:10px 12px;border-radius:var(--radius);">
              <span class="metric-label" style="font-weight:700;color:var(--text-primary)">Laba Kotor (Gross Profit)</span>
              <span class="metric-value" style="color:var(--primary)">${formatCurrency(fin.grossProfit)}</span>
            </div>

            <div class="metric-row" style="padding-left:14px;margin-top:6px;">
              <span class="metric-label">3. Beban Operasional (OPEX - Sewa, Gaji, Listrik, Operasional)</span>
              <span class="metric-value negative">(${formatCurrency(fin.opex)})</span>
            </div>

            <div class="metric-divider"></div>

            <div class="metric-row" style="background:rgba(22,163,74,0.08);padding:10px 12px;border-radius:var(--radius);">
              <span class="metric-label" style="font-weight:700;color:var(--success)">Hasil Usaha Operasional Bersih (Operating Result)</span>
              <span class="metric-value" style="color:var(--success);font-size:16px;">${formatCurrency(fin.operatingResult)}</span>
            </div>

            <div style="margin-top:20px;padding-top:14px;border-top:1px dashed var(--border);">
              <div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
                Pemisahan Aktivitas Pembiayaan (Non-Operasional)
              </div>
              <div class="metric-row" style="padding:6px 0;">
                <span class="metric-label">Pencairan Pembiayaan / Modal Masuk (Financing In)</span>
                <span class="metric-value positive">+${formatCurrency(fin.financingIn)}</span>
              </div>
              <div class="metric-row" style="padding:6px 0;">
                <span class="metric-label">Angsuran Pokok / Cicilan Pinjaman (Financing Out)</span>
                <span class="metric-value negative">-${formatCurrency(fin.financingOut)}</span>
              </div>
              <div class="metric-row" style="padding:6px 0;">
                <span class="metric-label">Arus Kas Pembiayaan Bersih (Net Financing)</span>
                <span class="metric-value" style="color:var(--text-secondary)">${formatCurrency(fin.netFinancing)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Expense Composition & Data Hygiene -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Komposisi Beban & Higienitas Data</div>
            <span style="font-size:12px;color:var(--text-secondary)">Analisis Beban</span>
          </div>
          <div class="card-body">
            <div class="chart-container" style="height: 180px; margin-bottom: 20px;">
              <canvas id="chart-fin-expenses"></canvas>
            </div>

            <div style="border-top:1px solid var(--border);padding-top:16px;">
              <div style="font-size:12px;font-weight:700;margin-bottom:12px;">Kelengkapan Informasi Transaksi (Data Hygiene)</div>
              
              <div style="margin-bottom:10px;">
                <div class="progress-label">
                  <span>Deskripsi Transaksi Lengkap & Jelas</span>
                  <span>${comp.description}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill fill-primary" style="width:${comp.description}%"></div>
                </div>
              </div>

              <div style="margin-bottom:10px;">
                <div class="progress-label">
                  <span>Nomor Referensi & Traceability Audit</span>
                  <span>${comp.reference}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill fill-info" style="width:${comp.reference}%"></div>
                </div>
              </div>

              <div style="margin-bottom:10px;">
                <div class="progress-label">
                  <span>Kanal Pembayaran Terverifikasi</span>
                  <span>${comp.channel}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill fill-success" style="width:${comp.channel}%"></div>
                </div>
              </div>

              <div>
                <div class="progress-label">
                  <span>Keabsahan Tanggal & Validitas Nilai</span>
                  <span>${comp.date}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill fill-success" style="width:${comp.date}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initFinancial() {
  if (!state.demoLoaded || state.transactions.length === 0) return;

  const fin = calculateFinancials(state.transactions);
  const revTrend = getRevenueTrend(state.transactions);
  const cashTrend = getCashFlowTrend(state.transactions);

  if (revTrend.labels.length > 0) {
    createRevenueTrendChart('chart-fin-revenue', revTrend);
  }

  if (cashTrend.labels.length > 0) {
    createCashFlowChart('chart-fin-cashflow', cashTrend);
  }

  if (fin.cogs > 0 || fin.opex > 0) {
    createExpenseBreakdownChart('chart-fin-expenses', fin.cogs, fin.opex);
  }
}
