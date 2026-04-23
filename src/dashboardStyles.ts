export const dashboardCss = `:root {
  color-scheme: dark;
  --bg: #101416;
  --panel: #171d20;
  --text: #eff3f4;
  --muted: #96a3a8;
  --border: #2b3539;
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
  align-items: end;
  flex-wrap: wrap;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  color: var(--muted);
  font-size: 12px;
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

.select {
  min-width: 180px;
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

.stat-value-sm {
  font-size: 24px;
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

.table-title {
  margin-top: 4px;
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

  .controls,
  .control {
    width: 100%;
  }

  .select,
  .button {
    width: 100%;
  }

  .stats,
  .charts {
    grid-template-columns: 1fr;
  }

  .chart-wrap {
    height: 260px;
  }
}
`;
