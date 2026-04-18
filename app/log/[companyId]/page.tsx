import { headers } from "next/headers";
import Link from "next/link";
import { Badge, Button, Card, Heading, Text } from "@whop/react/components";
import { type NudgeLogRow, supabaseRequest } from "@/lib/supabase";
import { whopsdk } from "@/lib/whop-sdk";

function getTriggerBadge(triggerType: NudgeLogRow["trigger_type"]) {
	switch (triggerType) {
		case "inactive":
			return {
				label: "💤 Inactive",
				color: "blue" as const,
			};
		case "canceling":
			return {
				label: "🚨 Canceling",
				color: "red" as const,
			};
		case "payment_failed":
			return {
				label: "💳 Payment Failed",
				color: "amber" as const,
			};
		default:
			return {
				label: triggerType,
				color: "gray" as const,
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
		<div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
			<div className="mx-auto w-full max-w-4xl">
				<div className="mb-6 flex items-center gap-3">
					<Button asChild variant="surface" size="2">
						<Link href={`/settings/${companyId}`}>←</Link>
					</Button>
					<Heading size="6">Nudges Sent</Heading>
				</div>

				{rows.length === 0 ? (
					<div className="flex min-h-[55vh] items-center justify-center text-center">
						<Text color="gray">
							No nudges sent yet - Nudge is running in the background.
						</Text>
					</div>
				) : (
					<div className="space-y-3">
						{rows.map((row) => {
							const badge = getTriggerBadge(row.trigger_type);
							return (
								<Card key={row.id}>
									<div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
										<div className="min-w-0 flex-1">
											<Badge color={badge.color}>
												{badge.label}
											</Badge>
											<Text weight="bold" className="mt-2">
												@{row.username}
											</Text>
											<Text color="gray" className="mt-1 truncate">
												{truncate(row.message_sent, 80)}
											</Text>
										</div>
										<Text size="1" color="gray" className="md:text-right">
											{new Date(row.sent_at).toLocaleString()}
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
