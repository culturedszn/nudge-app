import { NextRequest, NextResponse } from "next/server";
import {
	DEFAULT_SETTINGS,
	type SettingsRow,
	supabaseRequest,
	upsertRows,
} from "@/lib/supabase";

function hasKey<T extends object>(obj: T, key: PropertyKey): boolean {
	return Object.prototype.hasOwnProperty.call(obj, key);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		const body = (await request.json()) as Partial<SettingsRow> & {
			company_id?: string;
			inactive_days?: number | null;
			inactive_message?: string | null;
			cancel_message?: string | null;
			payment_message?: string | null;
		};

		if (!body.company_id) {
			return NextResponse.json({ error: "company_id is required" }, { status: 400 });
		}

		const existingRows = await supabaseRequest<SettingsRow[]>({
			table: "settings",
			query: {
				company_id: `eq.${body.company_id}`,
				limit: 1,
			},
		});

		const existing = existingRows[0];
		const resolvedInactiveDays = hasKey(body, "inactive_days")
			? (body.inactive_days ?? existing?.inactive_days ?? DEFAULT_SETTINGS.inactive_days)
			: (existing?.inactive_days ?? DEFAULT_SETTINGS.inactive_days);
		const resolvedInactiveMessage = hasKey(body, "inactive_message")
			? (body.inactive_message ?? existing?.inactive_message ?? DEFAULT_SETTINGS.inactive_message)
			: (existing?.inactive_message ?? DEFAULT_SETTINGS.inactive_message);
		const resolvedCancelMessage = hasKey(body, "cancel_message")
			? (body.cancel_message ?? existing?.cancel_message ?? DEFAULT_SETTINGS.cancel_message)
			: (existing?.cancel_message ?? DEFAULT_SETTINGS.cancel_message);
		const resolvedPaymentMessage = hasKey(body, "payment_message")
			? (body.payment_message ?? existing?.payment_message ?? DEFAULT_SETTINGS.payment_message)
			: (existing?.payment_message ?? DEFAULT_SETTINGS.payment_message);

		await upsertRows({
			table: "settings",
			onConflict: "company_id",
			rows: [
				{
					company_id: body.company_id,
					inactive_days: resolvedInactiveDays,
					inactive_message: resolvedInactiveMessage,
					inactive_enabled: hasKey(body, "inactive_enabled")
						? (body.inactive_enabled as boolean)
						: (existing?.inactive_enabled ?? DEFAULT_SETTINGS.inactive_enabled),
					cancel_message: resolvedCancelMessage,
					cancel_enabled: hasKey(body, "cancel_enabled")
						? (body.cancel_enabled as boolean)
						: (existing?.cancel_enabled ?? DEFAULT_SETTINGS.cancel_enabled),
					payment_message: resolvedPaymentMessage,
					payment_enabled: hasKey(body, "payment_enabled")
						? (body.payment_enabled as boolean)
						: (existing?.payment_enabled ?? DEFAULT_SETTINGS.payment_enabled),
				},
			],
		});

		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (error) {
		console.error("Failed to save settings", error);
		return NextResponse.json(
			{ error: "Failed to save settings" },
			{ status: 500 },
		);
	}
}
