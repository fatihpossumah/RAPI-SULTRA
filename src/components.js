/**
 * RAPI-SULTRA Reusable UI Components
 * Modal, Drawer, Toast, Loading Progress (Bahasa Indonesia)
 */

// ==================== TOAST ====================

let toastId = 0;

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const id = `toast-${++toastId}`;

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.id = id;
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==================== MODAL ====================

export function openModal(content) {
  const modalContent = document.getElementById('modal-content');
  const modal = document.getElementById('modal');
  const overlay = document.getElementById('modal-overlay');
  if (modalContent) modalContent.innerHTML = content;
  if (modal) modal.classList.remove('hidden');
  if (overlay) overlay.classList.remove('hidden');
}

export function closeModal() {
  const modal = document.getElementById('modal');
  const overlay = document.getElementById('modal-overlay');
  if (modal) modal.classList.add('hidden');
  if (overlay) overlay.classList.add('hidden');
}

export function initModalClose() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.addEventListener('click', closeModal);
}

// ==================== DRAWER ====================

export function openDrawer(content) {
  const drawerContent = document.getElementById('drawer-content');
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawer-overlay');
  if (drawerContent) drawerContent.innerHTML = content;
  if (drawer) drawer.classList.remove('hidden');
  if (overlay) overlay.classList.remove('hidden');
}

export function closeDrawer() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawer-overlay');
  if (drawer) drawer.classList.add('hidden');
  if (overlay) overlay.classList.add('hidden');
}

export function initDrawerClose() {
  const overlay = document.getElementById('drawer-overlay');
  if (overlay) overlay.addEventListener('click', closeDrawer);
}

// ==================== LOADING PROGRESS ====================

export function showLoading(content) {
  const loadingContent = document.getElementById('loading-content');
  const overlay = document.getElementById('loading-overlay');
  if (loadingContent) loadingContent.innerHTML = content;
  if (overlay) overlay.classList.remove('hidden');
}

export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

/**
 * Animated loading sequence for demo data
 */
export async function showDemoLoadingSequence() {
  const phases = [
    {
      title: 'Memuat jejak transaksi multi-kanal...',
      steps: [
        { label: 'Transaksi QRIS merchant', delay: 350 },
        { label: 'Transaksi Transfer masuk & keluar', delay: 300 },
        { label: 'Pencatatan Transaksi Tunai', delay: 250 },
        { label: 'Faktur & Nota Tagihan (Invoice)', delay: 300 },
        { label: 'Catatan Mutasi Rekening Bank', delay: 350 },
      ],
    },
    {
      title: 'Memproses kecerdasan AI Transaction Engine...',
      steps: [
        { label: 'Klasifikasi pos akuntansi transaksi', delay: 450 },
        { label: 'Deteksi kasus perlu review analis (<70%)', delay: 300 },
        { label: 'Rekonsiliasi transaksi lintas kanal', delay: 350 },
        { label: 'Identifikasi potensi data duplikasi', delay: 250 },
      ],
    },
    {
      title: 'Menyusun profil dan evidence layer...',
      steps: [
        { label: 'Automated Financial Record (SAK EMKM)', delay: 350 },
        { label: 'Analisis konsistensi arus kas operasional', delay: 300 },
        { label: 'RAPI Financing Readiness Profile siap', delay: 400 },
      ],
    },
  ];

  let html = '<div class="loading-title">Memuat Data Simulasi UMKM</div>';

  phases.forEach((phase, pi) => {
    html += `<div class="loading-phase" id="phase-${pi}">${phase.title}</div>`;
    phase.steps.forEach((step, si) => {
      html += `
        <div class="loading-step" id="step-${pi}-${si}">
          <div class="step-icon"><div class="dot-pending" style="width:6px;height:6px;border-radius:50%;background:var(--border)"></div></div>
          <span>${step.label}</span>
        </div>`;
    });
  });

  showLoading(html);

  // Animate each step
  for (let pi = 0; pi < phases.length; pi++) {
    for (let si = 0; si < phases[pi].steps.length; si++) {
      const stepEl = document.getElementById(`step-${pi}-${si}`);
      if (stepEl) {
        stepEl.classList.add('active');
        stepEl.querySelector('.step-icon').innerHTML = '<div class="spinner"></div>';
      }

      await sleep(phases[pi].steps[si].delay);

      if (stepEl) {
        stepEl.classList.remove('active');
        stepEl.classList.add('done');
        stepEl.querySelector('.step-icon').innerHTML = '<span class="check">✓</span>';
      }
    }
  }

  await sleep(300);
  hideLoading();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== UPLOAD CSV MODAL ====================

export function getAddTransactionModalHTML() {
  return `
    <div class="modal-header">
      <h3 class="modal-title">Upload CSV Transaksi</h3>
      <button class="modal-close" id="btn-close-modal">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div id="upload-csv-area" style="border: 2px dashed var(--border); border-radius: var(--radius-lg); padding: 40px; text-align: center; cursor: pointer; transition: var(--transition); background: var(--bg);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="color: var(--primary); margin-bottom: 16px;">
          <path d="M12 4v12M12 4l-4 4M12 4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Pilih atau Tarik File CSV</div>
        <div style="font-size: 13px; color: var(--text-secondary);">Kolom wajib: date, channel, direction, description, amount, reference_id</div>
      </div>
      <input type="file" id="csv-file-input" accept=".csv" class="hidden" />
      <div id="upload-status" class="hidden mt-16 text-center"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="btn-cancel-txn">Batal</button>
      <button class="btn btn-primary" id="btn-process-txn" disabled>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Upload & Proses AI
      </button>
    </div>
  `;
}

export function getAIResultHTML(prediction) {
  const statusLabel = prediction.review_status === 'AUTO_CLASSIFIED' ? 'Terklasifikasi Otomatis' : 'Perlu Review';
  const statusClass = prediction.review_status === 'AUTO_CLASSIFIED' ? 'badge-auto' : 'badge-review';

  return `
    <div class="ai-result">
      <div class="ai-result-title">Hasil Klasifikasi AI Transaction Engine</div>
      <div class="ai-result-grid">
        <div class="ai-result-item">
          <div class="ai-result-label">Kategori Prediksi</div>
          <div class="ai-result-value">${prediction.predicted_label.replace(/_/g, ' ')}</div>
        </div>
        <div class="ai-result-item">
          <div class="ai-result-label">Skor Keyakinan (Confidence)</div>
          <div class="ai-result-value" style="color: ${prediction.confidence >= 0.70 ? 'var(--success)' : 'var(--warning)'}">
            ${(prediction.confidence * 100).toFixed(1)}%
          </div>
        </div>
        <div class="ai-result-item">
          <div class="ai-result-label">Status Verifikasi</div>
          <div class="ai-result-value">
            <span class="badge ${statusClass}">
              <span class="badge-dot"></span>
              ${statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==================== TRANSACTION DRAWER ====================

export function getTransactionDrawerHTML(txn, formatCurrency, formatDate) {
  const label = txn.validated_label || txn.predicted_label;
  const statusClass = txn.review_status === 'AUTO_CLASSIFIED' ? 'badge-auto' :
    txn.review_status === 'VALIDATED' ? 'badge-validated' : 'badge-review';
  const statusText = txn.review_status === 'AUTO_CLASSIFIED' ? 'Terklasifikasi Otomatis' :
    txn.review_status === 'VALIDATED' ? 'Tervalidasi Analis' : 'Perlu Review';
  const confClass = txn.confidence >= 0.80 ? 'high' : txn.confidence >= 0.70 ? 'medium' : 'low';

  return `
    <div class="drawer-header">
      <h3 class="drawer-title">Rincian Transaksi</h3>
      <button class="drawer-close" id="btn-close-drawer">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="drawer-body">
      <div class="detail-list">
        <div class="detail-item">
          <span class="detail-label">ID Transaksi</span>
          <span class="detail-value">${txn.id}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tanggal</span>
          <span class="detail-value">${formatDate(txn.date)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Kanal Pembayaran</span>
          <span class="detail-value"><span class="badge badge-channel">${txn.channel}</span></span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Arah Dana</span>
          <span class="detail-value"><span class="badge ${txn.direction === 'IN' ? 'badge-in' : 'badge-out'}">${txn.direction === 'IN' ? 'Pemasukan (IN)' : 'Pengeluaran (OUT)'}</span></span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Deskripsi</span>
          <span class="detail-value" style="max-width:240px;text-align:right">${txn.description}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Nominal</span>
          <span class="detail-value ${txn.direction === 'IN' ? 'amount-in' : 'amount-out'}">
            ${txn.direction === 'IN' ? '+' : '-'}${formatCurrency(txn.amount)}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Nomor Referensi</span>
          <span class="detail-value"><code>${txn.referenceId}</code></span>
        </div>
      </div>

      <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)">
        <div class="card-title" style="margin-bottom:16px">Audit AI Prediction Engine</div>
        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">Kategori Prediksi AI</span>
            <span class="detail-value">${txn.predicted_label.replace(/_/g, ' ')}</span>
          </div>
          ${txn.validated_label ? `
          <div class="detail-item">
            <span class="detail-label">Kategori Tervalidasi</span>
            <span class="detail-value" style="color:var(--info)">${txn.validated_label.replace(/_/g, ' ')}</span>
          </div>
          ` : ''}
          <div class="detail-item">
            <span class="detail-label">Skor Keyakinan (Confidence)</span>
            <span class="detail-value">
              <div class="confidence-bar">
                <div class="confidence-track"><div class="confidence-fill ${confClass}" style="width:${txn.confidence * 100}%"></div></div>
                <span class="confidence-value">${(txn.confidence * 100).toFixed(1)}%</span>
              </div>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status Verifikasi</span>
            <span class="detail-value">
              <span class="badge ${statusClass}">
                <span class="badge-dot"></span>
                ${statusText}
              </span>
            </span>
          </div>
        </div>
      </div>

      ${txn.review_status === 'REVIEW_REQUIRED' ? `
      <div style="margin-top:20px;padding:14px;background:var(--warning-bg);border-radius:var(--radius);border:1px solid rgba(245,158,11,0.2)">
        <div style="font-size:12px;font-weight:600;color:#B45309;margin-bottom:4px">⚠ Memerlukan Review Analis</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">
          Skor keyakinan model di bawah ambang batas 0.70. Buka halaman Pusat Review untuk menetapkan kategori akuntansi yang tepat.
        </div>
      </div>
      ` : ''}
    </div>
  `;
}
