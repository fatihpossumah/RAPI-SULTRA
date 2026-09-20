/**
 * RAPI-SULTRA Financing Readiness Profile Page
 * 4 Dimensi (R-A-P-I) + Interactive Radar Chart + Evidence Layer Audit Trail (Bahasa Indonesia)
 */

import { state } from '../state.js';
import { createRAPIRadarChart } from '../charts.js';

// Mapping kualitatif ke pseudo-nilai murni untuk visualisasi Radar Chart (tidak untuk ditampilkan sebagai skor)
function getPseudoValue(status) {
    if (!status) return 0;
    if (status.includes('HIGHLY_') || status.includes('HIGH_')) return 90;
    if (status.includes('MODERATE') || status.includes('OBSERVED')) return 65;
    if (status.includes('LOW') || status.includes('NEGATIVE') || status.includes('VARIABLE')) return 40;
    return 10;
}

function getStatusClass(status) {
    if (!status) return 'limited';
    if (status.includes('HIGHLY_') || status.includes('HIGH_')) return 'strong';
    if (status.includes('MODERATE') || status.includes('OBSERVED')) return 'moderate';
    return 'limited';
}

function getLabelId(status) {
    // Map raw status dict
    const dict = {
        "HIGHLY_STABLE": "Sangat Stabil",
        "MODERATE_VARIABILITY": "Variabilitas Sedang",
        "HIGHLY_VARIABLE": "Sangat Variatif",
        "HIGHLY_POSITIVE": "Sangat Positif",
        "MODERATELY_POSITIVE": "Positif Moderat",
        "NEGATIVE_CASH_FLOW": "Arus Kas Negatif",
        "HIGH_PAYMENT_ACTIVITY": "Sangat Aktif",
        "OBSERVED_PAYMENT_ACTIVITY": "Aktivitas Teramati",
        "LOW_PAYMENT_ACTIVITY": "Kurang Aktif",
        "HIGHLY_COMPLETE": "Sangat Lengkap",
        "MODERATELY_COMPLETE": "Cukup Lengkap",
        "LOW_COMPLETENESS": "Kurang Lengkap"
    };
    return dict[status] || status;
}

export function renderRAPI() {
  if (!state.demoLoaded || !state.rapiProfile) {
    return `
      <div class="page">
        <div class="page-header">
          <div class="page-header-text">
            <h2>Profil Kesiapan Pembiayaan RAPI</h2>
            <p>Penilaian kesiapan 4-dimensi dan evidence layer objektif untuk analisis pembiayaan.</p>
          </div>
        </div>
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="14" stroke="currentColor" stroke-width="2"/><path d="M18 10v8l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <div class="empty-title">Belum ada data profil yang tersedia.</div>
          <div class="empty-subtitle">Klik "Muat Data Simulasi" untuk menyusun Profil RAPI dari backend.</div>
        </div>
      </div>
    `;
  }

  const p = state.rapiProfile;
  const mappedRapi = {
      R: {
          name: 'Revenue Stability',
          statusRaw: p.revenue_stability.status,
          status: getLabelId(p.revenue_stability.status),
          description: p.revenue_stability.interpretation,
          statusClass: getStatusClass(p.revenue_stability.status),
          value: getPseudoValue(p.revenue_stability.status)
      },
      A: {
          name: 'Account / Cash-flow Consistency',
          statusRaw: p.cash_flow_consistency.status,
          status: getLabelId(p.cash_flow_consistency.status),
          description: p.cash_flow_consistency.interpretation,
          statusClass: getStatusClass(p.cash_flow_consistency.status),
          value: getPseudoValue(p.cash_flow_consistency.status)
      },
      P: {
          name: 'Payment Behaviour',
          statusRaw: p.payment_behaviour.status,
          status: getLabelId(p.payment_behaviour.status),
          description: p.payment_behaviour.interpretation,
          statusClass: getStatusClass(p.payment_behaviour.status),
          value: getPseudoValue(p.payment_behaviour.status)
      },
      I: {
          name: 'Information Completeness',
          statusRaw: p.information_completeness.status,
          status: getLabelId(p.information_completeness.status),
          description: p.information_completeness.interpretation,
          statusClass: getStatusClass(p.information_completeness.status),
          value: getPseudoValue(p.information_completeness.status)
      }
  };

  return `
    <div class="page">
      <div class="page-header">
        <div class="page-header-text">
          <h2>Profil Kesiapan Pembiayaan RAPI</h2>
          <p>Evidence Layer objektif yang mentransformasikan jejak transaksi multi-kanal untuk analis pembiayaan.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btn-print-evidence">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6V2h8v4M4 12H3a1 1 0 01-1-1V7a1 1 0 011-1h10a1 1 0 011 1v4a1 1 0 01-1 1h-1M4 10h8v4H4v-4z" stroke="currentColor" stroke-width="1.5"/></svg>
            Cetak Berkas Bukti (Evidence Dossier)
          </button>
        </div>
      </div>

      <!-- Critical Regulatory & Functional Disclaimer -->
      <div class="evidence-disclaimer" style="border-left-color: var(--primary); background: #EFF6FF; margin-bottom: 24px;">
        <div style="font-weight: 700; color: var(--primary); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="1.5"/></svg>
          Pemberitahuan Kerangka Kerja PoC RAPI-SULTRA
        </div>
        <div style="font-size: 12px; color: #1E3A8A; line-height: 1.6;">
          <strong>RAPI-SULTRA BUKAN credit scoring formal, bukan loan eligibility engine, dan bukan sistem persetujuan/penolakan kredit otomatis.</strong> 
          Sistem ini berfungsi sebagai <strong>Evidence Layer</strong> (lapisan pembuktian) yang menyajikan transparansi jejak transaksi digital UMKM agar mempermudah analis kredit lembaga pembiayaan dalam melakukan verifikasi objektif.
        </div>
      </div>

      <!-- Radar Overview & Dimensions Summary -->
      <div class="grid-2" style="margin-bottom: 24px;">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Radar Multi-Dimensi RAPI</div>
            <span class="badge badge-channel">Indikator PoC Ilustratif</span>
          </div>
          <div class="card-body">
            <div class="chart-container" style="height: 320px;">
              <canvas id="chart-rapi-radar"></canvas>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Matriks Status Kesiapan Pembiayaan</div>
            <span style="font-size: 12px; color: var(--text-secondary)">Evaluasi 4 Dimensi Utama</span>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Dim R -->
            <div style="padding: 12px; border-radius: var(--radius); background: rgba(29,78,216,0.04); border: 1px solid rgba(29,78,216,0.15);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-weight:700; color:var(--rapi-r)">R — ${mappedRapi.R.name}</span>
                <span class="rapi-dim-status ${mappedRapi.R.statusClass === 'strong' ? 'rapi-status-strong' : mappedRapi.R.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
                  ${mappedRapi.R.status}
                </span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">${mappedRapi.R.description}</div>
            </div>

            <!-- Dim A -->
            <div style="padding: 12px; border-radius: var(--radius); background: rgba(37,99,235,0.04); border: 1px solid rgba(37,99,235,0.15);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-weight:700; color:var(--rapi-a)">A — ${mappedRapi.A.name}</span>
                <span class="rapi-dim-status ${mappedRapi.A.statusClass === 'strong' ? 'rapi-status-strong' : mappedRapi.A.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
                  ${mappedRapi.A.status}
                </span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">${mappedRapi.A.description}</div>
            </div>

            <!-- Dim P -->
            <div style="padding: 12px; border-radius: var(--radius); background: rgba(15,118,110,0.04); border: 1px solid rgba(15,118,110,0.15);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-weight:700; color:var(--rapi-p)">P — ${mappedRapi.P.name}</span>
                <span class="rapi-dim-status ${mappedRapi.P.statusClass === 'strong' ? 'rapi-status-strong' : mappedRapi.P.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
                  ${mappedRapi.P.status}
                </span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">${mappedRapi.P.description}</div>
            </div>

            <!-- Dim I -->
            <div style="padding: 12px; border-radius: var(--radius); background: rgba(100,116,139,0.04); border: 1px solid rgba(100,116,139,0.15);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-weight:700; color:var(--text-primary)">I — ${mappedRapi.I.name}</span>
                <span class="rapi-dim-status ${mappedRapi.I.statusClass === 'strong' ? 'rapi-status-strong' : mappedRapi.I.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
                  ${mappedRapi.I.status}
                </span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">${mappedRapi.I.description}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

export function initRAPI() {
  if (!state.demoLoaded || !state.rapiProfile) return;

  const p = state.rapiProfile;
  const mappedProfile = {
      R: { value: getPseudoValue(p.revenue_stability.status) },
      A: { value: getPseudoValue(p.cash_flow_consistency.status) },
      P: { value: getPseudoValue(p.payment_behaviour.status) },
      I: { value: getPseudoValue(p.information_completeness.status) }
  };
  createRAPIRadarChart('chart-rapi-radar', mappedProfile);
}
