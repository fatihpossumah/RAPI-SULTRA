/**
 * RAPI-SULTRA Mock Prediction Engine
 * Simulates TF-IDF + Logistic Regression model inference
 * Will be replaced with real PredictionEngine when model is ready
 */

const CATEGORIES = ['Revenue', 'COGS', 'Operating_Expense', 'Financing', 'Transfer_Internal', 'Other'];

const KEYWORD_RULES = [
  {
    label: 'Revenue',
    keywords: ['penjualan', 'pembayaran qris', 'pembayaran dari', 'pendapatan', 'order', 'pelanggan',
      'pemasukan', 'penerimaan', 'invoice dibayar', 'tagihan dibayar', 'sales', 'revenue',
      'jual', 'customer', 'bayar masuk', 'terima pembayaran', 'setoran penjualan'],
    direction: 'IN',
    baseConfidence: 0.82,
  },
  {
    label: 'COGS',
    keywords: ['bahan baku', 'material', 'supplier', 'pembelian bahan', 'stok', 'inventory',
      'raw material', 'purchase', 'barang dagangan', 'pasokan', 'kulakan', 'belanja bahan',
      'beli bahan', 'order bahan', 'pembelian barang'],
    direction: 'OUT',
    baseConfidence: 0.79,
  },
  {
    label: 'Operating_Expense',
    keywords: ['listrik', 'sewa', 'gaji', 'transport', 'internet', 'telepon', 'atk', 'air pdam',
      'maintenance', 'perbaikan', 'kebersihan', 'operasional', 'biaya admin', 'parkir',
      'bensin', 'pulsa', 'iuran', 'pajak', 'asuransi', 'peralatan'],
    direction: 'OUT',
    baseConfidence: 0.80,
  },
  {
    label: 'Financing',
    keywords: ['angsuran', 'cicilan', 'kredit', 'pinjaman', 'kur', 'bunga', 'pencairan',
      'pelunasan', 'hutang', 'piutang', 'modal', 'investasi', 'loan', 'financing',
      'dana pinjaman'],
    direction: null,
    baseConfidence: 0.76,
  },
  {
    label: 'Transfer_Internal',
    keywords: ['transfer antar', 'pindah buku', 'internal', 'setor tunai', 'tarik tunai',
      'transfer sendiri', 'rekening sendiri', 'top up', 'isi saldo'],
    direction: null,
    baseConfidence: 0.74,
  },
];

/**
 * Simulate model prediction for a single transaction
 */
export function mockPredict(description, amount, channel, direction) {
  const desc = description.toLowerCase();

  // Try keyword matching (simulates TF-IDF feature importance)
  for (const rule of KEYWORD_RULES) {
    const matchCount = rule.keywords.filter(kw => desc.includes(kw)).length;
    if (matchCount > 0) {
      // Direction match boosts confidence
      const directionBoost = (rule.direction === null || rule.direction === direction) ? 0.05 : -0.08;

      // Multiple keyword matches boost confidence
      const keywordBoost = Math.min(matchCount * 0.03, 0.10);

      // Simulate model noise
      const noise = (Math.random() - 0.5) * 0.08;

      let confidence = rule.baseConfidence + directionBoost + keywordBoost + noise;
      confidence = Math.min(Math.max(confidence, 0.35), 0.98);

      return {
        predicted_label: rule.label,
        confidence: Math.round(confidence * 100) / 100,
        review_status: confidence >= 0.70 ? 'AUTO_CLASSIFIED' : 'REVIEW_REQUIRED',
      };
    }
  }

  // Fallback: direction-based heuristic
  if (direction === 'IN') {
    const conf = 0.55 + Math.random() * 0.20;
    return {
      predicted_label: 'Revenue',
      confidence: Math.round(conf * 100) / 100,
      review_status: conf >= 0.70 ? 'AUTO_CLASSIFIED' : 'REVIEW_REQUIRED',
    };
  }

  // Default: low confidence → REVIEW_REQUIRED
  const conf = 0.45 + Math.random() * 0.18;
  return {
    predicted_label: 'Other',
    confidence: Math.round(conf * 100) / 100,
    review_status: 'REVIEW_REQUIRED',
  };
}

/**
 * Detect reconciliation pairs (same amount, different channel, close date)
 */
export function detectReconciliation(transactions) {
  const pairs = [];
  const used = new Set();

  for (let i = 0; i < transactions.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < transactions.length; j++) {
      if (used.has(j)) continue;
      const a = transactions[i];
      const b = transactions[j];

      if (a.channel === b.channel) continue;
      if (a.amount !== b.amount) continue;
      if (a.direction !== b.direction) continue;

      const dayDiff = Math.abs(new Date(a.date) - new Date(b.date)) / (1000 * 60 * 60 * 24);
      if (dayDiff > 2) continue;

      pairs.push({
        id: `REC-${pairs.length + 1}`,
        transactionA: a,
        transactionB: b,
        status: 'RECONCILED',
      });
      used.add(i);
      used.add(j);
      break;
    }
  }
  return pairs;
}

/**
 * Detect potential duplicate transactions
 */
export function detectDuplicates(transactions) {
  const dupes = [];
  const used = new Set();

  for (let i = 0; i < transactions.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < transactions.length; j++) {
      if (used.has(j)) continue;
      const a = transactions[i];
      const b = transactions[j];

      if (a.amount !== b.amount) continue;
      if (a.direction !== b.direction) continue;

      const dayDiff = Math.abs(new Date(a.date) - new Date(b.date)) / (1000 * 60 * 60 * 24);
      if (dayDiff > 1) continue;

      // Same channel + same amount + close date → potential duplicate
      if (a.channel !== b.channel) continue;

      // Simple description similarity
      const wordsA = new Set(a.description.toLowerCase().split(/\s+/));
      const wordsB = new Set(b.description.toLowerCase().split(/\s+/));
      const intersection = [...wordsA].filter(w => wordsB.has(w));
      const similarity = intersection.length / Math.max(wordsA.size, wordsB.size);

      if (similarity < 0.4) continue;

      dupes.push({
        id: `DUP-${dupes.length + 1}`,
        transactionA: a,
        transactionB: b,
        similarity: Math.round(similarity * 100),
        status: 'PENDING',
      });
      used.add(j);
      break;
    }
  }
  return dupes;
}

/**
 * Calculate financial profile from valid transactions
 */
export function calculateFinancials(transactions) {
  // Only use AUTO_CLASSIFIED or VALIDATED transactions
  const valid = transactions.filter(t =>
    t.review_status === 'AUTO_CLASSIFIED' || t.review_status === 'VALIDATED'
  );

  const getLabel = t => t.validated_label || t.predicted_label;

  const revenue = valid.filter(t => getLabel(t) === 'Revenue' && t.direction === 'IN')
    .reduce((s, t) => s + t.amount, 0);
  const cogs = valid.filter(t => getLabel(t) === 'COGS' && t.direction === 'OUT')
    .reduce((s, t) => s + t.amount, 0);
  const opex = valid.filter(t => getLabel(t) === 'Operating_Expense' && t.direction === 'OUT')
    .reduce((s, t) => s + t.amount, 0);
  const financingIn = valid.filter(t => getLabel(t) === 'Financing' && t.direction === 'IN')
    .reduce((s, t) => s + t.amount, 0);
  const financingOut = valid.filter(t => getLabel(t) === 'Financing' && t.direction === 'OUT')
    .reduce((s, t) => s + t.amount, 0);

  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const operatingResult = revenue - cogs - opex;
  const netFinancing = financingIn - financingOut;

  return {
    revenue,
    cogs,
    opex,
    grossProfit,
    grossMargin: Math.round(grossMargin * 10) / 10,
    operatingResult,
    financingIn,
    financingOut,
    netFinancing,
    totalTransactions: valid.length,
  };
}

/**
 * Calculate revenue trend by month
 */
export function getRevenueTrend(transactions) {
  const valid = transactions.filter(t =>
    (t.review_status === 'AUTO_CLASSIFIED' || t.review_status === 'VALIDATED') &&
    (t.validated_label || t.predicted_label) === 'Revenue' && t.direction === 'IN'
  );

  const monthly = {};
  valid.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + t.amount;
  });

  const INDO_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const sorted = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
  return {
    labels: sorted.map(([k]) => {
      const [y, m] = k.split('-');
      return `${INDO_MONTHS[parseInt(m) - 1]} ${y}`;
    }),
    data: sorted.map(([, v]) => v),
  };
}

/**
 * Calculate cash flow trend by month
 */
export function getCashFlowTrend(transactions) {
  const valid = transactions.filter(t =>
    t.review_status === 'AUTO_CLASSIFIED' || t.review_status === 'VALIDATED'
  );

  const monthly = {};
  valid.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) monthly[key] = { inflow: 0, outflow: 0 };
    if (t.direction === 'IN') monthly[key].inflow += t.amount;
    else monthly[key].outflow += t.amount;
  });

  const INDO_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const sorted = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
  return {
    labels: sorted.map(([k]) => {
      const [y, m] = k.split('-');
      return `${INDO_MONTHS[parseInt(m) - 1]} ${y}`;
    }),
    inflow: sorted.map(([, v]) => v.inflow),
    outflow: sorted.map(([, v]) => v.outflow),
    net: sorted.map(([, v]) => v.inflow - v.outflow),
  };
}

/**
 * Calculate information completeness
 */
export function getInformationCompleteness(transactions) {
  if (transactions.length === 0) return { description: 0, reference: 0, channel: 0, amount: 0, date: 0 };

  const total = transactions.length;
  const desc = transactions.filter(t => t.description && t.description.trim().length > 3).length;
  const ref = transactions.filter(t => t.referenceId && t.referenceId.trim().length > 0).length;
  const chan = transactions.filter(t => t.channel && t.channel.trim().length > 0).length;
  const amt = transactions.filter(t => t.amount > 0).length;
  const dt = transactions.filter(t => t.date && !isNaN(new Date(t.date))).length;

  return {
    description: Math.round((desc / total) * 100),
    reference: Math.round((ref / total) * 100),
    channel: Math.round((chan / total) * 100),
    amount: Math.round((amt / total) * 100),
    date: Math.round((dt / total) * 100),
  };
}

/**
 * Generate RAPI Profile dimensions
 */
export function generateRAPIProfile(transactions, financials, completeness) {
  const valid = transactions.filter(t =>
    t.review_status === 'AUTO_CLASSIFIED' || t.review_status === 'VALIDATED'
  );

  // R — Revenue Stability: based on revenue across months
  const revenueTrend = getRevenueTrend(transactions);
  let rStatus = 'Data Terbatas';
  let rValue = 30;
  if (revenueTrend.data.length >= 3) {
    const avg = revenueTrend.data.reduce((a, b) => a + b, 0) / revenueTrend.data.length;
    const variance = revenueTrend.data.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / revenueTrend.data.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;
    if (cv < 0.2) { rStatus = 'Stabil'; rValue = 85; }
    else if (cv < 0.4) { rStatus = 'Moderat'; rValue = 65; }
    else { rStatus = 'Variatif'; rValue = 45; }
  } else if (revenueTrend.data.length > 0) {
    rStatus = 'Berkembang'; rValue = 50;
  }

  // A — Cash-flow Consistency
  const cashFlow = getCashFlowTrend(transactions);
  let aStatus = 'Data Terbatas';
  let aValue = 30;
  if (cashFlow.net.length >= 2) {
    const positiveMonths = cashFlow.net.filter(n => n > 0).length;
    const ratio = positiveMonths / cashFlow.net.length;
    if (ratio >= 0.8) { aStatus = 'Positif Kuat'; aValue = 82; }
    else if (ratio >= 0.5) { aStatus = 'Cukup Sehat'; aValue = 60; }
    else { aStatus = 'Perlu Perhatian'; aValue = 40; }
  }

  // P — Payment Behaviour
  let pStatus = 'Data Terbatas';
  let pValue = 30;
  if (valid.length >= 10) {
    const channels = new Set(valid.map(t => t.channel));
    const hasDigital = ['QRIS', 'Transfer', 'Bank Mutation'].some(c => channels.has(c));
    if (hasDigital && channels.size >= 3) { pStatus = 'Sangat Aktif'; pValue = 78; }
    else if (channels.size >= 2) { pStatus = 'Reguler'; pValue = 62; }
    else { pStatus = 'Dasar'; pValue = 45; }
  }

  // I — Information Completeness
  const avgComp = (completeness.description + completeness.reference + completeness.channel +
    completeness.amount + completeness.date) / 5;
  let iStatus = 'Rendah';
  let iValue = avgComp;
  if (avgComp >= 85) iStatus = 'Tinggi (Lengkap)';
  else if (avgComp >= 65) iStatus = 'Sedang';

  return {
    R: {
      letter: 'R',
      name: 'Revenue Stability (Kestabilan Pendapatan)',
      description: 'Konsistensi dan stabilitas pendapatan usaha pada periode transaksi yang diobservasi.',
      status: rStatus,
      statusClass: rValue >= 70 ? 'strong' : rValue >= 50 ? 'moderate' : 'limited',
      value: rValue,
      basis: 'Pola pendapatan bulanan dari jejak transaksi terklasifikasi',
    },
    A: {
      letter: 'A',
      name: 'Account / Cash-flow Consistency (Konsistensi Arus Kas)',
      description: 'Kesehatan dan kesinambungan arus kas operasional (inflow vs outflow).',
      status: aStatus,
      statusClass: aValue >= 70 ? 'strong' : aValue >= 50 ? 'moderate' : 'limited',
      value: aValue,
      basis: 'Pola arus kas masuk dan keluar dari mutasi dan transaksi operasional',
    },
    P: {
      letter: 'P',
      name: 'Payment Behaviour (Perilaku Pembayaran)',
      description: 'Pola kebiasaan pembayaran berbasis pemanfaatan kanal transaksi digital.',
      status: pStatus,
      statusClass: pValue >= 70 ? 'strong' : pValue >= 50 ? 'moderate' : 'limited',
      value: pValue,
      basis: 'Diversifikasi kanal pembayaran (QRIS, Transfer, Mutasi) & frekuensi transaksi',
    },
    I: {
      letter: 'I',
      name: 'Information Completeness (Kelengkapan Informasi)',
      description: 'Kelengkapan dan mutu data jejak transaksi UMKM untuk keperluan audit pembiayaan.',
      status: iStatus,
      statusClass: iValue >= 70 ? 'strong' : iValue >= 50 ? 'moderate' : 'limited',
      value: Math.round(iValue),
      basis: 'Tingkat kelengkapan field catatan (deskripsi, nomor referensi, kanal, nominal, tanggal)',
    },
  };
}
