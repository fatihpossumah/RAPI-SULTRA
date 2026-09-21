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
Chart.defaults.scale.grid = { color: '#E2E8F0', drawBorder: false };

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
          backgroundColor: '#FFFFFF',
          titleColor: '#0F172A',
          bodyColor: '#475569',
          borderColor: '#E2E8F0',
          borderWidth: 1,
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
      labels: ['Biaya Barang dan Bahan', 'Biaya Operasional'],
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
        legend: { position: 'bottom', labels: { padding: 20 } },
        tooltip: {
          backgroundColor: '#FFFFFF',
          titleColor: '#0F172A',
          bodyColor: '#475569',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (tooltipItems) => {
              return tooltipItems[0].label;
            },
            label: (ctx) => {
              const value = ctx.parsed;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((value / total) * 100).toFixed(1).replace('.', ',') + '%' : '0%';
              return [`Rp${value.toLocaleString('id-ID')}`, pct];
            }
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
          '#2563EB',
          '#3B82F6',
          '#60A5FA',
          '#93C5FD',
          '#BFDBFE',
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
          backgroundColor: '#FFFFFF',
          titleColor: '#0F172A',
          bodyColor: '#475569',
          borderColor: '#E2E8F0',
          borderWidth: 1,
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
        ['R', 'Revenue Stability'],
        ['A', 'Account / Cash-flow Consistency'],
        ['P', 'Payment Behaviour'],
        ['I', 'Information Completeness']
      ],
      datasets: [{
        label: 'Profil RAPI',
        data: [profile.R.value, profile.A.value, profile.P.value, profile.I.value],
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderColor: '#2563EB',
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
          backgroundColor: '#FFFFFF',
          titleColor: '#0F172A',
          bodyColor: '#475569',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (ctx) => {
              const labelArr = ctx[0].label;
              return Array.isArray(labelArr) ? labelArr.join(' — ') : labelArr;
            },
            label: (ctx) => {
              const dimIndex = ctx.dataIndex;
              const dimKeys = ['R', 'A', 'P', 'I'];
              const dimData = profile[dimKeys[dimIndex]];
              
              return [
                `Status: ${dimData.status}`,
                '',
                `Evidence:`,
                ...dimData.evidence.match(/.{1,45}(\s|$)/g).map(s => s.trim()) // simple word wrap for tooltip
              ];
            },
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
            display: false // hide the numbers entirely to avoid credit score impression
          },
          grid: { color: '#E2E8F0' },
          angleLines: { color: '#E2E8F0' },
          pointLabels: {
            font: { size: 11, weight: '600' },
            color: '#0F172A',
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
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
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
          backgroundColor: '#FFFFFF',
          titleColor: '#0F172A',
          bodyColor: '#475569',
          borderColor: '#E2E8F0',
          borderWidth: 1,
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
