/**
 * RAPI-SULTRA Financing Readiness Profile Page
 * 4 Dimensi (R-A-P-I) + Interactive Radar Chart + Evidence Layer Audit Trail (Bahasa Indonesia)
 */

import { state } from '../state.js';
import { calculateFinancials, getInformationCompleteness, generateRAPIProfile } from '../mock-engine.js';
import { createRAPIRadarChart } from '../charts.js';

export function renderRAPI() {
  if (!state.demoLoaded || state.transactions.length === 0) {
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
          <div class="empty-subtitle">Buka halaman Ikhtisar lalu klik "Muat Data Simulasi" untuk menyusun Profil RAPI.</div>
        </div>
      </div>
    `;
  }

  const txns = state.transactions;
  const fin = calculateFinancials(txns);
  const comp = getInformationCompleteness(txns);
  const rapi = generateRAPIProfile(txns, fin, comp);

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
                <span style="font-weight:700; color:var(--rapi-r)">R — ${rapi.R.name}</span>
                <span class="rapi-dim-status ${rapi.R.statusClass === 'strong' ? 'rapi-status-strong' : rapi.R.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
                  ${rapi.R.status}
                </span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">${rapi.R.description}</div>
            </div>

            <!-- Dim A -->
            <div style="padding: 12px; border-radius: var(--radius); background: rgba(37,99,235,0.04); border: 1px solid rgba(37,99,235,0.15);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-weight:700; color:var(--rapi-a)">A — ${rapi.A.name}</span>
                <span class="rapi-dim-status ${rapi.A.statusClass === 'strong' ? 'rapi-status-strong' : rapi.A.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
                  ${rapi.A.status}
                </span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">${rapi.A.description}</div>
            </div>

            <!-- Dim P -->
            <div style="padding: 12px; border-radius: var(--radius); background: rgba(15,118,110,0.04); border: 1px solid rgba(15,118,110,0.15);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-weight:700; color:var(--rapi-p)">P — ${rapi.P.name}</span>
                <span class="rapi-dim-status ${rapi.P.statusClass === 'strong' ? 'rapi-status-strong' : rapi.P.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
                  ${rapi.P.status}
                </span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">${rapi.P.description}</div>
            </div>

            <!-- Dim I -->
            <div style="padding: 12px; border-radius: var(--radius); background: rgba(71,85,105,0.04); border: 1px solid rgba(71,85,105,0.15);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-weight:700; color:var(--rapi-i)">I — ${rapi.I.name}</span>
                <span class="rapi-dim-status ${rapi.I.statusClass === 'strong' ? 'rapi-status-strong' : rapi.I.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
                  ${rapi.I.status}
                </span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">${rapi.I.description}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4 Dimensions Detailed Cards Grid -->
      <div class="grid-4" style="margin-bottom: 24px;">
        <!-- R Dimension Card -->
        <div class="rapi-card rapi-r">
          <div class="rapi-letter">R</div>
          <div class="rapi-dim-name">${rapi.R.name}</div>
          <div class="rapi-dim-desc">${rapi.R.description}</div>
          <div>
            <span class="rapi-dim-status ${rapi.R.statusClass === 'strong' ? 'rapi-status-strong' : rapi.R.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
              ${rapi.R.status}
            </span>
          </div>
          <div class="rapi-dim-basis">
            <strong>Basis Bukti Transaksi:</strong><br>${rapi.R.basis}
          </div>
        </div>

        <!-- A Dimension Card -->
        <div class="rapi-card rapi-a">
          <div class="rapi-letter">A</div>
          <div class="rapi-dim-name">${rapi.A.name}</div>
          <div class="rapi-dim-desc">${rapi.A.description}</div>
          <div>
            <span class="rapi-dim-status ${rapi.A.statusClass === 'strong' ? 'rapi-status-strong' : rapi.A.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
              ${rapi.A.status}
            </span>
          </div>
          <div class="rapi-dim-basis">
            <strong>Basis Bukti Transaksi:</strong><br>${rapi.A.basis}
          </div>
        </div>

        <!-- P Dimension Card -->
        <div class="rapi-card rapi-p">
          <div class="rapi-letter">P</div>
          <div class="rapi-dim-name">${rapi.P.name}</div>
          <div class="rapi-dim-desc">${rapi.P.description}</div>
          <div>
            <span class="rapi-dim-status ${rapi.P.statusClass === 'strong' ? 'rapi-status-strong' : rapi.P.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
              ${rapi.P.status}
            </span>
          </div>
          <div class="rapi-dim-basis">
            <strong>Basis Bukti Transaksi:</strong><br>${rapi.P.basis}
          </div>
        </div>

        <!-- I Dimension Card -->
        <div class="rapi-card rapi-i">
          <div class="rapi-letter">I</div>
          <div class="rapi-dim-name">${rapi.I.name}</div>
          <div class="rapi-dim-desc">${rapi.I.description}</div>
          <div>
            <span class="rapi-dim-status ${rapi.I.statusClass === 'strong' ? 'rapi-status-strong' : rapi.I.statusClass === 'moderate' ? 'rapi-status-moderate' : 'rapi-status-limited'}">
              ${rapi.I.status}
            </span>
          </div>
          <div class="rapi-dim-basis">
            <strong>Basis Bukti Transaksi:</strong><br>${rapi.I.basis}
          </div>
        </div>
      </div>

      <!-- Evidence Layer Audit Architecture -->
      <div class="evidence-card">
        <div class="evidence-title">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
          Arsitektur & Keterverifikasian Evidence Layer
        </div>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
          Setiap indikator dalam Profil Kesiapan RAPI didukung oleh rantai bukti digital (evidence trail) yang dapat diaudit langsung ke jejak transaksi asal:
        </p>

        <div class="evidence-items">
          <div class="evidence-item">
            <span style="font-weight:700;color:var(--primary)">1. Jejak Transaksi</span>
            <span>QRIS, Transfer, Tunai, Faktur, Mutasi</span>
          </div>
          <div class="evidence-item">
            <span style="font-weight:700;color:var(--info)">2. Mesin AI</span>
            <span>Rekonsiliasi & Klasifikasi Berbasis Nilai Keyakinan</span>
          </div>
          <div class="evidence-item">
            <span style="font-weight:700;color:var(--success)">3. Catatan Keuangan</span>
            <span>Laba Rugi & Arus Kas Standar SAK EMKM</span>
          </div>
          <div class="evidence-item">
            <span style="font-weight:700;color:var(--warning)">4. Verifikasi Analis</span>
            <span>Human Validation di Pusat Review</span>
          </div>
          <div class="evidence-item">
            <span style="font-weight:700;color:var(--rapi-r)">5. Kesiapan Pembiayaan</span>
            <span>Profil Kesiapan Pembiayaan Objektif</span>
          </div>
        </div>

        <div style="margin-top:20px;padding:16px;background:var(--card);border-radius:var(--radius);border:1px solid var(--border);">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;">Kesimpulan Ringkas Analis (Analyst Takeaway)</div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">
            Subjek UMKM menunjukkan arus pendapatan teratur dengan kontribusi dominan melalui kanal digital (QRIS & Transfer). Catatan rekonsiliasi antar-rekening bersih dari anomali duplikasi. Profil kesiapan ini memberikan bahan baku yang dapat diverifikasi (verifiable evidence) bagi komite pembiayaan perbankan maupun fintech pendana.
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initRAPI() {
  if (!state.demoLoaded || state.transactions.length === 0) return;

  const fin = calculateFinancials(state.transactions);
  const comp = getInformationCompleteness(state.transactions);
  const rapi = generateRAPIProfile(state.transactions, fin, comp);

  createRAPIRadarChart('chart-rapi-radar', rapi);
}
