/**
 * RAPI-SULTRA Financing Readiness Profile Page
 * 4 Dimensi (R-A-P-I) Summary Page (Bahasa Indonesia)
 */

import { state } from '../state.js';

function getStatusClass(status) {
    if (!status) return 'limited';
    if (status.includes('HIGHLY_') || status.includes('HIGH_')) return 'strong';
    if (status.includes('MODERATE') || status.includes('OBSERVED')) return 'moderate';
    return 'limited';
}

function getLabelId(status) {
    const dict = {
        "HIGHLY_STABLE": "Sangat Stabil",
        "MODERATE_VARIABILITY": "Variasi Pendapatan Sedang",
        "HIGHLY_VARIABLE": "Sangat Variatif",
        "HIGHLY_POSITIVE": "Sangat Positif",
        "MODERATELY_POSITIVE": "Cenderung Positif",
        "NEGATIVE_CASH_FLOW": "Arus Kas Negatif",
        "HIGH_PAYMENT_ACTIVITY": "Sangat Aktif",
        "OBSERVED_PAYMENT_ACTIVITY": "Aktivitas Teramati",
        "LOW_PAYMENT_ACTIVITY": "Kurang Aktif",
        "HIGHLY_COMPLETE": "Informasi Sangat Lengkap",
        "MODERATELY_COMPLETE": "Cukup Lengkap",
        "LOW_COMPLETENESS": "Kurang Lengkap"
    };
    return dict[status] || status;
}

function buildEvidence(dim, p) {
    if (dim === 'R') {
        const months = p.revenue_stability.evidence.active_months || 0;
        return `Pendapatan usaha teramati selama ${months} bulan. Kondisi ini merangkum pergerakan pendapatan historis tanpa memprediksi masa depan.`;
    }
    if (dim === 'A') {
        const pos = p.cash_flow_consistency.evidence.positive_months || 0;
        const total = p.cash_flow_consistency.evidence.observed_months || 0;
        return `Arus kas bersih tercatat positif pada ${pos} dari total ${total} bulan yang diamati.`;
    }
    if (dim === 'P') {
        const pay = p.payment_behaviour.evidence.months_with_payment || 0;
        if (pay > 0) {
            return `Terdapat aktivitas pembayaran pembiayaan yang tercatat selama ${pay} bulan.`;
        }
        return `Belum ada aktivitas pembayaran pembiayaan yang secara eksplisit teramati pada data.`;
    }
    if (dim === 'I') {
        const rate = p.information_completeness.evidence.overall_completeness_rate || 0;
        return `Kelengkapan atribut informasi transaksi tercatat sebesar ${rate}%. Tingkat kelengkapan ini mengukur keberadaan data untuk analisa lebih lanjut.`;
    }
    return '';
}

export function renderRAPI() {
  if (!state.demoLoaded || !state.rapiProfile) {
    return `
      <div class="page">
        <div class="page-header">
          <div class="page-header-text">
            <h2>Profil Kesiapan Pembiayaan RAPI</h2>
            <p>Ringkasan informasi keuangan dan aktivitas transaksi yang dapat membantu memberikan gambaran usaha kepada pihak pembiayaan.</p>
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
          nameId: 'Stabilitas Pendapatan',
          status: getLabelId(p.revenue_stability.status),
          description: buildEvidence('R', p),
          statusClass: getStatusClass(p.revenue_stability.status)
      },
      A: {
          name: 'Account / Cash-flow Consistency',
          nameId: 'Konsistensi Arus Kas',
          status: getLabelId(p.cash_flow_consistency.status),
          description: buildEvidence('A', p),
          statusClass: getStatusClass(p.cash_flow_consistency.status)
      },
      P: {
          name: 'Payment Behaviour',
          nameId: 'Aktivitas Pembayaran',
          status: getLabelId(p.payment_behaviour.status),
          description: buildEvidence('P', p),
          statusClass: getStatusClass(p.payment_behaviour.status)
      },
      I: {
          name: 'Information Completeness',
          nameId: 'Kelengkapan Informasi',
          status: getLabelId(p.information_completeness.status),
          description: buildEvidence('I', p),
          statusClass: getStatusClass(p.information_completeness.status)
      }
  };

  return `
    <style>
      .rapi-card {
        padding: 24px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        height: 100%;
        box-shadow: var(--shadow-sm);
        transition: var(--transition);
      }
      .rapi-card:hover {
        box-shadow: var(--shadow);
      }
      .rapi-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        gap: 16px;
      }
      .rapi-card-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .rapi-letter {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 800;
        flex-shrink: 0;
      }
      .rapi-desc {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.6;
        margin: 0;
      }
      
      /* Colors */
      .bg-r { background: var(--info-bg); color: var(--primary); }
      .border-r { border-left: 4px solid #1D4ED8; }
      
      .bg-a { background: var(--info-bg); color: var(--info); }
      .border-a { border-left: 4px solid #2563EB; }
      
      .bg-p { background: var(--info-bg); color: var(--primary-light); }
      .border-p { border-left: 4px solid #0F766E; }
      
      .bg-i { background: var(--border-light); color: var(--navy); }
      .border-i { border-left: 4px solid #475569; }

      .rapi-dim-status {
        font-size: 12px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 20px;
        white-space: nowrap;
      }
      .rapi-status-strong { background: var(--success-bg); color: var(--success); }
      .rapi-status-moderate { background: var(--warning-bg); color: var(--warning); }
      .rapi-status-limited { background: var(--danger-bg); color: var(--danger); }
    </style>

    <div class="page">
      <div class="page-header" style="margin-bottom: 24px;">
        <div class="page-header-text">
          <h2>Profil Kesiapan Pembiayaan RAPI</h2>
          <p>RAPI Financing Readiness Profile</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btn-print-evidence" style="height: 40px; padding: 0 16px; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Cetak Berkas Bukti
          </button>
        </div>
      </div>

      <!-- Critical Regulatory & Functional Disclaimer -->
      <div class="evidence-disclaimer" style="border-left-color: var(--primary); background: var(--info-bg); padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid rgba(37,99,235,0.15);">
        <div style="font-weight: 700; color: var(--primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Catatan Penting
        </div>
        <div style="font-size: 13px; color: #1E3A8A; line-height: 1.6;">
          RAPI-SULTRA mengubah jejak transaksi menjadi profil informasi keuangan yang lebih terstruktur untuk mendukung analisis pembiayaan. Profil ini bukan skor kredit dan bukan keputusan persetujuan pinjaman.
        </div>
      </div>

      <!-- Radar Overview -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
            <div class="card-title">Gambaran 4 Dimensi RAPI</div>
            <span class="badge badge-channel" style="font-size: 11px;">Visualisasi Indikator</span>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">
            Grafik ini membantu melihat gambaran relatif empat indikator RAPI berdasarkan data yang tersedia.
          </p>
        </div>
        <div class="card-body">
          <div class="grid-2" style="gap: 24px; align-items: center;">
            <div class="chart-container" style="height: 320px; position: relative;">
              <canvas id="chart-rapi-radar"></canvas>
            </div>
            
            <!-- Radar Legend/Explanation -->
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; font-size: 13px;">
              <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">Apa arti arah pada grafik?</div>
              
              <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                <div>
                  <div style="font-weight: 600; color: #1D4ED8;">↑ Atas — Revenue Stability</div>
                  <div style="color: var(--text-secondary); font-size: 12px; line-height: 1.4;">Semakin ke atas, indikator kestabilan pendapatan yang ditampilkan semakin tinggi.</div>
                </div>
                <div>
                  <div style="font-weight: 600; color: #2563EB;">→ Kanan — Account / Cash-flow Consistency</div>
                  <div style="color: var(--text-secondary); font-size: 12px; line-height: 1.4;">Semakin ke kanan, indikator konsistensi arus kas yang ditampilkan semakin tinggi.</div>
                </div>
                <div>
                  <div style="font-weight: 600; color: #0F766E;">↓ Bawah — Payment Behaviour</div>
                  <div style="color: var(--text-secondary); font-size: 12px; line-height: 1.4;">Semakin ke bawah, aktivitas pembayaran yang teramati semakin tinggi.</div>
                </div>
                <div>
                  <div style="font-weight: 600; color: #475569;">← Kiri — Information Completeness</div>
                  <div style="color: var(--text-secondary); font-size: 12px; line-height: 1.4;">Semakin ke kiri, kelengkapan informasi yang tersedia semakin tinggi.</div>
                </div>
              </div>

              <div style="font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 12px; line-height: 1.4;">
                <strong>Catatan:</strong> Grafik ini merupakan visualisasi indikator RAPI, bukan skor kredit dan bukan keputusan pembiayaan.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4 Dimensions Grid -->
      <div style="margin-bottom: 24px;">
        <h3 class="section-title" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">Ringkasan 4 Dimensi RAPI</h3>
        <div class="grid-2">
          
          <!-- Dim R -->
          <div class="rapi-card border-r">
            <div class="rapi-card-header">
              <div class="rapi-card-title">
                <div class="rapi-letter bg-r">R</div>
                <div>
                  <div style="font-weight: 700; color: var(--text-primary); line-height: 1.2;">${mappedRapi.R.name}</div>
                  <div style="font-weight: 400; font-size: 13px; color: var(--text-secondary); margin-top: 2px;">${mappedRapi.R.nameId}</div>
                </div>
              </div>
              <span class="rapi-dim-status rapi-status-${mappedRapi.R.statusClass}">
                ${mappedRapi.R.status}
              </span>
            </div>
            <p class="rapi-desc">${mappedRapi.R.description}</p>
          </div>

          <!-- Dim A -->
          <div class="rapi-card border-a">
            <div class="rapi-card-header">
              <div class="rapi-card-title">
                <div class="rapi-letter bg-a">A</div>
                <div>
                  <div style="font-weight: 700; color: var(--text-primary); line-height: 1.2;">${mappedRapi.A.name}</div>
                  <div style="font-weight: 400; font-size: 13px; color: var(--text-secondary); margin-top: 2px;">${mappedRapi.A.nameId}</div>
                </div>
              </div>
              <span class="rapi-dim-status rapi-status-${mappedRapi.A.statusClass}">
                ${mappedRapi.A.status}
              </span>
            </div>
            <p class="rapi-desc">${mappedRapi.A.description}</p>
          </div>

          <!-- Dim P -->
          <div class="rapi-card border-p">
            <div class="rapi-card-header">
              <div class="rapi-card-title">
                <div class="rapi-letter bg-p">P</div>
                <div>
                  <div style="font-weight: 700; color: var(--text-primary); line-height: 1.2;">${mappedRapi.P.name}</div>
                  <div style="font-weight: 400; font-size: 13px; color: var(--text-secondary); margin-top: 2px;">${mappedRapi.P.nameId}</div>
                </div>
              </div>
              <span class="rapi-dim-status rapi-status-${mappedRapi.P.statusClass}">
                ${mappedRapi.P.status}
              </span>
            </div>
            <p class="rapi-desc">${mappedRapi.P.description}</p>
          </div>

          <!-- Dim I -->
          <div class="rapi-card border-i">
            <div class="rapi-card-header">
              <div class="rapi-card-title">
                <div class="rapi-letter bg-i">I</div>
                <div>
                  <div style="font-weight: 700; color: var(--text-primary); line-height: 1.2;">${mappedRapi.I.name}</div>
                  <div style="font-weight: 400; font-size: 13px; color: var(--text-secondary); margin-top: 2px;">${mappedRapi.I.nameId}</div>
                </div>
              </div>
              <span class="rapi-dim-status rapi-status-${mappedRapi.I.statusClass}">
                ${mappedRapi.I.status}
              </span>
            </div>
            <p class="rapi-desc">${mappedRapi.I.description}</p>
          </div>

        </div>
      </div>

      <!-- Data Source Note -->
      <div style="text-align: center; margin-top: 32px;">
        <span style="font-size: 12px; color: var(--text-muted); background: var(--bg-secondary); padding: 6px 16px; border-radius: 20px;">
          Sumber informasi: Berdasarkan transaksi yang telah diproses sistem.
        </span>
      </div>

    </div>
  `;
}

function getPseudoValue(statusRaw) {
    if (!statusRaw) return 0;
    if (statusRaw.includes('HIGHLY_') || statusRaw.includes('HIGH_')) return 90;
    if (statusRaw.includes('MODERATE') || statusRaw.includes('OBSERVED')) return 65;
    if (statusRaw.includes('LOW') || statusRaw.includes('NEGATIVE') || statusRaw.includes('VARIABLE')) return 40;
    return 10;
}

import { createRAPIRadarChart } from '../charts.js';

export function initRAPI() {
  if (!state.demoLoaded || !state.rapiProfile) return;

  const p = state.rapiProfile;
  const mappedProfile = {
      R: { 
          value: getPseudoValue(p.revenue_stability.status),
          status: getLabelId(p.revenue_stability.status),
          evidence: buildEvidence('R', p)
      },
      A: { 
          value: getPseudoValue(p.cash_flow_consistency.status),
          status: getLabelId(p.cash_flow_consistency.status),
          evidence: buildEvidence('A', p)
      },
      P: { 
          value: getPseudoValue(p.payment_behaviour.status),
          status: getLabelId(p.payment_behaviour.status),
          evidence: buildEvidence('P', p)
      },
      I: { 
          value: getPseudoValue(p.information_completeness.status),
          status: getLabelId(p.information_completeness.status),
          evidence: buildEvidence('I', p)
      }
  };
  
  createRAPIRadarChart('chart-rapi-radar', mappedProfile);
}
