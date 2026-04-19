import { headers } from "next/headers";
import { type SettingsRow, supabaseRequest } from "@/lib/supabase";
import { whopsdk } from "@/lib/whop-sdk";
import { EditNudgeClient } from "./edit-nudge-client";

export default async function EditNudgePage({
	params,
	searchParams,
}: {
	params: Promise<{ companyId: string }>;
	searchParams: Promise<{ trigger?: string }>;
}) {
	const { companyId } = await params;
	const { trigger } = await searchParams;
	await whopsdk.verifyUserToken(await headers());

	const settingsRows = await supabaseRequest<SettingsRow[]>({
		table: "settings",
		query: {
			company_id: `eq.${companyId}`,
			limit: 1,
		},
	});

	const safeTrigger =
		trigger === "inactive" || trigger === "canceling" || trigger === "payment"
			? trigger
			: "inactive";

	return (
		<EditNudgeClient
			companyId={companyId}
			trigger={safeTrigger}
			settings={settingsRows[0] ?? null}
		/>
	);
}
