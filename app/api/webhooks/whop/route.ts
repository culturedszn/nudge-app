import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { upsertRows, updateRows } from "@/lib/supabase";
import { whopsdk } from "@/lib/whop-sdk";

type WhopWebhook = {
	type: string;
	data: any;
};

function pickMemberId(data: any): string | null {
	return data?.member_id ?? data?.membership?.id ?? data?.member?.id ?? data?.id ?? null;
}

function pickCompanyId(data: any): string | null {
	return data?.company_id ?? data?.company?.id ?? data?.organization_id ?? null;
}

function pickUsername(data: any): string {
	return data?.username ?? data?.user?.username ?? data?.member?.username ?? "member";
}

export async function POST(request: NextRequest): Promise<Response> {
	const requestBodyText = await request.text();
	const requestHeaders = Object.fromEntries(request.headers);

	try {
		const webhookData = whopsdk.webhooks.unwrap(requestBodyText, {
			headers: requestHeaders,
		}) as WhopWebhook;

		waitUntil(handleWebhook(webhookData));
	} catch (error) {
		console.error("Webhook verification failed", error);
	}

	return new Response("OK", { status: 200 });
}

async function handleWebhook(webhookData: WhopWebhook): Promise<void> {
	try {
		switch (webhookData.type) {
			case "membership.activated": {
				const memberId = pickMemberId(webhookData.data);
				const companyId = pickCompanyId(webhookData.data);
				if (!memberId || !companyId) return;

				await upsertRows({
					table: "members",
					onConflict: "id",
					rows: [
						{
							id: memberId,
							company_id: companyId,
							username: pickUsername(webhookData.data),
							last_active_at:
								webhookData.data?.most_recent_action_at ??
								webhookData.data?.last_active_at ??
								null,
							joined_at:
								webhookData.data?.joined_at ?? webhookData.data?.created_at ?? null,
							membership_status: "active",
							cancel_at_period_end: Boolean(
								webhookData.data?.cancel_at_period_end,
							),
							cancellation_reason: webhookData.data?.cancellation_reason ?? null,
						},
					],
				});
				break;
			}
			case "membership.went_invalid": {
				const memberId = pickMemberId(webhookData.data);
				if (!memberId) return;

				await updateRows({
					table: "members",
					values: { membership_status: "canceled" },
					query: { id: `eq.${memberId}` },
				});
				break;
			}
			case "payment.failed": {
				const memberId = pickMemberId(webhookData.data);
				if (!memberId) return;

				await updateRows({
					table: "members",
					values: { membership_status: "past_due" },
					query: { id: `eq.${memberId}` },
				});
				break;
			}
			case "membership.cancel_at_period_end_changed": {
				const memberId = pickMemberId(webhookData.data);
				if (!memberId) return;

				await updateRows({
					table: "members",
					values: {
						cancel_at_period_end: Boolean(
							webhookData.data?.cancel_at_period_end ?? true,
						),
					},
					query: { id: `eq.${memberId}` },
				});
				break;
			}
			default:
				break;
		}
	} catch (error) {
		console.error(`Failed handling webhook event ${webhookData.type}`, error);
	}
}
