# iot-testapp

Cloudflare Worker dashboard and API for collecting Raspberry Pi Pico W temperature and humidity telemetry from an SHT3x sensor.

The application has two main parts:

- A JSON API that accepts sensor readings, stores them in Cloudflare D1, and returns stored readings.
- A browser dashboard that shows the latest values, averages, line charts, and a table of recent readings.

## Architecture

```text
Pico W / device
  POST /ingest
      |
      v
Cloudflare Worker
  validates token and payload
  writes to D1 table: readings
      |
      v
Dashboard browser page
  GET /reading-days
  GET /readings?limit=720&day=YYYY-MM-DD
  renders stats, charts, and table
```

The Worker is the single entry point for both API traffic and dashboard assets. The HTML, CSS, and JavaScript are generated from TypeScript modules in `src/`.

## Project Structure

```text
.
|-- src/
|   |-- index.ts              Worker entry point and API routes
|   |-- renderDashboard.ts    HTML shell for the dashboard
|   |-- dashboardStyles.ts    CSS served as /dashboard.css
|   `-- dashboardScript.ts    Browser JavaScript served as /dashboard.js
|-- migrations/
|   |-- 0001_create_readings_table.sql
|   `-- 0002_ensure_readings_table.sql
|-- wrangler.json             Cloudflare Worker and D1 configuration
|-- worker-configuration.d.ts Generated Cloudflare runtime types
|-- tsconfig.json             TypeScript configuration
|-- package.json              Scripts and dev dependencies
`-- README.md
```

## How the Code Works

### `src/index.ts`

`src/index.ts` is the Cloudflare Worker entry point. It exports a `fetch` handler that receives every HTTP request and routes it by path and method.

Important pieces:

- `AppEnv extends Env` adds the optional `INGEST_TOKEN` secret to the generated Cloudflare environment type.
- `ReadingPayload` describes the incoming JSON body for sensor data.
- `corsHeaders` allows browser or device clients to call the API with `GET`, `POST`, and `OPTIONS`.
- `jsonResponse`, `htmlResponse`, and `textResponse` create consistent responses with `cache-control: no-store`.
- `parseFiniteNumber` accepts finite numbers and numeric strings, then rejects empty, invalid, or infinite values.
- `parseDevice` accepts a non-empty device name, trims it, limits it to 80 characters, and falls back to `pico-sht3x`.
- `handleIngest` authenticates the request, validates the JSON body, inserts one row into D1, and returns the inserted values.
- `handleReadings` reads recent rows from D1 with optional `limit`, `device`, and `day` filters.
- `handleReadingDays` returns up to 30 recent dates that contain readings.
- The exported `fetch` function maps routes such as `/ingest`, `/readings`, `/dashboard`, `/dashboard.js`, and `/dashboard.css`.

### `src/renderDashboard.ts`

`renderDashboardHtml()` returns the full HTML document for the dashboard.

It includes:

- A title and subtitle for the Pico climate dashboard.
- A day selector populated by `/reading-days`.
- A range selector for choosing how many readings to request.
- A refresh button.
- Four summary panels for latest temperature, latest humidity, average temperature/humidity, and last update.
- Two `<canvas>` elements used by Chart.js for temperature and humidity line charts.
- A table that displays the latest 20 readings from the selected result set.
- A Chart.js CDN script and the local `/dashboard.js` script.

### `src/dashboardStyles.ts`

`dashboardStyles.ts` exports the CSS string served at `/dashboard.css`.

The stylesheet defines:

- A dark color theme using CSS custom properties.
- Responsive page layout with a centered `.inner` container.
- Header, controls, panels, charts, and table styling.
- Four-column stats on large screens, two-column layouts on medium screens, and single-column layouts on small screens.
- Fixed chart heights so the Chart.js canvases resize cleanly.

### `src/dashboardScript.ts`

`dashboardScript.ts` exports browser JavaScript served at `/dashboard.js`.

The script:

- Stores references to dashboard DOM elements.
- Formats numbers, dates, day labels, and relative update times.
- Fetches available days from `/reading-days`.
- Fetches readings from `/readings`.
- Calculates latest values, averages, and min/max ranges.
- Creates and destroys Chart.js line charts when the selected data changes.
- Updates the readings table with the latest 20 rows.
- Refreshes automatically every 60 seconds.
- Refreshes manually when the user clicks the refresh button.
- Reloads data when the day or range selector changes.

## Database Schema

The D1 database contains one table named `readings`.

```sql
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device TEXT NOT NULL,
  temperature REAL NOT NULL,
  humidity REAL NOT NULL,
  created_at TEXT NOT NULL
);
```

Indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_readings_created_at
ON readings(created_at);

CREATE INDEX IF NOT EXISTS idx_readings_device_created_at
ON readings(device, created_at);
```

The `created_at` value is written by the Worker with `new Date().toISOString()`. The dashboard and API use the first 10 characters of this timestamp for day filtering in `YYYY-MM-DD` format.

## API Reference

### `POST /ingest`

Stores one temperature and humidity reading.

Headers:

```text
Authorization: Bearer <INGEST_TOKEN>
Content-Type: application/json
```

Request body:

```json
{
  "device": "pico-sht3x",
  "temperature": 23.89,
  "humidity": 36.2
}
```

`device` is optional. If it is missing or blank, the Worker stores `pico-sht3x`.

`temperature` and `humidity` are required and must be valid finite numbers. Numeric strings such as `"23.89"` are also accepted.

Successful response:

```json
{
  "ok": true,
  "id": 1,
  "device": "pico-sht3x",
  "temperature": 23.89,
  "humidity": 36.2,
  "created_at": "2026-04-24T10:15:30.000Z"
}
```

Common errors:

```text
500 INGEST_TOKEN secret is not configured on this Worker
401 Unauthorized
400 Invalid JSON body
400 temperature and humidity must be valid numbers
```

Example:

```bash
curl -X POST "https://iot-testapp.<your-workers-subdomain>.workers.dev/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <INGEST_TOKEN>" \
  -d '{"device":"pico-sht3x","temperature":23.89,"humidity":36.2}'
```

### `GET /readings`

Returns readings ordered from newest to oldest.

Query parameters:

```text
limit=100          Number of rows to return. Clamped from 1 to 1000.
device=pico-sht3x  Optional exact device filter.
day=YYYY-MM-DD     Optional day filter based on created_at.
```

Examples:

```bash
curl "https://iot-testapp.<your-workers-subdomain>.workers.dev/readings"
curl "https://iot-testapp.<your-workers-subdomain>.workers.dev/readings?limit=720"
curl "https://iot-testapp.<your-workers-subdomain>.workers.dev/readings?day=2026-04-24"
curl "https://iot-testapp.<your-workers-subdomain>.workers.dev/readings?device=pico-sht3x&day=2026-04-24"
```

Response:

```json
{
  "results": [
    {
      "id": 1,
      "device": "pico-sht3x",
      "temperature": 23.89,
      "humidity": 36.2,
      "created_at": "2026-04-24T10:15:30.000Z"
    }
  ]
}
```

### `GET /reading-days`

Returns up to 30 recent days that have stored readings.

Example response:

```json
{
  "days": ["2026-04-24", "2026-04-23"]
}
```

The dashboard uses this endpoint to populate the day selector.

### `GET /` and `GET /dashboard`

Returns the dashboard HTML page.

Open:

```text
https://iot-testapp.<your-workers-subdomain>.workers.dev/
```

or:

```text
https://iot-testapp.<your-workers-subdomain>.workers.dev/dashboard
```

### `GET /dashboard.css`

Returns the dashboard stylesheet from `src/dashboardStyles.ts`.

### `GET /dashboard.js`

Returns the dashboard browser script from `src/dashboardScript.ts`.

### Other Paths

Any other path returns a small JSON object listing the available endpoints.

## Dashboard Behavior

When the page loads, the browser script performs this sequence:

1. Fetches `/reading-days` and fills the day selector.
2. Fetches `/readings?limit=<selected range>`.
3. Updates the summary cards from the newest row.
4. Reverses the readings into chronological order for the charts.
5. Draws temperature and humidity line charts with Chart.js.
6. Shows the latest 20 readings in the table.
7. Starts a 60-second auto-refresh timer.

Changing the day or range selector reloads the readings. The refresh button reloads both the available days and the readings.

## Configuration

`wrangler.json` defines the Cloudflare deployment:

```json
{
  "name": "iot-testapp",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-08",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "iot-testdb"
    }
  ]
}
```

The Worker expects:

- `DB`: a Cloudflare D1 binding configured in `wrangler.json`.
- `INGEST_TOKEN`: a secret used to protect `POST /ingest`.

The generated `worker-configuration.d.ts` file currently includes the `DB` binding. `src/index.ts` extends that generated type with `INGEST_TOKEN`.

## Setup

Prerequisites:

- Node.js
- Cloudflare account
- Wrangler login configured with access to Workers and D1
- `pnpm` if you want to use the current `dev` script directly

Install dependencies:

```bash
npm install
```

Log in to Cloudflare if needed:

```bash
npx wrangler login
```

Create the ingest secret:

```bash
npx wrangler secret put INGEST_TOKEN
```

Apply the remote D1 migrations:

```bash
npx wrangler d1 migrations apply DB --remote
```

Deploy:

```bash
npm run deploy
```

`npm run deploy` also runs the `predeploy` script, which applies remote D1 migrations before deployment.

## Local Development

The current `dev` script uses `pnpm`:

```bash
pnpm install
pnpm dev
```

That command applies local D1 migrations and starts `wrangler dev`.

If you prefer npm, run the same steps explicitly:

```bash
npm install
npm run seedLocalD1
npx wrangler dev
```

After the dev server starts, open the local Worker URL printed by Wrangler. The dashboard is available at `/` and `/dashboard`.

For local ingest testing, configure a local secret or environment value for `INGEST_TOKEN`, then post a sample reading to the local URL.

## Package Scripts

```text
npm run cf-typegen     Regenerate Cloudflare Worker environment types.
npm run check          Run TypeScript checks and a Wrangler dry-run deploy.
npm run deploy         Deploy the Worker to Cloudflare.
npm run dev            Apply local migrations with pnpm, then run Wrangler dev.
npm run predeploy      Apply remote D1 migrations before deployment.
npm run seedLocalD1    Apply D1 migrations to the local development database.
```

## Example Device Payload

A Pico W or any other HTTP client should send a POST request like this:

```http
POST /ingest HTTP/1.1
Host: iot-testapp.<your-workers-subdomain>.workers.dev
Authorization: Bearer <INGEST_TOKEN>
Content-Type: application/json

{
  "device": "pico-sht3x",
  "temperature": 23.89,
  "humidity": 36.2
}
```

Only the Worker should know the ingest token. Do not expose it in dashboard JavaScript or public frontend code.

## Validation and Security Notes

- `POST /ingest` requires `Authorization: Bearer <INGEST_TOKEN>`.
- If `INGEST_TOKEN` is missing from the Worker environment, ingest requests fail with `500`.
- API JSON responses include CORS headers with `access-control-allow-origin: *`.
- Responses use `cache-control: no-store` so browser and intermediary caches do not serve stale sensor data.
- The readings limit is clamped to a maximum of 1000 rows to avoid expensive unbounded reads.
- Day filters must match `YYYY-MM-DD`; invalid values are ignored.

## Troubleshooting

`401 Unauthorized` from `/ingest` means the request token does not exactly match the Worker secret.

`500 INGEST_TOKEN secret is not configured on this Worker` means the secret has not been set in Cloudflare for the deployed Worker.

An empty dashboard usually means there are no rows in D1 yet. Insert a reading with `POST /ingest`, then refresh the dashboard.

If `/readings` works locally but not remotely, make sure migrations were applied with `--remote` and that `wrangler.json` points to the expected D1 database.

If TypeScript reports missing or stale Cloudflare environment types, regenerate them:

```bash
npm run cf-typegen
```
