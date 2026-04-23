export function renderDashboardHtml() {
	return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pico Climate Dashboard</title>
    <link rel="stylesheet" href="/dashboard.css" />
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
            <label class="control">
              <span class="control-label">Day</span>
              <select id="day" class="select" aria-label="Day selector">
                <option value="">All available days</option>
              </select>
            </label>
            <label class="control">
              <span class="control-label">Range</span>
              <select id="range" class="select" aria-label="Time range">
                <option value="60">Last 60 readings</option>
                <option value="240">Last 240 readings</option>
                <option value="720" selected>Last 720 readings</option>
                <option value="1440">Last 1440 readings</option>
              </select>
            </label>
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
              <div id="last-update" class="stat-value stat-value-sm">--</div>
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
              <h2 class="panel-title table-title">Latest Readings</h2>
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

    <script src="/dashboard.js" defer></script>
  </body>
</html>`;
}
