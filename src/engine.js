/**
 * RAPI-SULTRA Local Calculation Engine
 * Replicates backend logic to derive Financial and RAPI profiles locally.
 */

// Helper to determine canonical status and financial category
export function mapAndCanonicalize(transactions) {
  return transactions.map(t => {
    // 1. Determine Financial Category (like financial_mapping.py)
    let fin_cat = 'UNKNOWN';
    let label = t.predicted_label;
    
    // If it's validated, we trust its predicted_label (since we overwrite it in UI)
    if (label === 'Revenue') fin_cat = 'REVENUE';
    else if (label === 'COGS') fin_cat = 'COGS';
    else if (label === 'Operating_Expense') fin_cat = 'OPERATING_EXPENSE';
    else if (label === 'Financing') fin_cat = 'FINANCING';
    else if (label === 'Transfer_Internal') fin_cat = 'INTERNAL_TRANSFER';
    else if (label === 'Other') fin_cat = 'OTHER';

    // We can also overwrite financial_category on the transaction object
    t.financial_category = fin_cat;

    // 2. Determine Processing Status
    let isPending = t.review_status === 'REVIEW_REQUIRED' || t.review_status === 'PENDING_REVIEW' || fin_cat === 'OTHER' || fin_cat === 'UNKNOWN';

    // 3. Determine Canonical Status (like financial_engine.py)
    let canonical_status = 'INCLUDED';
    if (isPending) {
      canonical_status = 'EXCLUDED_PENDING_REVIEW';
    } else if (t.duplicate_status === 'EXACT_DUPLICATE' || t.duplicate_status === 'POSSIBLE_DUPLICATE') {
      canonical_status = 'EXCLUDED_DUPLICATE';
    } else if (t.reconciliation_status === 'RECONCILED') {
      canonical_status = 'CANONICAL_RECONCILED';
    }

    return { ...t, canonical_status };
  });
}

function resolveDuplicatesAndReconciled(mappedTxns) {
  // Fix Exact Duplicates: Keep the first one per group as INCLUDED
  // The frontend doesn't have duplicate_group_id exposed easily inside the transaction object, 
  // but we can trust duplicate_status. Actually, backend assigns EXACT_DUPLICATE and we want to exclude them.
  // We'll follow a simpler path: just exclude exact/possible duplicates unless resolved.
  // For the sake of frontend PoC, we exclude EXCLUDED_DUPLICATE and EXCLUDED_PENDING_REVIEW,
  // and keep INCLUDED and CANONICAL_RECONCILED.
  return mappedTxns;
}

export function calculateFinancialSummary(transactions) {
  let mapped = mapAndCanonicalize(transactions);
  mapped = resolveDuplicatesAndReconciled(mapped);
  
  // Filter only valid transactions for financial calculations
  const validTxns = mapped.filter(t => t.canonical_status === 'INCLUDED' || t.canonical_status === 'CANONICAL_RECONCILED');
  
  const monthlyDataMap = {};

  let total_rev = 0, tot_cogs = 0, tot_opex = 0;
  let tot_fin_in = 0, tot_fin_out = 0;
  let net_cash_movement = 0;

  validTxns.forEach(t => {
    // Parse month (YYYY-MM)
    const d = new Date(t.date);
    const m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    
    if (!monthlyDataMap[m]) {
      monthlyDataMap[m] = {
        month: m,
        revenue: 0, cogs: 0, operating_expense: 0,
        financing_inflow: 0, financing_outflow: 0,
        cash_in: 0, cash_out: 0,
        int_in: 0, int_out: 0,
        count: 0, rev_count: 0, cogs_count: 0, opex_count: 0, fin_count: 0
      };
    }
    
    const amt = t.amount;
    const cat = t.financial_category;
    const dir = t.direction;
    const md = monthlyDataMap[m];

    md.count++;
    if (dir === 'IN') md.cash_in += amt;
    if (dir === 'OUT') md.cash_out += amt;

    if (cat === 'REVENUE') {
      md.revenue += amt; total_rev += amt; md.rev_count++;
    } else if (cat === 'COGS') {
      md.cogs += amt; tot_cogs += amt; md.cogs_count++;
    } else if (cat === 'OPERATING_EXPENSE') {
      md.operating_expense += amt; tot_opex += amt; md.opex_count++;
    } else if (cat === 'FINANCING') {
      md.fin_count++;
      if (dir === 'IN') { md.financing_inflow += amt; tot_fin_in += amt; }
      if (dir === 'OUT') { md.financing_outflow += amt; tot_fin_out += amt; }
    } else if (cat === 'INTERNAL_TRANSFER') {
      if (dir === 'IN') md.int_in += amt;
      if (dir === 'OUT') md.int_out += amt;
    }
  });

  // Calculate profits and cashflow per month
  const months = Object.keys(monthlyDataMap).sort();
  const monthlySummary = [];
  const monthlyTrend = [];

  months.forEach(m => {
    const md = monthlyDataMap[m];
    
    const adj_cash_in = md.cash_in - md.int_in;
    const adj_cash_out = md.cash_out - md.int_out;
    const net_cash = adj_cash_in - adj_cash_out;
    
    const gp = md.revenue - md.cogs;
    const gm = md.revenue > 0 ? (gp / md.revenue * 100) : null;
    const op_res = gp - md.operating_expense;

    monthlySummary.push({
      month: md.month,
      revenue: md.revenue,
      cogs: md.cogs,
      operating_expense: md.operating_expense,
      financing_inflow: md.financing_inflow,
      financing_outflow: md.financing_outflow,
      gross_profit: gp,
      gross_margin: gm,
      operating_result: op_res,
      net_cash_movement: net_cash
    });
    
    net_cash_movement += net_cash;

    // We also need pending review count for trend
    let pending_count = mapped.filter(t => t.canonical_status === 'EXCLUDED_PENDING_REVIEW' && t.date.startsWith(m)).length;

    monthlyTrend.push({
      month: md.month,
      transaction_count: md.count,
      revenue_count: md.rev_count,
      cogs_count: md.cogs_count,
      operating_expense_count: md.opex_count,
      financing_count: md.fin_count,
      review_count: pending_count
    });
  });

  const overallSummary = {
    revenue: total_rev,
    cogs: tot_cogs,
    operating_expense: tot_opex,
    financing_inflow: tot_fin_in,
    financing_outflow: tot_fin_out,
    gross_profit: total_rev - tot_cogs,
    gross_margin: total_rev > 0 ? ((total_rev - tot_cogs) / total_rev * 100) : null,
    operating_result: total_rev - tot_cogs - tot_opex,
    net_cash_movement: net_cash_movement,
    included_transaction_count: validTxns.length,
    pending_review_count: mapped.filter(t => t.canonical_status === 'EXCLUDED_PENDING_REVIEW').length,
    duplicate_excluded_count: mapped.filter(t => t.canonical_status === 'EXCLUDED_DUPLICATE').length,
    reconciled_transaction_count: mapped.filter(t => t.canonical_status === 'CANONICAL_RECONCILED').length
  };

  // Build profile input required for RAPI
  const avg_rev = total_rev / (months.length || 1);
  const min_rev = months.length > 0 ? Math.min(...monthlySummary.map(m => m.revenue)) : 0;
  const max_rev = months.length > 0 ? Math.max(...monthlySummary.map(m => m.revenue)) : 0;
  const avg_cf = net_cash_movement / (months.length || 1);
  
  // Standard Deviation of Revenue
  let std_rev = 0;
  if (months.length > 1) {
    const mean = avg_rev;
    const variance = monthlySummary.reduce((acc, m) => acc + Math.pow(m.revenue - mean, 2), 0) / (months.length - 1);
    std_rev = Math.sqrt(variance);
  }

  const review_rate = mapped.length > 0 ? (overallSummary.pending_review_count / mapped.length * 100) : 0;
  const dup_rate = mapped.length > 0 ? (overallSummary.duplicate_excluded_count / mapped.length * 100) : 0;
  const rec_rate = mapped.length > 0 ? (overallSummary.reconciled_transaction_count / mapped.length * 100) : 0;
  
  // Information completeness proxy
  let completeness = 0;
  if (mapped.length > 0) {
    const reqCols = ['date', 'channel', 'direction', 'description', 'amount'];
    let present = 0;
    mapped.forEach(t => {
      reqCols.forEach(c => {
        if (t[c] !== null && t[c] !== undefined && t[c] !== '') present++;
      });
    });
    completeness = (present / (mapped.length * reqCols.length)) * 100;
  }

  const profileInput = {
    total_revenue: total_rev,
    average_monthly_revenue: avg_rev,
    revenue_std: std_rev,
    revenue_min: min_rev,
    revenue_max: max_rev,
    total_cogs: tot_cogs,
    total_operating_expense: tot_opex,
    average_monthly_cash_flow: avg_cf,
    total_financing_inflow: tot_fin_in,
    total_financing_outflow: tot_fin_out,
    transaction_count: validTxns.length,
    active_months: months.length,
    review_rate,
    duplicate_rate: dup_rate,
    reconciled_rate: rec_rate,
    information_completeness_input: completeness
  };

  return {
    monthlySummary,
    monthlyTrend,
    overallSummary,
    profileInput
  };
}

export function calculateRapiProfile(monthlySummary, profileInput, overallSummary) {
  // Revenue Stability (R)
  let r_status, r_exp;
  const avg_rev = profileInput.average_monthly_revenue;
  const cv = avg_rev > 0 ? (profileInput.revenue_std / avg_rev) : 0;

  if (avg_rev === 0) {
    r_status = "INSUFFICIENT_DATA"; r_exp = "Tidak ada rata-rata pendapatan bulanan.";
  } else if (cv < 0.25) {
    r_status = "STABLE"; r_exp = `Variabilitas pendapatan rendah (CV = ${cv.toFixed(2)}).`;
  } else if (cv <= 0.50) {
    r_status = "MODERATE_VARIABILITY"; r_exp = `Variabilitas pendapatan sedang (CV = ${cv.toFixed(2)}).`;
  } else {
    r_status = "HIGH_VARIABILITY"; r_exp = `Variabilitas pendapatan tinggi (CV = ${cv.toFixed(2)}).`;
  }
  
  const revenue_stability = {
    evidence: {
      active_months: profileInput.active_months,
      average_monthly_revenue: profileInput.average_monthly_revenue,
      minimum_monthly_revenue: profileInput.revenue_min,
      maximum_monthly_revenue: profileInput.revenue_max,
      coefficient_of_variation: cv
    },
    status: r_status,
    explanation: r_exp
  };

  // Cash Flow Consistency (A)
  let a_status, a_exp;
  const pos_months = monthlySummary.filter(m => m.net_cash_movement > 0).length || 0;
  const neg_months = monthlySummary.filter(m => m.net_cash_movement <= 0).length || 0;
  const observed = monthlySummary.length;
  
  if (observed === 0) {
    a_status = "INSUFFICIENT_DATA"; a_exp = "Tidak ada data bulanan.";
  } else {
    const pos_ratio = pos_months / observed;
    if (pos_ratio >= 0.8) a_status = "CONSISTENTLY_POSITIVE";
    else if (pos_ratio >= 0.5) a_status = "MODERATELY_POSITIVE";
    else a_status = "VULNERABLE";
    
    a_exp = `${(pos_ratio*100).toFixed(0)}% dari bulan observasi memiliki arus kas positif.`;
  }
  const cash_flow_consistency = {
    evidence: {
      average_monthly_net_cash_movement: profileInput.average_monthly_cash_flow || 0,
      positive_months: pos_months,
      negative_months: neg_months,
      observed_months: observed
    },
    status: a_status,
    explanation: a_exp
  };

  // Payment Behaviour (P)
  let p_status, p_exp;
  const tot_fin_out = profileInput.total_financing_outflow;
  const months_with_payment = monthlySummary.filter(m => m.financing_outflow > 0).length;

  if (tot_fin_out === 0 || monthlySummary.length === 0) {
    p_status = "INSUFFICIENT_DATA";
    p_exp = "Tidak ada aktivitas pembayaran pinjaman/pembiayaan yang terdeteksi.";
  } else {
    p_status = "OBSERVED_PAYMENTS";
    p_exp = `Teramati pembayaran keluar pada ${months_with_payment} dari ${monthlySummary.length} bulan aktif.`;
  }
  const payment_behaviour = {
    status: p_status,
    evidence: {
      months_with_payment: months_with_payment,
      total_financing_outflow_observed: tot_fin_out
    },
    explanation: p_exp
  };

  // Information Completeness (I)
  let i_status, i_exp;
  const comp_rate = profileInput.information_completeness_input;
  if (comp_rate >= 90) i_status = "HIGHLY_COMPLETE";
  else if (comp_rate >= 70) i_status = "MODERATELY_COMPLETE";
  else i_status = "INCOMPLETE";
  i_exp = `Tingkat kelengkapan informasi adalah ${comp_rate.toFixed(1)}%.`;

  const information_completeness = {
    evidence: {
      overall_completeness_rate: comp_rate,
      transaction_count: profileInput.transaction_count,
      complete_transaction_count: overallSummary.included_transaction_count,
      review_required_count: overallSummary.pending_review_count,
      reconciled_count: overallSummary.reconciled_transaction_count,
      duplicate_candidate_count: overallSummary.duplicate_excluded_count
    },
    status: i_status,
    explanation: i_exp
  };

  // Derived values for the charts
  const getValue = (status, type) => {
    if (status === "INSUFFICIENT_DATA") return 25;
    if (type === 'R') {
      if (status === 'STABLE') return 95;
      if (status === 'MODERATE_VARIABILITY') return 70;
      return 45;
    }
    if (type === 'A') {
      if (status === 'CONSISTENTLY_POSITIVE') return 95;
      if (status === 'MODERATELY_POSITIVE') return 70;
      return 45;
    }
    if (type === 'P') {
      if (status === 'OBSERVED_PAYMENTS') return 85;
      return 25;
    }
    if (type === 'I') {
      if (status === 'HIGHLY_COMPLETE') return 95;
      if (status === 'MODERATELY_COMPLETE') return 70;
      return 45;
    }
    return 50;
  };

  return {
    profile_metadata: {
      period_start: monthlySummary.length ? monthlySummary[0].month : "",
      period_end: monthlySummary.length ? monthlySummary[monthlySummary.length-1].month : "",
      source: "RAPI-SULTRA Local Frontend Engine"
    },
    revenue_stability,
    cash_flow_consistency,
    payment_behaviour,
    information_completeness,
    
    // Extracted flat values for charting (mimics backend representation)
    R: { value: getValue(r_status, 'R'), status: r_status, evidence: r_exp },
    A: { value: getValue(a_status, 'A'), status: a_status, evidence: a_exp },
    P: { value: getValue(p_status, 'P'), status: p_status, evidence: p_exp },
    I: { value: getValue(i_status, 'I'), status: i_status, evidence: i_exp }
  };
}
