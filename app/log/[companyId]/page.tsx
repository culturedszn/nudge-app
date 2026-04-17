import { headers } from "next/headers";
import Link from "next/link";
import { type NudgeLogRow, supabaseRequest } from "@/lib/supabase";
import { whopsdk } from "@/lib/whop-sdk";

function getTriggerBadge(triggerType: NudgeLogRow["trigger_type"]) {
	switch (triggerType) {
		case "inactive":
			return {
				label: "💤 Inactive",
				className: "bg-[#dbeafe] text-[#1d4ed8]",
			};
		case "canceling":
			return {
				label: "🚨 Canceling",
				className: "bg-[#fee2e2] text-[#b91c1c]",
			};
		case "payment_failed":
			return {
				label: "💳 Payment Failed",
				className: "bg-[#fef3c7] text-[#b45309]",
			};
		default:
			return {
				label: triggerType,
				className: "bg-[#e5e7eb] text-[#374151]",
			};
	}
}

function truncate(text: string, max = 80): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max).trimEnd()}...`;
}

export default async function NudgeLogPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	await whopsdk.verifyUserToken(await headers());

	const rows = await supabaseRequest<NudgeLogRow[]>({
		table: "nudge_log",
		query: {
			company_id: `eq.${companyId}`,
			order: "sent_at.desc",
		},
	});

	return (
		<div className="min-h-screen bg-[#f5f5f5] px-4 py-6 md:px-6 md:py-8">
			<div className="mx-auto w-full max-w-4xl">
				<div className="mb-6 flex items-center gap-3">
					<Link
						href={`/settings/${companyId}`}
						className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#111827] shadow-sm ring-1 ring-black/5"
					>
						←
					</Link>
					<h1 className="text-2xl font-bold text-[#111827]">Nudges Sent</h1>
				</div>

				{rows.length === 0 ? (
					<div className="flex min-h-[55vh] flex-col items-center justify-center rounded-2xl bg-white px-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
						<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f6] text-2xl text-[#9ca3af]">
							✓
						</div>
						<p className="text-sm text-[#6b7280]">
							No nudges sent yet - Nudge is running in the background.
						</p>
					</div>
				) : (
					<div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
						{rows.map((row, index) => {
							const badge = getTriggerBadge(row.trigger_type);
							return (
								<div key={row.id}>
									<div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
										<div className="min-w-0 flex-1">
											<span
												className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
											>
												{badge.label}
											</span>
											<p className="mt-2 text-sm font-semibold text-[#111827]">
												@{row.username}
											</p>
											<p className="mt-1 truncate text-sm text-[#6b7280]">
												{truncate(row.message_sent, 80)}
											</p>
										</div>
										<p className="text-xs text-[#9ca3af] md:text-right">
											{new Date(row.sent_at).toLocaleString()}
										</p>
									</div>
									{index < rows.length - 1 ? (
										<div className="mx-5 h-px bg-[#f3f4f6] md:mx-6" />
									) : null}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
