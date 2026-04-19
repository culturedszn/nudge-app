import { headers } from "next/headers";
import Link from "next/link";
import { Button, Card, Heading, Text } from "@whop/react/components";
import { type NudgeLogRow, supabaseRequest } from "@/lib/supabase";
import { whopsdk } from "@/lib/whop-sdk";

function getTriggerBadge(triggerType: NudgeLogRow["trigger_type"]): {
	label: string;
	className: string;
} {
	switch (triggerType) {
		case "inactive":
			return {
				label: "💤 Inactive",
				className: "bg-[#eff6ff] text-[#2563eb]",
			};
		case "canceling":
			return {
				label: "🚨 Canceling",
				className: "bg-[#fef2f2] text-[#dc2626]",
			};
		case "payment_failed":
			return {
				label: "💳 Payment",
				className: "bg-[#fefce8] text-[#ca8a04]",
			};
		default:
			return {
				label: triggerType,
				className: "bg-zinc-100 text-zinc-600",
			};
	}
}

function truncate(text: string, max = 100): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max).trimEnd()}...`;
}

function formatTimestamp(value: string): string {
	const date = new Date(value);
	const monthDay = date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
	const time = date.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});
	return `${monthDay} · ${time}`;
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
		<div className="relative min-h-screen overflow-hidden bg-[#f2f4f6] px-4 py-6 md:px-6 md:py-8">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-[#FA4616]/14 blur-3xl" />
				<div className="absolute -right-16 bottom-12 h-64 w-64 rounded-full bg-[#0f172a]/7 blur-3xl" />
			</div>

			<div className="relative mx-auto w-full max-w-3xl">
				<div className="mb-6 rounded-[20px] border border-white/80 bg-white/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.1)] backdrop-blur-xl md:p-5">
					<div className="flex items-center gap-3">
						<Button asChild size="2" className="gap-1.5 rounded-full border border-zinc-300 bg-white px-3 text-zinc-700">
						<Link href={`/home/${companyId}`}>← Back</Link>
					</Button>
						<Heading size="6" className="text-[22px] font-semibold tracking-[-0.02em] text-[#0f172a]">
							Nudges Sent
						</Heading>
					</div>
				</div>

				{rows.length === 0 ? (
					<div className="flex min-h-[68vh] flex-col items-center justify-center px-4 text-center">
						<Text className="text-[48px]">📭</Text>
						<Heading size="4" className="mt-4 text-[18px] font-semibold text-[#111111]">
							Nothing sent yet
						</Heading>
						<Text className="mt-2 max-w-[300px] text-[14px] leading-[1.6] text-[#888888]">
							Nudge is running in the background. When a member gets a nudge, it&apos;ll appear
							here.
						</Text>
					</div>
				) : (
					<div className="space-y-3">
						{rows.map((row) => {
							const badge = getTriggerBadge(row.trigger_type);
							return (
								<Card
									key={row.id}
									className="mx-1 rounded-xl border border-white/85 bg-white/80 px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm"
								>
									<div className="flex items-center justify-between gap-3">
										<span
											className={[
												"inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium",
												badge.className,
											].join(" ")}
										>
											{badge.label}
										</span>
										<Text className="text-[12px] text-[#9ca3af]">{formatTimestamp(row.sent_at)}</Text>
									</div>

									<Text className="mt-1.5 text-[14px] font-semibold text-[#111111]">
										@{row.username}
									</Text>

									<div className="mt-1 rounded-lg bg-[#f9f9f9] px-3 py-2">
										<Text className="text-[13px] italic text-[#666666]">
											{truncate(row.message_sent, 100)}
										</Text>
									</div>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
