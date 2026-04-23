import { renderDashboardHtml } from "./renderDashboard";
import { dashboardJs } from "./dashboardScript";
import { dashboardCss } from "./dashboardStyles";

interface AppEnv extends Env {
	INGEST_TOKEN?: string;
}

type ReadingPayload = {
	device?: unknown;
	temperature?: unknown;
	humidity?: unknown;
};

const corsHeaders = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, POST, OPTIONS",
	"access-control-allow-headers": "content-type, authorization",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
	return Response.json(body, {
		...init,
		headers: {
			"cache-control": "no-store",
			...corsHeaders,
			...init.headers,
		},
	});
}

function htmlResponse(body: string, init: ResponseInit = {}) {
	return new Response(body, {
		...init,
		headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "no-store",
			...init.headers,
		},
	});
}

function textResponse(contentType: string, body: string, init: ResponseInit = {}) {
	return new Response(body, {
		...init,
		headers: {
			"content-type": contentType,
			"cache-control": "no-store",
			...init.headers,
		},
	});
}

function parseFiniteNumber(value: unknown) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
}

function parseDevice(value: unknown) {
	if (typeof value === "string" && value.trim() !== "") {
		return value.trim().slice(0, 80);
	}

	return "pico-sht3x";
}

async function handleIngest(request: Request, env: AppEnv) {
	if (!env.INGEST_TOKEN) {
		return jsonResponse(
			{ error: "INGEST_TOKEN secret is not configured on this Worker" },
			{ status: 500 },
		);
	}

	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${env.INGEST_TOKEN}`) {
		return jsonResponse({ error: "Unauthorized" }, { status: 401 });
	}

	let body: ReadingPayload;
	try {
		body = (await request.json()) as ReadingPayload;
	} catch {
		return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
	}

	const device = parseDevice(body.device);
	const temperature = parseFiniteNumber(body.temperature);
	const humidity = parseFiniteNumber(body.humidity);

	if (temperature === null || humidity === null) {
		return jsonResponse(
			{ error: "temperature and humidity must be valid numbers" },
			{ status: 400 },
		);
	}

	const createdAt = new Date().toISOString();

	const result = await env.DB.prepare(
		`INSERT INTO readings (device, temperature, humidity, created_at)
		 VALUES (?, ?, ?, ?)`,
	)
		.bind(device, temperature, humidity, createdAt)
		.run();

	return jsonResponse({
		ok: true,
		id: result.meta.last_row_id,
		device,
		temperature,
		humidity,
		created_at: createdAt,
	});
}

async function handleReadings(request: Request, env: AppEnv) {
	const url = new URL(request.url);
	const rawLimit = Number(url.searchParams.get("limit") || "100");
	const limit = Number.isFinite(rawLimit)
		? Math.max(1, Math.min(Math.trunc(rawLimit), 1000))
		: 100;
	const device = url.searchParams.get("device");
	const day = url.searchParams.get("day");

	const hasDayFilter = typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day);

	const query = device && hasDayFilter
		? env.DB.prepare(
				`SELECT id, device, temperature, humidity, created_at
				 FROM readings
				 WHERE device = ?
				 AND substr(created_at, 1, 10) = ?
				 ORDER BY created_at DESC, id DESC
				 LIMIT ?`,
			).bind(device, day, limit)
		: device
			? env.DB.prepare(
					`SELECT id, device, temperature, humidity, created_at
					 FROM readings
					 WHERE device = ?
					 ORDER BY created_at DESC, id DESC
					 LIMIT ?`,
				).bind(device, limit)
			: hasDayFilter
				? env.DB.prepare(
						`SELECT id, device, temperature, humidity, created_at
						 FROM readings
						 WHERE substr(created_at, 1, 10) = ?
						 ORDER BY created_at DESC, id DESC
						 LIMIT ?`,
					).bind(day, limit)
				: env.DB.prepare(
						`SELECT id, device, temperature, humidity, created_at
						 FROM readings
						 ORDER BY created_at DESC, id DESC
						 LIMIT ?`,
					).bind(limit);

	const { results } = await query.all();
	return jsonResponse({ results });
}

async function handleReadingDays(env: AppEnv) {
	const { results } = await env.DB.prepare(
		`SELECT DISTINCT substr(created_at, 1, 10) AS day
		 FROM readings
		 ORDER BY day DESC
		 LIMIT 30`,
	).all<{ day: string }>();

	return jsonResponse({
		days: results.map((row) => row.day).filter(Boolean),
	});
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		if (url.pathname === "/ingest" && request.method === "POST") {
			return handleIngest(request, env);
		}

		if (url.pathname === "/readings" && request.method === "GET") {
			return handleReadings(request, env);
		}

		if (url.pathname === "/reading-days" && request.method === "GET") {
			return handleReadingDays(env);
		}

		if ((url.pathname === "/" || url.pathname === "/dashboard") && request.method === "GET") {
			return htmlResponse(renderDashboardHtml());
		}

		if (url.pathname === "/dashboard.js" && request.method === "GET") {
			return textResponse("application/javascript; charset=utf-8", dashboardJs);
		}

		if (url.pathname === "/dashboard.css" && request.method === "GET") {
			return textResponse("text/css; charset=utf-8", dashboardCss);
		}

		return jsonResponse({
			ok: true,
			name: "iot-testapp",
			endpoints: {
				dashboard: "GET /dashboard",
				dashboard_js: "GET /dashboard.js",
				dashboard_css: "GET /dashboard.css",
				ingest: "POST /ingest",
				reading_days: "GET /reading-days",
				readings: "GET /readings?limit=100",
			},
		});
	},
} satisfies ExportedHandler<AppEnv>;
