export type MembershipStatus = "active" | "past_due" | "canceled" | "paused";
export type TriggerType = "inactive" | "canceling" | "payment_failed";

export interface MemberRow {
	id: string;
	company_id: string;
	username: string;
	last_active_at: string | null;
	joined_at: string | null;
	membership_status: MembershipStatus;
	cancel_at_period_end: boolean;
	cancellation_reason: string | null;
	nudge_sent_at: string | null;
	cancel_nudge_sent_at: string | null;
	payment_nudge_sent_at: string | null;
	created_at: string;
}

export interface SettingsRow {
	company_id: string;
	inactive_days: number;
	inactive_message: string;
	inactive_enabled: boolean;
	cancel_message: string;
	cancel_enabled: boolean;
	payment_message: string;
	payment_enabled: boolean;
	created_at: string;
}

export interface NudgeLogRow {
	id: string;
	company_id: string;
	member_id: string;
	username: string;
	trigger_type: TriggerType;
	message_sent: string;
	sent_at: string;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function getEnvOrThrow(value: string | undefined, key: string): string {
	if (!value) {
		throw new Error(`Missing required env var: ${key}`);
	}
	return value;
}

export function getSupabaseRestBaseUrl(): string {
	return `${getEnvOrThrow(SUPABASE_URL, "SUPABASE_URL")}/rest/v1`;
}

function buildQueryString(
	query?: Record<string, string | number | boolean | null | undefined>,
): string {
	if (!query) return "";

	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (value === null || value === undefined) continue;
		params.set(key, String(value));
	}

	const encoded = params.toString();
	return encoded ? `?${encoded}` : "";
}

export async function supabaseRequest<T>(options: {
	table: string;
	method?: "GET" | "POST" | "PATCH";
	query?: Record<string, string | number | boolean | null | undefined>;
	body?: unknown;
	prefer?: string;
}): Promise<T> {
	const { table, method = "GET", query, body, prefer } = options;
	const url = `${getSupabaseRestBaseUrl()}/${table}${buildQueryString(query)}`;
	const apiKey = getEnvOrThrow(SUPABASE_ANON_KEY, "SUPABASE_ANON_KEY");

	const response = await fetch(url, {
		method,
		headers: {
			"Content-Type": "application/json",
			apikey: apiKey,
			Authorization: `Bearer ${apiKey}`,
			...(prefer ? { Prefer: prefer } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
		next: { revalidate: 0 },
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Supabase request failed (${response.status}): ${errorText}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	const text = await response.text();
	if (!text) {
		return undefined as T;
	}

	return JSON.parse(text) as T;
}

export async function upsertRows<T extends Record<string, unknown>>(options: {
	table: string;
	rows: T[];
	onConflict: string;
}): Promise<void> {
	const { table, rows, onConflict } = options;
	if (!rows.length) return;

	await supabaseRequest<void>({
		table,
		method: "POST",
		query: { on_conflict: onConflict },
		prefer: "resolution=merge-duplicates",
		body: rows,
	});
}

export async function updateRows<T extends Record<string, unknown>>(options: {
	table: string;
	values: T;
	query: Record<string, string | number | boolean | null | undefined>;
}): Promise<void> {
	await supabaseRequest<void>({
		table: options.table,
		method: "PATCH",
		prefer: "return=minimal",
		body: options.values,
		query: options.query,
	});
}

export const DEFAULT_SETTINGS: Omit<SettingsRow, "company_id" | "created_at"> = {
	inactive_days: 7,
	inactive_message: "Hey [username], we miss you! Come check out what's new...",
	inactive_enabled: true,
	cancel_message:
		"Hey [username], we noticed you're leaving. We'd hate to see you go - reply here and let us know how we can help.",
	cancel_enabled: true,
	payment_message:
		"Hey [username], your payment didn't go through. Update your billing here: [billing link] so you don't lose access.",
	payment_enabled: true,
};
