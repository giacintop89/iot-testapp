# iot-testapp

Cloudflare Worker dashboard and API for Pico W temperature/humidity telemetry.

## Endpoints

`GET /` or `GET /dashboard`

Opens the built-in dashboard with live charts and the latest readings table.

`POST /ingest`

Stores one sensor reading in D1. Requires:

```text
Authorization: Bearer <INGEST_TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "device": "pico-sht3x",
  "temperature": 23.89,
  "humidity": 36.2
}
```

`GET /readings?limit=100`

Returns recent readings from D1.

## Setup

The Worker is already configured in `wrangler.json`:

```text
Worker: iot-testapp
D1 database: iot-testdb
D1 binding: DB
```

Apply the D1 migration:

```bash
npx wrangler d1 migrations apply DB --remote
```

Create the ingest secret:

```bash
npx wrangler secret put INGEST_TOKEN
```

Deploy:

```bash
npm run deploy
```

Test reading data:

```bash
curl https://iot-testapp.<your-workers-subdomain>.workers.dev/readings
```

Open the dashboard:

```text
https://iot-testapp.<your-workers-subdomain>.workers.dev/
```

Test inserting data:

```bash
curl -X POST https://iot-testapp.<your-workers-subdomain>.workers.dev/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <INGEST_TOKEN>" \
  -d '{"device":"test-device","temperature":23.89,"humidity":36.2}'
```
