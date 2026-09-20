/**
 * RAPI-SULTRA API Client
 * Berkomunikasi dengan backend Python (Source of Truth)
 */

const API_BASE = 'http://localhost:8000/api';

export async function fetchSummary() {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error('Gagal memuat ringkasan dashboard dari backend.');
    return res.json();
}

export async function fetchTransactions() {
    const res = await fetch(`${API_BASE}/dashboard/transactions`);
    if (!res.ok) throw new Error('Gagal memuat data transaksi dari backend.');
    return res.json();
}

export async function fetchDuplicates() {
    const res = await fetch(`${API_BASE}/dashboard/duplicates`);
    if (!res.ok) return { duplicate_candidates: [] };
    return res.json();
}

export async function fetchReconciliation() {
    const res = await fetch(`${API_BASE}/dashboard/reconciliation`);
    if (!res.ok) return { reconciliation_matches: [] };
    return res.json();
}

export async function uploadCSV() {
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST' });
    if (!res.ok) throw new Error('Gagal memproses file CSV.');
    return res.json();
}
