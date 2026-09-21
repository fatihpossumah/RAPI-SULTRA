/**
 * RAPI-SULTRA Main Application
 * Router, Integrasi State, dan Penanganan Event (Bahasa Indonesia)
 */

import { state, updateState, subscribe, getReviewTransactions, formatCurrency, formatDate } from './state.js';
import { fetchSummary, fetchTransactions, fetchDuplicates, fetchReconciliation, uploadCSV } from './api.js';
import {
  showToast,
  openModal,
  closeModal,
  initModalClose,
  openDrawer,
  closeDrawer,
  initDrawerClose,
  showDemoLoadingSequence,
  getTransactionDrawerHTML
} from './components.js';
import { destroyAllCharts } from './charts.js';

import { renderOverview, initOverview } from './pages/overview.js';
import { renderTransactions, initTransactions } from './pages/transactions.js';
import { renderReview, initReview } from './pages/review.js';
import { renderFinancial, initFinancial } from './pages/financial.js';
import { renderRAPI, initRAPI } from './pages/rapi.js';

// Registrasi Halaman
const pages = {
  overview: { render: renderOverview, init: initOverview },
  transactions: { render: renderTransactions, init: initTransactions },
  review: { render: renderReview, init: initReview },
  financial: { render: renderFinancial, init: initFinancial },
  rapi: { render: renderRAPI, init: initRAPI },
};

/**
 * Pengendali Navigasi Router
 */
function navigate() {
  const hash = window.location.hash.replace('#', '') || 'overview';
  const pageKey = pages[hash] ? hash : 'overview';
  state.currentPage = pageKey;

  // Perbarui status aktif menu sidebar
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
    if (el.getAttribute('data-page') === pageKey) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Bersihkan instance Chart.js sebelum merender view baru
  destroyAllCharts();

  // Render halaman utama
  const mainEl = document.getElementById('main-content');
  const page = pages[pageKey];
  mainEl.innerHTML = page.render();

  // Inisialisasi komponen interaktif (grafik Chart.js)
  if (page.init) {
    page.init();
  }

  // Perbarui indikator badge
  updateReviewBadge();

  // Pasang event listener dinamis
  attachPageEventListeners();
}

/**
 * Perbarui Counter Badge Pusat Review di Sidebar
 */
function updateReviewBadge() {
  const badgeEl = document.getElementById('review-badge');
  if (!badgeEl) return;
  const reviewCount = getReviewTransactions().length;
  if (reviewCount > 0) {
    badgeEl.textContent = reviewCount;
    badgeEl.classList.remove('hidden');
  } else {
    badgeEl.classList.add('hidden');
  }
}

/**
 * Aksi Pemuatan Data Demo Simulasi dari Backend API
 */
async function handleLoadDemoData() {
  showToast('Mengambil data dari backend...', 'info');

  try {
    const summaryData = await fetchSummary();
    const txnsData = await fetchTransactions();
    const dupData = await fetchDuplicates();
    const reconData = await fetchReconciliation();

    // Helper to group flat rows into { transactionA, transactionB } pairs
    const formatPairs = (flatList, groupKey) => {
      const groups = {};
      (flatList || []).forEach(item => {
        const gid = item[groupKey];
        if (!groups[gid]) groups[gid] = [];
        groups[gid].push(item);
      });
      
      const formatted = [];
      for (const gid in groups) {
        const group = groups[gid];
        if (group.length >= 2) {
          formatted.push({
            id: gid,
            status: group[0].duplicate_status || 'PENDING',
            similarity: group[0].duplicate_confidence === 'HIGH' ? '98' : '85',
            transactionA: group[0],
            transactionB: group[1]
          });
        }
      }
      return formatted;
    };

    updateState({
      transactions: txnsData.transactions,
      reconciliationPairs: formatPairs(reconData.reconciliation_matches, 'reconciliation_group_id'),
      duplicatePairs: formatPairs(dupData.duplicate_candidates, 'duplicate_group_id'),
      financialSummary: summaryData.financial_summary,
      rapiProfile: summaryData.rapi_profile,
      validation: summaryData.validation,
      monthlySummary: summaryData.monthly_summary,
      demoLoaded: true,
    });

    showToast(`Berhasil memuat ${txnsData.transactions.length} transaksi dari backend RAPI-SULTRA!`, 'success');
    navigate();
  } catch (error) {
    console.error(error);
    showToast('Gagal memuat data dari backend. Pastikan server API Python berjalan.', 'error');
  }
}

/**
 * Aksi Tambah Transaksi Baru (Upload CSV)
 */
function handleOpenAddTransaction() {
  import('./components.js').then(({ getAddTransactionModalHTML, openModal }) => {
    openModal(getAddTransactionModalHTML());
    
    // Bind modal events
    const closeBtn = document.getElementById('btn-close-modal');
    const cancelBtn = document.getElementById('btn-cancel-txn');
    const processBtn = document.getElementById('btn-process-txn');
    const uploadArea = document.getElementById('upload-csv-area');
    const fileInput = document.getElementById('csv-file-input');
    const statusArea = document.getElementById('upload-status');
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', () => fileInput.click());
      
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          uploadArea.innerHTML = `
            <div style="font-size: 16px; font-weight: 600; color: var(--primary); margin-bottom: 8px;">File Terpilih</div>
            <div style="font-size: 13px; color: var(--text-secondary);">${file.name} (${(file.size / 1024).toFixed(1)} KB)</div>
          `;
          processBtn.disabled = false;
        }
      });
    }
    
    if (processBtn) {
      processBtn.addEventListener('click', () => {
        if (statusArea) {
          statusArea.innerHTML = '<span class="text-info">Memproses CSV melalui backend...</span>';
          statusArea.classList.remove('hidden');
        }
        processBtn.disabled = true;
        
        uploadCSV().then(res => {
           showToast(res.message, 'success');
           closeModal();
           handleLoadDemoData();
        }).catch(e => {
           if (statusArea) {
             statusArea.innerHTML = `<span class="text-danger">${e.message}</span>`;
           }
           showToast(e.message, 'error');
           processBtn.disabled = false;
        });
      });
    }
  });
}

/**
 * Ikat event input dinamis pada tabel & filter
 */
function attachPageEventListeners() {
  // Input pencarian transaksi
  const searchInput = document.getElementById('txn-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      navigate();
      const newInput = document.getElementById('txn-search');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
    });
  }

  // Dropdown filter transaksi
  ['filter-channel', 'filter-category', 'filter-status', 'filter-direction'].forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.addEventListener('change', (e) => {
        const filterKey = id.replace('filter-', '');
        state.filters[filterKey] = e.target.value;
        navigate();
      });
    }
  });

  // Tab transaksi
  document.querySelectorAll('.tabs .tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const targetTab = tabBtn.getAttribute('data-tab');
      state.transactionTab = targetTab;
      navigate();
    });
  });
}

/**
 * Delegasi Event Klik Global
 */
document.addEventListener('click', (e) => {
  // 1. Tombol Buka/Tutup Sidebar
  if (e.target.closest('#sidebar-toggle')) {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    state.sidebarCollapsed = sidebar.classList.contains('collapsed');
    return;
  }

  // 2. Tombol Muat Data Demo
  if (e.target.closest('#btn-load-demo-overview') || e.target.closest('#btn-load-demo-empty')) {
    handleLoadDemoData();
    return;
  }

  // 3. Tombol Tambah Transaksi
  if (e.target.closest('#btn-add-txn-overview') || e.target.closest('#btn-add-txn-page')) {
    handleOpenAddTransaction();
    return;
  }

  // 4. Klik Baris Transaksi (Drawer Rincian)
  const txnRow = e.target.closest('tr[data-txn-id]') || e.target.closest('.btn-inspect-txn');
  if (txnRow && !e.target.closest('.btn-validate-txn') && !e.target.closest('select')) {
    const txnId = txnRow.getAttribute('data-txn-id') || txnRow.getAttribute('data-id');
    const txn = state.transactions.find(t => t.id === txnId);
    if (txn) {
      openDrawer(getTransactionDrawerHTML(txn, formatCurrency, formatDate));
      const btnClose = document.getElementById('btn-close-drawer');
      if (btnClose) btnClose.addEventListener('click', closeDrawer);
    }
    return;
  }

  // 5. Tombol Tutup Drawer
  if (e.target.closest('#btn-close-drawer')) {
    closeDrawer();
    return;
  }

  // 6. Pusat Review: Validasi Transaksi Tunggal
  const validateBtn = e.target.closest('.btn-validate-txn');
  if (validateBtn) {
    const txnId = validateBtn.getAttribute('data-id');
    const select = document.getElementById(`select-category-${txnId}`);
    const chosenCategory = select ? select.value : 'Revenue';

    const txn = state.transactions.find(t => t.id === txnId);
    if (txn) {
      txn.validated_label = chosenCategory;
      txn.review_status = 'VALIDATED';
      showToast(`Tersimpan lokal: Transaksi divalidasi sebagai ${chosenCategory.replace(/_/g, ' ')} (Sistem simpan backend belum terhubung)`, 'success');
      updateState({ transactions: [...state.transactions] });
      navigate();
    }
    return;
  }

  // 7. Pusat Review: Validasi Semua Sekaligus (Batch)
  if (e.target.closest('#btn-batch-validate')) {
    let count = 0;
    state.transactions.forEach(t => {
      if (t.review_status === 'REVIEW_REQUIRED' || t.review_status === 'PENDING_REVIEW') {
        t.validated_label = t.predicted_label;
        t.review_status = 'VALIDATED';
        count++;
      }
    });
    if (count > 0) {
      showToast(`Tersimpan lokal: Berhasil memvalidasi ${count} transaksi sekaligus! (Backend belum terhubung)`, 'success');
      updateState({ transactions: [...state.transactions] });
      navigate();
    }
    return;
  }

  // 8. Aksi Potensi Duplikasi (Keep Both, Merge, Ignore)
  const dupActionBtn = e.target.closest('.dup-action');
  if (dupActionBtn) {
    const dupId = dupActionBtn.getAttribute('data-dup-id');
    const action = dupActionBtn.getAttribute('data-action');
    const dup = state.duplicatePairs.find(d => d.id === dupId || d.duplicate_group_id === dupId);
    if (dup) {
      dup.status = action === 'keep' ? 'KEPT_BOTH' : action === 'merge' ? 'MERGED' : 'IGNORED';
      const label = action === 'keep' ? 'Pertahankan Keduanya' : action === 'merge' ? 'Digabungkan' : 'Diabaikan';
      showToast(`Tersimpan lokal: Keputusan "${label}" disimpan. (Sistem simpan backend belum terhubung)`, 'info');
      navigate();
    }
    return;
  }

  // 9. Tombol Cetak / Ekspor
  if (e.target.closest('#btn-print-evidence') || e.target.closest('#btn-export-financial')) {
    window.print();
    return;
  }
});

// Inisialisasi Penutup Modal & Drawer
initModalClose();
initDrawerClose();

// Berlangganan Reaktif Perubahan State
subscribe(() => {
  updateReviewBadge();
});

// Event Listener Navigasi Hash
window.addEventListener('hashchange', navigate);
window.addEventListener('load', navigate);

// Auto-load data demo simulasi saat aplikasi dibuka pertama kali agar seluruh grafik dan metrik langsung tampil
if (!state.demoLoaded) {
  handleLoadDemoData();
}

// Panggilan Inisialisasi Pertama
navigate();
