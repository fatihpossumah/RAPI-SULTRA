/**
 * RAPI-SULTRA Demo Data Generator
 * Generates realistic synthetic UMKM transaction dataset
 * NOTE: This is synthetic/simulation data — not real UMKM transactions
 */

import { mockPredict } from './mock-engine.js';

let txnCounter = 0;

function generateId() {
  txnCounter++;
  return `TXN-${String(txnCounter).padStart(4, '0')}`;
}

function randomDate(start, end) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const d = new Date(s + Math.random() * (e - s));
  return d.toISOString().slice(0, 10);
}

function generateRefId(channel, idx) {
  const prefixes = {
    'QRIS': 'QRIS',
    'Transfer': 'TRF',
    'Cash': 'CSH',
    'Invoice': 'INV',
    'Bank Mutation': 'BM',
  };
  return `${prefixes[channel] || 'REF'}-2026-${String(idx).padStart(4, '0')}`;
}

const DEMO_TRANSACTIONS = [
  // === QRIS Transactions (Revenue dominant) ===
  { desc: 'Pembayaran QRIS - Pelanggan warung makan', channel: 'QRIS', dir: 'IN', amount: 85000 },
  { desc: 'Pembayaran QRIS - Order nasi campur', channel: 'QRIS', dir: 'IN', amount: 150000 },
  { desc: 'Pembayaran QRIS - Pelanggan #1247', channel: 'QRIS', dir: 'IN', amount: 45000 },
  { desc: 'Pembayaran QRIS - Catering pesanan', channel: 'QRIS', dir: 'IN', amount: 350000 },
  { desc: 'Pembayaran QRIS - Makan siang pelanggan', channel: 'QRIS', dir: 'IN', amount: 65000 },
  { desc: 'Pembayaran QRIS - Pesanan toko online', channel: 'QRIS', dir: 'IN', amount: 125000 },
  { desc: 'QRIS pembayaran makanan', channel: 'QRIS', dir: 'IN', amount: 92000 },
  { desc: 'Pembayaran QRIS - Pelanggan tetap', channel: 'QRIS', dir: 'IN', amount: 175000 },
  { desc: 'Pembayaran QRIS - Order delivery', channel: 'QRIS', dir: 'IN', amount: 210000 },

  // === Transfer Transactions ===
  { desc: 'Transfer masuk - PT Maju Sejahtera pembayaran catering', channel: 'Transfer', dir: 'IN', amount: 2500000 },
  { desc: 'Transfer masuk - Pembayaran invoice catering kantor', channel: 'Transfer', dir: 'IN', amount: 4200000 },
  { desc: 'Transfer ke supplier - CV Sumber Bahan', channel: 'Transfer', dir: 'OUT', amount: 1800000 },
  { desc: 'Pembayaran bahan baku - Transfer ke pasar', channel: 'Transfer', dir: 'OUT', amount: 950000 },
  { desc: 'Transfer masuk - Pesanan katering acara', channel: 'Transfer', dir: 'IN', amount: 3500000 },
  { desc: 'Transfer pembayaran sewa tempat usaha', channel: 'Transfer', dir: 'OUT', amount: 2000000 },
  { desc: 'Transfer gaji karyawan bulan ini', channel: 'Transfer', dir: 'OUT', amount: 1500000 },
  { desc: 'Transfer masuk - Pendapatan jual beli online', channel: 'Transfer', dir: 'IN', amount: 780000 },

  // === Cash Transactions ===
  { desc: 'Penjualan tunai - Toko harian', channel: 'Cash', dir: 'IN', amount: 450000 },
  { desc: 'Penjualan tunai - Warung hari Sabtu', channel: 'Cash', dir: 'IN', amount: 620000 },
  { desc: 'Pembelian bahan baku pasar pagi', channel: 'Cash', dir: 'OUT', amount: 380000 },
  { desc: 'Pembelian bahan baku sayur dan bumbu', channel: 'Cash', dir: 'OUT', amount: 275000 },
  { desc: 'Biaya transportasi antar bahan', channel: 'Cash', dir: 'OUT', amount: 50000 },
  { desc: 'Biaya listrik bulan Agustus', channel: 'Cash', dir: 'OUT', amount: 420000 },
  { desc: 'Penjualan tunai - Pelanggan langsung', channel: 'Cash', dir: 'IN', amount: 195000 },
  { desc: 'Pembelian peralatan dapur', channel: 'Cash', dir: 'OUT', amount: 350000 },
  { desc: 'Penjualan tunai - Catering kecil', channel: 'Cash', dir: 'IN', amount: 550000 },

  // === Invoice Transactions ===
  { desc: 'Pembayaran Invoice INV-2026-089 - PT Abadi Makmur', channel: 'Invoice', dir: 'IN', amount: 4200000 },
  { desc: 'Pembayaran Invoice INV-2026-092 - CV Jaya Sentosa', channel: 'Invoice', dir: 'IN', amount: 3100000 },
  { desc: 'Pembayaran invoice supplier bahan PO-2026-034', channel: 'Invoice', dir: 'OUT', amount: 2200000 },
  { desc: 'Invoice tagihan air PDAM', channel: 'Invoice', dir: 'OUT', amount: 185000 },
  { desc: 'Pembayaran Invoice INV-2026-095 - Pesanan rutin', channel: 'Invoice', dir: 'IN', amount: 1750000 },

  // === Bank Mutation ===
  { desc: 'Credit - Setoran tunai harian', channel: 'Bank Mutation', dir: 'IN', amount: 450000 },
  { desc: 'Debit - Angsuran KUR BRI bulan September', channel: 'Bank Mutation', dir: 'OUT', amount: 850000 },
  { desc: 'Credit - Transfer masuk dari pelanggan', channel: 'Bank Mutation', dir: 'IN', amount: 2500000 },
  { desc: 'Debit - Biaya administrasi bank', channel: 'Bank Mutation', dir: 'OUT', amount: 15000 },
  { desc: 'Credit - Pencairan dana pinjaman KUR', channel: 'Bank Mutation', dir: 'IN', amount: 5000000 },
  { desc: 'Debit - Pembayaran internet dan telepon', channel: 'Bank Mutation', dir: 'OUT', amount: 350000 },
  { desc: 'Credit - Setoran penjualan tunai', channel: 'Bank Mutation', dir: 'IN', amount: 620000 },
  { desc: 'Debit - Transfer antar rekening sendiri', channel: 'Bank Mutation', dir: 'OUT', amount: 1000000 },

  // === Ambiguous transactions (for REVIEW_REQUIRED) ===
  { desc: 'Transaksi tidak teridentifikasi', channel: 'Bank Mutation', dir: 'OUT', amount: 250000 },
  { desc: 'Pembayaran lain-lain', channel: 'Cash', dir: 'OUT', amount: 150000 },
  { desc: 'Dana masuk pihak ketiga', channel: 'Transfer', dir: 'IN', amount: 1200000 },
  { desc: 'Penarikan dana', channel: 'Bank Mutation', dir: 'OUT', amount: 500000 },

  // === Reconciliation pairs (same amount, diff channel, same date) ===
  // These will have dates set to match
  { desc: 'Pembayaran QRIS - Pelanggan corporate lunch', channel: 'QRIS', dir: 'IN', amount: 750000, _reconPair: 'A' },
  { desc: 'Credit - Setoran QRIS merchant', channel: 'Bank Mutation', dir: 'IN', amount: 750000, _reconPair: 'A' },

  { desc: 'Transfer masuk - Pembayaran project katering', channel: 'Transfer', dir: 'IN', amount: 5500000, _reconPair: 'B' },
  { desc: 'Credit - Transfer masuk rekening BRI', channel: 'Bank Mutation', dir: 'IN', amount: 5500000, _reconPair: 'B' },

  // === Duplicate candidates (same channel, amount, close date) ===
  { desc: 'Penjualan tunai - Toko hari Senin', channel: 'Cash', dir: 'IN', amount: 320000, _dupPair: 'X' },
  { desc: 'Penjualan tunai - Toko hari Senin sore', channel: 'Cash', dir: 'IN', amount: 320000, _dupPair: 'X' },
];

export function generateDemoTransactions() {
  txnCounter = 0;
  const transactions = [];

  const reconDates = {};
  const dupDates = {};

  DEMO_TRANSACTIONS.forEach((template, idx) => {
    let date;

    // Reconciliation pairs get same date
    if (template._reconPair) {
      if (!reconDates[template._reconPair]) {
        reconDates[template._reconPair] = randomDate('2026-07-01', '2026-09-15');
      }
      date = reconDates[template._reconPair];
    }
    // Duplicate pairs get same date
    else if (template._dupPair) {
      if (!dupDates[template._dupPair]) {
        dupDates[template._dupPair] = randomDate('2026-08-01', '2026-09-10');
      }
      date = dupDates[template._dupPair];
    }
    else {
      date = randomDate('2026-06-01', '2026-09-18');
    }

    const prediction = mockPredict(template.desc, template.amount, template.channel, template.dir);

    transactions.push({
      id: generateId(),
      date,
      description: template.desc,
      channel: template.channel,
      direction: template.dir,
      amount: template.amount,
      referenceId: generateRefId(template.channel, idx + 1),
      predicted_label: prediction.predicted_label,
      confidence: prediction.confidence,
      review_status: prediction.review_status,
      validated_label: null,
    });
  });

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return transactions;
}

/**
 * Create a single transaction from user input
 */
export function createTransaction(data) {
  txnCounter++;
  const prediction = mockPredict(data.description, data.amount, data.channel, data.direction);

  return {
    id: generateId(),
    date: data.date,
    description: data.description,
    channel: data.channel,
    direction: data.direction,
    amount: parseFloat(data.amount),
    referenceId: data.referenceId || generateRefId(data.channel, txnCounter),
    predicted_label: prediction.predicted_label,
    confidence: prediction.confidence,
    review_status: prediction.review_status,
    validated_label: null,
  };
}
