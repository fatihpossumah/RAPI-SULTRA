/**
 * RAPI-SULTRA Main Application
 * Router, Integrasi State, dan Penanganan Event (Bahasa Indonesia)
 */

import { state, updateState, subscribe, getReviewTransactions, formatCurrency, formatDate } from './state.js';
import { generateDemoTransactions, createTransaction } from './demo-data.js';
import { detectReconciliation, detectDuplicates } from './mock-engine.js';
import {
  showToast,
  openModal,
  closeModal,
  initModalClose,
  openDrawer,
  closeDrawer,
  initDrawerClose,
  showDemoLoadingSequence,
  getAddTransactionModalHTML,
  getAIResultHTML,
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
 * Aksi Pemuatan Data Demo Simulasi
 */
async function handleLoadDemoData() {
  await showDemoLoadingSequence();

  const transactions = generateDemoTransactions();
  const reconPairs = detectReconciliation(transactions);
  const dupPairs = detectDuplicates(transactions);

  updateState({
    transactions,
    reconciliationPairs: reconPairs,
    duplicatePairs: dupPairs,
    demoLoaded: true,
  });

  showToast(`Berhasil memproses ${transactions.length} jejak transaksi simulasi UMKM!`, 'success');
  navigate();
}

/**
 * Aksi Tambah Transaksi Baru
 */
function handleOpenAddTransaction() {
  openModal(getAddTransactionModalHTML());

  const btnProcess = document.getElementById('btn-process-txn');
  const btnCancel = document.getElementById('btn-cancel-txn');

  if (btnCancel) {
    btnCancel.addEventListener('click', closeModal);
  }

  if (btnProcess) {
    btnProcess.addEventListener('click', () => {
      const date = document.getElementById('txn-date').value;
      const channel = document.getElementById('txn-channel').value;
      const direction = document.getElementById('txn-direction').value;
      const amount = parseFloat(document.getElementById('txn-amount').value);
      const description = document.getElementById('txn-description').value.trim();
      const referenceId = document.getElementById('txn-reference').value.trim();

      if (!description) {
        showToast('Mohon masukkan deskripsi transaksi', 'warning');
        return;
      }
      if (!amount || amount <= 0) {
        showToast('Mohon masukkan nominal transaksi yang valid', 'warning');
        return;
      }

      const newTxn = createTransaction({
        date,
        channel,
        direction,
        amount,
        description,
        referenceId,
      });

      // Tampilkan hasil inferensi AI di modal
      const resultContainer = document.getElementById('ai-result-container');
      resultContainer.innerHTML = getAIResultHTML(newTxn);
      resultContainer.classList.remove('hidden');

      // Perbarui state transaksi
      const updatedTxns = [newTxn, ...state.transactions];
      const reconPairs = detectReconciliation(updatedTxns);
      const dupPairs = detectDuplicates(updatedTxns);

      updateState({
        transactions: updatedTxns,
        reconciliationPairs: reconPairs,
        duplicatePairs: dupPairs,
        demoLoaded: true,
      });

      const statusNote = newTxn.review_status === 'AUTO_CLASSIFIED' ? 'Otomatis' : 'Perlu Review Analis';
      showToast(`Transaksi ${newTxn.referenceId} berhasil diproses: ${statusNote}`, 'success');

      // Ubah tombol menjadi tombol selesai
      btnProcess.textContent = 'Selesai & Lihat Dashboard';
      btnProcess.onclick = () => {
        closeModal();
        navigate();
      };
    });
  }
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
      showToast(`Transaksi ${txn.referenceId} berhasil divalidasi sebagai ${chosenCategory.replace(/_/g, ' ')}`, 'success');
      updateState({ transactions: [...state.transactions] });
      navigate();
    }
    return;
  }

  // 7. Pusat Review: Validasi Semua Sekaligus (Batch)
  if (e.target.closest('#btn-batch-validate')) {
    let count = 0;
    state.transactions.forEach(t => {
      if (t.review_status === 'REVIEW_REQUIRED') {
        t.validated_label = t.predicted_label;
        t.review_status = 'VALIDATED';
        count++;
      }
    });
    if (count > 0) {
      showToast(`Berhasil memvalidasi ${count} transaksi sekaligus!`, 'success');
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
    const dup = state.duplicatePairs.find(d => d.id === dupId);
    if (dup) {
      dup.status = action === 'keep' ? 'KEPT_BOTH' : action === 'merge' ? 'MERGED' : 'IGNORED';
      const label = action === 'keep' ? 'Pertahankan Keduanya' : action === 'merge' ? 'Digabungkan' : 'Diabaikan';
      showToast(`Pasangan duplikasi ${dupId}: ${label}`, 'info');
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
if (!state.demoLoaded || state.transactions.length === 0) {
  const transactions = generateDemoTransactions();
  const reconPairs = detectReconciliation(transactions);
  const dupPairs = detectDuplicates(transactions);
  state.transactions = transactions;
  state.reconciliationPairs = reconPairs;
  state.duplicatePairs = dupPairs;
  state.demoLoaded = true;
}

// Panggilan Inisialisasi Pertama
navigate();
