export const dashboardJs = `let temperatureChart;
let humidityChart;
let refreshTimer;

const statusEl = document.getElementById("status");
const rangeEl = document.getElementById("range");
const dayEl = document.getElementById("day");
const refreshEl = document.getElementById("refresh");
const readingsBodyEl = document.getElementById("readings-body");

const latestTempEl = document.getElementById("latest-temp");
const tempMetaEl = document.getElementById("temp-meta");
const latestHumidityEl = document.getElementById("latest-humidity");
const humidityMetaEl = document.getElementById("humidity-meta");
const avgTempEl = document.getElementById("avg-temp");
const avgHumidityEl = document.getElementById("avg-humidity");
const lastUpdateEl = document.getElementById("last-update");
const deviceNameEl = document.getElementById("device-name");
const tempRangeEl = document.getElementById("temp-range");
const humidityRangeEl = document.getElementById("humidity-range");

function formatNumber(value, suffix) {
  return Number.isFinite(value) ? value.toFixed(2) + suffix : "--";
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(date);
}

function formatDayLabel(value) {
  if (!value) return "All available days";
  const date = new Date(value + "T00:00:00Z");
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        weekday: "short",
      }).format(date);
}

function minutesAgo(value) {
  const diffMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diffMs)) return "--";
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  return minutes + " minutes ago";
}

function computeAverage(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeMinMax(values) {
  if (!values.length) return null;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function destroyCharts() {
  if (temperatureChart) {
    temperatureChart.destroy();
    temperatureChart = undefined;
  }
  if (humidityChart) {
    humidityChart.destroy();
    humidityChart = undefined;
  }
}

function resetSummary() {
  latestTempEl.textContent = "--";
  latestHumidityEl.textContent = "--";
  avgTempEl.textContent = "--";
  avgHumidityEl.textContent = "Average humidity: --";
  lastUpdateEl.textContent = "--";
  deviceNameEl.textContent = "Device: --";
  tempMetaEl.textContent = "Waiting for data";
  humidityMetaEl.textContent = "Waiting for data";
  tempRangeEl.textContent = "--";
  humidityRangeEl.textContent = "--";
}

function createChart(canvasId, label, color, values, labels, suffix) {
  const canvas = document.getElementById(canvasId);
  const context = canvas.getContext("2d");

  return new Chart(context, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          borderColor: color,
          backgroundColor: color + "22",
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 10,
          fill: true,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label(context) {
              return context.parsed.y.toFixed(2) + suffix;
            },
          },
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
      scales: {
        x: {
          ticks: {
            color: "#96a3a8",
            maxTicksLimit: 8,
          },
          grid: {
            color: "rgba(255,255,255,0.05)",
          },
        },
        y: {
          ticks: {
            color: "#96a3a8",
            callback(value) {
              return Number(value).toFixed(0) + suffix;
            },
          },
          grid: {
            color: "rgba(255,255,255,0.05)",
          },
        },
      },
    },
  });
}

function updateCharts(readings) {
  const chronological = [...readings].reverse();
  const labels = chronological.map((reading) =>
    new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(reading.created_at))
  );
  const temperatures = chronological.map((reading) => Number(reading.temperature));
  const humidities = chronological.map((reading) => Number(reading.humidity));

  destroyCharts();

  temperatureChart = createChart(
    "temperature-chart",
    "Temperature",
    "#38b6a4",
    temperatures,
    labels,
    "°C"
  );

  humidityChart = createChart(
    "humidity-chart",
    "Humidity",
    "#e08b49",
    humidities,
    labels,
    "%"
  );

  const tempRange = computeMinMax(temperatures);
  const humidityRange = computeMinMax(humidities);
  tempRangeEl.textContent = tempRange
    ? "Min " + tempRange.min.toFixed(2) + "°C  Max " + tempRange.max.toFixed(2) + "°C"
    : "--";
  humidityRangeEl.textContent = humidityRange
    ? "Min " + humidityRange.min.toFixed(2) + "%  Max " + humidityRange.max.toFixed(2) + "%"
    : "--";
}

function updateSummary(readings) {
  const latest = readings[0];
  const temperatures = readings.map((reading) => Number(reading.temperature));
  const humidities = readings.map((reading) => Number(reading.humidity));

  latestTempEl.textContent = formatNumber(Number(latest.temperature), "°C");
  latestHumidityEl.textContent = formatNumber(Number(latest.humidity), "%");
  tempMetaEl.textContent = "Recorded " + minutesAgo(latest.created_at);
  humidityMetaEl.textContent = "Recorded " + minutesAgo(latest.created_at);
  avgTempEl.textContent = formatNumber(computeAverage(temperatures), "°C");
  avgHumidityEl.textContent = "Average humidity: " + formatNumber(computeAverage(humidities), "%");
  lastUpdateEl.textContent = formatDate(latest.created_at);
  deviceNameEl.textContent = "Device: " + (latest.device || "--");
}

function updateTable(readings) {
  if (!readings.length) {
    readingsBodyEl.innerHTML = '<tr><td class="empty" colspan="4">No readings stored for this selection.</td></tr>';
    return;
  }

  const rows = readings.slice(0, 20).map((reading) => {
    return '<tr>' +
      '<td>' + formatDate(reading.created_at) + '</td>' +
      '<td>' + (reading.device || "--") + '</td>' +
      '<td>' + Number(reading.temperature).toFixed(2) + '°C</td>' +
      '<td>' + Number(reading.humidity).toFixed(2) + '%</td>' +
      '</tr>';
  });

  readingsBodyEl.innerHTML = rows.join("");
}

function buildReadingsUrl() {
  const params = new URLSearchParams({
    limit: rangeEl.value,
  });

  if (dayEl.value) {
    params.set("day", dayEl.value);
  }

  return "/readings?" + params.toString();
}

function buildStatusText(count) {
  const selectedDay = dayEl.value;
  const scope = selectedDay ? " for " + formatDayLabel(selectedDay) : "";
  return "Showing " + count + " readings" + scope + ". Auto-refresh every 60 seconds.";
}

async function loadAvailableDays() {
  const response = await fetch("/reading-days", {
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  const payload = await response.json();
  const days = Array.isArray(payload.days) ? payload.days : [];
  const previousValue = dayEl.value;

  dayEl.innerHTML = '<option value="">All available days</option>';

  for (const day of days) {
    if (typeof day !== "string" || day.length !== 10) {
      continue;
    }

    const option = document.createElement("option");
    option.value = day;
    option.textContent = formatDayLabel(day);
    dayEl.appendChild(option);
  }

  if (previousValue && days.includes(previousValue)) {
    dayEl.value = previousValue;
  }
}

async function loadReadings() {
  statusEl.textContent = "Refreshing data...";

  try {
    const response = await fetch(buildReadingsUrl(), {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const payload = await response.json();
    const readings = Array.isArray(payload.results) ? payload.results : [];

    if (!readings.length) {
      statusEl.textContent = "No readings stored for this selection.";
      resetSummary();
      destroyCharts();
      updateTable([]);
      return;
    }

    statusEl.textContent = buildStatusText(readings.length);
    updateSummary(readings);
    updateCharts(readings);
    updateTable(readings);
  } catch (error) {
    statusEl.textContent = "Could not load readings: " + error.message;
    resetSummary();
    destroyCharts();
    updateTable([]);
  }
}

async function refreshDashboard() {
  await loadAvailableDays();
  await loadReadings();
}

function startAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(refreshDashboard, 60000);
}

dayEl.addEventListener("change", loadReadings);
rangeEl.addEventListener("change", loadReadings);
refreshEl.addEventListener("click", refreshDashboard);

refreshDashboard();
startAutoRefresh();
`;
