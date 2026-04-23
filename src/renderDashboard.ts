export function renderDashboardHtml() {
	return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pico Climate Dashboard</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #101416;
        --panel: #171d20;
        --panel-alt: #20282c;
        --text: #eff3f4;
        --muted: #96a3a8;
        --border: #2b3539;
        --teal: #38b6a4;
        --orange: #e08b49;
        --red: #d95f5f;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
      }

      .shell {
        min-height: 100vh;
      }

      .band {
        width: 100%;
      }

      .inner {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
      }

      .header {
        padding: 28px 0 20px;
        border-bottom: 1px solid var(--border);
      }

      .header-row {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .title {
        margin: 0;
        font-size: 32px;
        line-height: 1.05;
        font-weight: 700;
      }

      .subtitle {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 14px;
      }

      .controls {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }

      .button,
      .select {
        border: 1px solid var(--border);
        background: var(--panel);
        color: var(--text);
        height: 40px;
        padding: 0 14px;
        border-radius: 8px;
        font: inherit;
      }

      .button {
        cursor: pointer;
      }

      .button:hover,
      .select:hover {
        border-color: #415056;
      }

      .content {
        padding: 20px 0 28px;
      }

      .grid {
        display: grid;
        gap: 14px;
      }

      .stats {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-bottom: 14px;
      }

      .charts {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-bottom: 14px;
      }

      .panel {
        background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)), var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
      }

      .stat-panel {
        padding: 16px;
        min-height: 132px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .stat-label,
      .panel-label {
        color: var(--muted);
        font-size: 13px;
      }

      .stat-value {
        font-size: clamp(28px, 4vw, 42px);
        line-height: 1;
        font-weight: 700;
      }

      .stat-meta {
        color: var(--muted);
        font-size: 13px;
      }

      .chart-panel {
        padding: 16px;
      }

      .panel-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }

      .panel-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .chart-wrap {
        height: 320px;
      }

      canvas {
        width: 100%;
        height: 100%;
      }

      .table-panel {
        overflow: hidden;
      }

      .table-head {
        padding: 16px;
        border-bottom: 1px solid var(--border);
      }

      .table-wrap {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        text-align: left;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        font-size: 14px;
        white-space: nowrap;
      }

      th {
        color: var(--muted);
        font-weight: 500;
      }

      tbody tr:hover {
        background: rgba(255, 255, 255, 0.02);
      }

      .status {
        margin: 0 0 14px;
        color: var(--muted);
        font-size: 14px;
      }

      .empty {
        padding: 28px 16px;
        color: var(--muted);
      }

      @media (max-width: 980px) {
        .stats,
        .charts {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 680px) {
        .inner {
          width: min(100% - 20px, 1180px);
        }

        .header {
          padding-top: 20px;
        }

        .title {
          font-size: 26px;
        }

        .stats,
        .charts {
          grid-template-columns: 1fr;
        }

        .chart-wrap {
          height: 260px;
        }
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  </head>
  <body>
    <div class="shell">
      <section class="band header">
        <div class="inner header-row">
          <div>
            <h1 class="title">Pico Climate Dashboard</h1>
            <p class="subtitle">Live temperature and humidity from your Raspberry Pi Pico W and SHT3x sensor.</p>
          </div>
          <div class="controls">
            <select id="range" class="select" aria-label="Time range">
              <option value="60">Last 60 readings</option>
              <option value="240">Last 240 readings</option>
              <option value="720" selected>Last 720 readings</option>
              <option value="1440">Last 1440 readings</option>
            </select>
            <button id="refresh" class="button" type="button">Refresh</button>
          </div>
        </div>
      </section>

      <main class="band content">
        <div class="inner">
          <p id="status" class="status">Loading readings...</p>

          <section class="grid stats">
            <article class="panel stat-panel">
              <div class="stat-label">Latest Temperature</div>
              <div id="latest-temp" class="stat-value">--</div>
              <div id="temp-meta" class="stat-meta">Waiting for data</div>
            </article>
            <article class="panel stat-panel">
              <div class="stat-label">Latest Humidity</div>
              <div id="latest-humidity" class="stat-value">--</div>
              <div id="humidity-meta" class="stat-meta">Waiting for data</div>
            </article>
            <article class="panel stat-panel">
              <div class="stat-label">Average Temperature</div>
              <div id="avg-temp" class="stat-value">--</div>
              <div id="avg-humidity" class="stat-meta">Average humidity: --</div>
            </article>
            <article class="panel stat-panel">
              <div class="stat-label">Last Update</div>
              <div id="last-update" class="stat-value" style="font-size: 24px;">--</div>
              <div id="device-name" class="stat-meta">Device: --</div>
            </article>
          </section>

          <section class="grid charts">
            <article class="panel chart-panel">
              <div class="panel-head">
                <div>
                  <div class="panel-label">Temperature</div>
                  <h2 class="panel-title">Trend</h2>
                </div>
                <div id="temp-range" class="panel-label">--</div>
              </div>
              <div class="chart-wrap">
                <canvas id="temperature-chart"></canvas>
              </div>
            </article>

            <article class="panel chart-panel">
              <div class="panel-head">
                <div>
                  <div class="panel-label">Humidity</div>
                  <h2 class="panel-title">Trend</h2>
                </div>
                <div id="humidity-range" class="panel-label">--</div>
              </div>
              <div class="chart-wrap">
                <canvas id="humidity-chart"></canvas>
              </div>
            </article>
          </section>

          <section class="panel table-panel">
            <div class="table-head">
              <div class="panel-label">Recent Data</div>
              <h2 class="panel-title" style="margin-top: 4px;">Latest Readings</h2>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Device</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                  </tr>
                </thead>
                <tbody id="readings-body">
                  <tr>
                    <td class="empty" colspan="4">Loading readings...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>

    <script>
      let temperatureChart;
      let humidityChart;
      let refreshTimer;

      const statusEl = document.getElementById("status");
      const rangeEl = document.getElementById("range");
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

        if (temperatureChart) temperatureChart.destroy();
        if (humidityChart) humidityChart.destroy();

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
          readingsBodyEl.innerHTML = '<tr><td class="empty" colspan="4">No readings stored yet.</td></tr>';
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

      async function loadReadings() {
        const limit = rangeEl.value;
        statusEl.textContent = "Refreshing data...";

        try {
          const response = await fetch('/readings?limit=' + encodeURIComponent(limit), {
            headers: {
              accept: 'application/json',
            },
            cache: 'no-store',
          });

          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }

          const payload = await response.json();
          const readings = Array.isArray(payload.results) ? payload.results : [];

          if (!readings.length) {
            statusEl.textContent = "No readings in the database yet.";
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
            if (temperatureChart) temperatureChart.destroy();
            if (humidityChart) humidityChart.destroy();
            updateTable([]);
            return;
          }

          statusEl.textContent = "Showing " + readings.length + " readings. Auto-refresh every 60 seconds.";
          updateSummary(readings);
          updateCharts(readings);
          updateTable(readings);
        } catch (error) {
          statusEl.textContent = "Could not load readings: " + error.message;
          updateTable([]);
        }
      }

      function startAutoRefresh() {
        if (refreshTimer) {
          clearInterval(refreshTimer);
        }

        refreshTimer = setInterval(loadReadings, 60000);
      }

      rangeEl.addEventListener("change", loadReadings);
      refreshEl.addEventListener("click", loadReadings);

      loadReadings();
      startAutoRefresh();
    </script>
  </body>
</html>`;
}
