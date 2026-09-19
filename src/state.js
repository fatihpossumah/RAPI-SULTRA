/**
 * RAPI-SULTRA State Management
 * Centralized reactive state for the dashboard
 */

const listeners = [];

export const state = {
  transactions: [],
  currentPage: 'overview',
  demoLoaded: false,
  selectedTransaction: null,
  drawerOpen: false,
  modalOpen: false,
  sidebarCollapsed: false,
  transactionTab: 'all',
  reconciliationPairs: [],
  duplicatePairs: [],
  filters: {
    search: '',
    channel: 'all',
    category: 'all',
    status: 'all',
    direction: 'all',
  },
};

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function notify() {
  listeners.forEach(fn => fn(state));
}

export function updateState(updates) {
  Object.assign(state, updates);
  notify();
}

// --- Computed helpers ---

export function getFilteredTransactions() {
  let txns = [...state.transactions];
  const f = state.filters;

  if (f.search) {
    const q = f.search.toLowerCase();
    txns = txns.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.referenceId.toLowerCase().includes(q) ||
      t.channel.toLowerCase().includes(q)
    );
  }
  if (f.channel !== 'all') txns = txns.filter(t => t.channel === f.channel);
  if (f.category !== 'all') txns = txns.filter(t => (t.validated_label || t.predicted_label) === f.category);
  if (f.status !== 'all') txns = txns.filter(t => t.review_status === f.status);
  if (f.direction !== 'all') txns = txns.filter(t => t.direction === f.direction);

  return txns;
}

export function getReviewTransactions() {
  return state.transactions.filter(t => t.review_status === 'REVIEW_REQUIRED');
}

export function getValidTransactions() {
  return state.transactions.filter(t =>
    t.review_status === 'AUTO_CLASSIFIED' || t.review_status === 'VALIDATED'
  );
}

export function formatCurrency(amount) {
  return 'Rp' + Math.abs(amount).toLocaleString('id-ID');
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
