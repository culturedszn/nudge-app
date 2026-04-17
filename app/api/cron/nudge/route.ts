import { NextResponse } from "next/server";
import {
	type MemberRow,
	type SettingsRow,
	type TriggerType,
	supabaseRequest,
	updateRows,
} from "@/lib/supabase";
import { whopsdk } from "@/lib/whop-sdk";

function isoDaysAgo(days: number): string {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - days);
	return date.toISOString();
}

function applyPlaceholders(message: string, values: Record<string, string>): string {
	let output = message;
	for (const [key, value] of Object.entries(values)) {
		output = output.replaceAll(key, value);
	}
	return output;
}

async function createNotification(options: {
	companyId: string;
	memberId: string;
	message: string;
}): Promise<void> {
	const attempts = [
		{
			company_id: options.companyId,
			member_id: options.memberId,
			message: options.message,
		},
		{
			company_id: options.companyId,
			user_id: options.memberId,
			message: options.message,
		},
		{
			company_id: options.companyId,
			title: "Nudge",
			content: options.message,
			user_id: options.memberId,
		},
	];

	let lastError: unknown;
	for (const payload of attempts) {
		try {
			await whopsdk.notifications.create(payload as never);
			return;
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError;
}

async function appendNudgeLog(options: {
	companyId: string;
	memberId: string;
	username: string;
	triggerType: TriggerType;
	messageSent: string;
}): Promise<void> {
	await supabaseRequest<void>({
		table: "nudge_log",
		method: "POST",
		prefer: "return=minimal",
		body: [
			{
				company_id: options.companyId,
				member_id: options.memberId,
				username: options.username,
				trigger_type: options.triggerType,
				message_sent: options.messageSent,
			},
		],
	});
}

async function fetchBillingLink(companyId: string, memberId: string): Promise<string> {
	try {
		const byCompany = await whopsdk.members.retrieve({
			company_id: companyId,
			id: memberId,
		} as never);
		return byCompany?.manage_url ?? byCompany?.billing_url ?? "https://whop.com";
	} catch {
		try {
			const basic = await whopsdk.members.retrieve(memberId as never);
			return basic?.manage_url ?? basic?.billing_url ?? "https://whop.com";
		} catch {
			return "https://whop.com";
		}
	}
}

async function runInactiveTrigger() {
	const settings = await supabaseRequest<SettingsRow[]>({
		table: "settings",
		query: {
			inactive_enabled: "eq.true",
		},
	});

	for (const setting of settings) {
		const cutoff = isoDaysAgo(setting.inactive_days);
		const members = await supabaseRequest<MemberRow[]>({
			table: "members",
			query: {
				company_id: `eq.${setting.company_id}`,
				membership_status: "eq.active",
				last_active_at: `lt.${cutoff}`,
				or: `(nudge_sent_at.is.null,nudge_sent_at.lt.${cutoff})`,
			},
		});

		for (const member of members) {
			try {
				const message = applyPlaceholders(setting.inactive_message, {
					"[username]": member.username,
				});

				await createNotification({
					companyId: setting.company_id,
					memberId: member.id,
					message,
				});

				const now = new Date().toISOString();
				await updateRows({
					table: "members",
					values: { nudge_sent_at: now },
					query: { id: `eq.${member.id}` },
				});
				await appendNudgeLog({
					companyId: setting.company_id,
					memberId: member.id,
					username: member.username,
					triggerType: "inactive",
					messageSent: message,
				});
			} catch (error) {
				console.error(
					`Inactive nudge failed for member ${member.id} (${setting.company_id})`,
					error,
				);
			}
		}
	}
}

async function runCancelingTrigger() {
	const settings = await supabaseRequest<SettingsRow[]>({
		table: "settings",
		query: {
			cancel_enabled: "eq.true",
		},
	});

	for (const setting of settings) {
		const members = await supabaseRequest<MemberRow[]>({
			table: "members",
			query: {
				company_id: `eq.${setting.company_id}`,
				membership_status: "eq.active",
				cancel_at_period_end: "eq.true",
				cancel_nudge_sent_at: "is.null",
			},
		});

		for (const member of members) {
			try {
				const message = applyPlaceholders(setting.cancel_message, {
					"[username]": member.username,
				});

				await createNotification({
					companyId: setting.company_id,
					memberId: member.id,
					message,
				});

				const now = new Date().toISOString();
				await updateRows({
					table: "members",
					values: { cancel_nudge_sent_at: now },
					query: { id: `eq.${member.id}` },
				});
				await appendNudgeLog({
					companyId: setting.company_id,
					memberId: member.id,
					username: member.username,
					triggerType: "canceling",
					messageSent: message,
				});
			} catch (error) {
				console.error(
					`Canceling nudge failed for member ${member.id} (${setting.company_id})`,
					error,
				);
			}
		}
	}
}

async function runPaymentFailedTrigger() {
	const settings = await supabaseRequest<SettingsRow[]>({
		table: "settings",
		query: {
			payment_enabled: "eq.true",
		},
	});

	for (const setting of settings) {
		const members = await supabaseRequest<MemberRow[]>({
			table: "members",
			query: {
				company_id: `eq.${setting.company_id}`,
				membership_status: "eq.past_due",
				payment_nudge_sent_at: "is.null",
			},
		});

		for (const member of members) {
			try {
				const billingLink = await fetchBillingLink(setting.company_id, member.id);
				const message = applyPlaceholders(setting.payment_message, {
					"[username]": member.username,
					"[billing link]": billingLink,
				});

				await createNotification({
					companyId: setting.company_id,
					memberId: member.id,
					message,
				});

				const now = new Date().toISOString();
				await updateRows({
					table: "members",
					values: { payment_nudge_sent_at: now },
					query: { id: `eq.${member.id}` },
				});
				await appendNudgeLog({
					companyId: setting.company_id,
					memberId: member.id,
					username: member.username,
					triggerType: "payment_failed",
					messageSent: message,
				});
			} catch (error) {
				console.error(
					`Payment nudge failed for member ${member.id} (${setting.company_id})`,
					error,
				);
			}
		}
	}
}

export async function GET(): Promise<NextResponse> {
	try {
		await runInactiveTrigger();
		await runCancelingTrigger();
		await runPaymentFailedTrigger();
		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (error) {
		console.error("Cron nudge job failed", error);
		return NextResponse.json({ ok: true }, { status: 200 });
	}
}
