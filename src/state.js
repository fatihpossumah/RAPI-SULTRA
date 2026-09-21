/**
 * RAPI-SULTRA State Management
 * Centralized reactive state for the dashboard
 */

import { calculateFinancialSummary, calculateRapiProfile } from './engine.js';

const listeners = [];

export const state = {
  transactions: [],
  financialSummary: null,
  rapiProfile: null,
  validation: null,
  monthlySummary: null,
  monthlyTrend: null,
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
    startDate: '',
    endDate: '',
  },
  pagination: {
    pageSize: 10,
    currentPage: 1
  },
  reviewPagination: {
    pageSize: 10,
    currentPage: 1
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

export function recalculateAll() {
  if (!state.transactions || state.transactions.length === 0) return;
  
  const engineResult = calculateFinancialSummary(state.transactions);
  state.financialSummary = engineResult.overallSummary;
  state.monthlySummary = engineResult.monthlySummary;
  state.monthlyTrend = engineResult.monthlyTrend;
  
  const rapiResult = calculateRapiProfile(engineResult.monthlySummary, engineResult.profileInput, engineResult.overallSummary);
  state.rapiProfile = rapiResult;
}

export function validateTransaction(id, validatedLabel) {
  const txn = state.transactions.find(t => String(t.id) === String(id));
  if (txn) {
    txn.review_status = 'VALIDATED';
    txn.predicted_label = validatedLabel;
    
    recalculateAll();
    persistState();
    notify();
  }
}

export function persistState() {
  try {
    const stateToSave = {
      transactions: state.transactions,
      duplicatePairs: state.duplicatePairs,
      reconciliationPairs: state.reconciliationPairs
    };
    localStorage.setItem('rapi_dashboard_state', JSON.stringify(stateToSave));
  } catch (e) {
    console.error('Failed to persist state', e);
  }
}

export function restoreState() {
  try {
    const saved = localStorage.getItem('rapi_dashboard_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.transactions = parsed.transactions || [];
      state.duplicatePairs = parsed.duplicatePairs || [];
      state.reconciliationPairs = parsed.reconciliationPairs || [];
      
      recalculateAll();
      state.demoLoaded = true;
      return true;
    }
  } catch (e) {
    console.error('Failed to restore state', e);
  }
  return false;
}

export function clearPersistedState() {
  localStorage.removeItem('rapi_dashboard_state');
}

// --- Computed helpers ---

export function getFilteredTransactions() {
  let txns = [...state.transactions];
  const f = state.filters;

  if (f.search) {
    const q = f.search.toLowerCase();
    txns = txns.filter(t =>
      t.description.toLowerCase().includes(q) ||
      (t.referenceId && t.referenceId.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q)) ||
      t.channel.toLowerCase().includes(q)
    );
  }

  // Validasi filter tanggal
  let validStartDate = f.startDate;
  let validEndDate = f.endDate;
  if (f.startDate && f.endDate && new Date(f.startDate) > new Date(f.endDate)) {
    validStartDate = '';
    validEndDate = '';
  }

  if (validStartDate) {
    const start = new Date(validStartDate);
    start.setHours(0, 0, 0, 0);
    txns = txns.filter(t => {
      const d = new Date(t.date);
      d.setHours(0, 0, 0, 0);
      return d >= start;
    });
  }

  if (validEndDate) {
    const end = new Date(validEndDate);
    end.setHours(23, 59, 59, 999);
    txns = txns.filter(t => {
      const d = new Date(t.date);
      d.setHours(0, 0, 0, 0);
      return d <= end;
    });
  }

  if (f.channel !== 'all') txns = txns.filter(t => t.channel === f.channel);
  if (f.category !== 'all') txns = txns.filter(t => (t.validated_label || t.predicted_label) === f.category);
  if (f.status !== 'all') txns = txns.filter(t => t.review_status === f.status);
  if (f.direction !== 'all') txns = txns.filter(t => t.direction === f.direction);

  txns.sort((a, b) => new Date(b.date) - new Date(a.date));

  return txns;
}

export function getReviewTransactions() {
  return state.transactions.filter(t => {
    if (t.reconciliation_status === 'RECONCILED') return false;
    if (t.duplicate_status === 'EXACT_DUPLICATE' || t.duplicate_status === 'POSSIBLE_DUPLICATE') return false;
    // Engine classifies Other and Unknown as pending review too, so we match engine logic
    const isPending = t.review_status === 'REVIEW_REQUIRED' || t.review_status === 'PENDING_REVIEW' || t.predicted_label === 'Other' || t.predicted_label === 'Unknown';
    return isPending;
  });
}

export function getValidTransactions() {
  return state.transactions.filter(t =>
    t.review_status === 'AUTO_CLASSIFIED' || t.review_status === 'VALIDATED' || t.review_status === 'READY'
  );
}

export function formatCurrency(amount) {
  return 'Rp' + Math.abs(amount).toLocaleString('id-ID');
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
