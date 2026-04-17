import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_SETTINGS, type SettingsRow, upsertRows } from "@/lib/supabase";

export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		const body = (await request.json()) as Partial<SettingsRow> & {
			company_id?: string;
		};

		if (!body.company_id) {
			return NextResponse.json({ error: "company_id is required" }, { status: 400 });
		}

		await upsertRows({
			table: "settings",
			onConflict: "company_id",
			rows: [
				{
					company_id: body.company_id,
					inactive_days: body.inactive_days ?? DEFAULT_SETTINGS.inactive_days,
					inactive_message:
						body.inactive_message ?? DEFAULT_SETTINGS.inactive_message,
					inactive_enabled:
						body.inactive_enabled ?? DEFAULT_SETTINGS.inactive_enabled,
					cancel_message: body.cancel_message ?? DEFAULT_SETTINGS.cancel_message,
					cancel_enabled: body.cancel_enabled ?? DEFAULT_SETTINGS.cancel_enabled,
					payment_message:
						body.payment_message ?? DEFAULT_SETTINGS.payment_message,
					payment_enabled:
						body.payment_enabled ?? DEFAULT_SETTINGS.payment_enabled,
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
