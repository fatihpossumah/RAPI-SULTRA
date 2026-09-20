/**
 * RAPI-SULTRA Chart Configurations
 * Chart.js wrapper for professional financial charts (Bahasa Indonesia)
 */

import Chart from 'chart.js/auto';

// Global Chart.js defaults
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = '#64748B';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.elements.line.tension = 0.35;
Chart.defaults.elements.point.radius = 3;
Chart.defaults.elements.point.hoverRadius = 5;
Chart.defaults.scale.grid = { color: '#F1F5F9', drawBorder: false };

const INDO_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Track chart instances for cleanup
const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

/**
 * Revenue Trend Line Chart
 */
export function createRevenueTrendChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Pendapatan Usaha',
        data: data.data,
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22, 163, 74, 0.08)',
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: '#16A34A',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0B1F3A',
          titleFont: { weight: '600' },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => 'Pendapatan: Rp' + ctx.parsed.y.toLocaleString('id-ID'),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => v >= 1000000 ? (v / 1000000).toFixed(1) + ' jt' : v >= 1000 ? (v / 1000) + ' rb' : v,
          },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}



/**
 * Expense Breakdown Doughnut
 */
export function createExpenseBreakdownChart(canvasId, cogs, opex) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['HPP (Bahan Baku / COGS)', 'Beban Operasional (OPEX)'],
      datasets: [{
        data: [cogs, opex],
        backgroundColor: ['#DC2626', '#F59E0B'],
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          backgroundColor: '#0B1F3A',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ctx.label + ': Rp' + ctx.parsed.toLocaleString('id-ID'),
          },
        },
      },
    },
  });
}

/**
 * Transaction Sources Bar Chart
 */
export function createSourcesChart(canvasId, sources) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(sources),
      datasets: [{
        label: 'Transaksi',
        data: Object.values(sources),
        backgroundColor: [
          'rgba(11, 31, 58, 0.8)',
          'rgba(22, 58, 99, 0.8)',
          'rgba(30, 77, 123, 0.7)',
          'rgba(37, 99, 235, 0.7)',
          'rgba(71, 85, 105, 0.7)',
        ],
        borderRadius: 6,
        barPercentage: 0.6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0B1F3A',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.parsed.x} transaksi`,
          },
        },
      },
      scales: {
        x: { beginAtZero: true, grid: { display: false } },
        y: { grid: { display: false } },
      },
    },
  });
}

/**
 * RAPI Radar Chart
 */
export function createRAPIRadarChart(canvasId, profile) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: [
        'R — Kestabilan Pendapatan',
        'A — Konsistensi Arus Kas',
        'P — Perilaku Pembayaran',
        'I — Kelengkapan Informasi',
      ],
      datasets: [{
        label: 'Profil RAPI',
        data: [profile.R.value, profile.A.value, profile.P.value, profile.I.value],
        backgroundColor: 'rgba(11, 31, 58, 0.1)',
        borderColor: '#0B1F3A',
        borderWidth: 2,
        pointBackgroundColor: ['#1D4ED8', '#2563EB', '#0F766E', '#475569'],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0B1F3A',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.label} (Level Indikatif)`,
          },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 25,
            backdropColor: 'transparent',
            font: { size: 10 },
          },
          grid: { color: '#E2E8F0' },
          angleLines: { color: '#E2E8F0' },
          pointLabels: {
            font: { size: 11, weight: '600' },
            color: '#111827',
          },
        },
      },
    },
  });
}

/**
 * Transaction volume bar chart by month
 */
export function createVolumeChart(canvasId, transactions) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const monthly = {};
  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + 1;
  });

  const sorted = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
  const labels = sorted.map(([k]) => {
    const [y, m] = k.split('-');
    return `${INDO_MONTHS[parseInt(m) - 1]} ${y}`;
  });

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Transaksi',
        data: sorted.map(([, v]) => v),
        backgroundColor: 'rgba(11, 31, 58, 0.7)',
        borderRadius: 6,
        barPercentage: 0.5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0B1F3A',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} transaksi`,
          },
        },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 5 } },
        x: { grid: { display: false } },
      },
    },
  });
}

/**
 * Cleanup all charts
 */
export function destroyAllCharts() {
  Object.keys(chartInstances).forEach(destroyChart);
}
