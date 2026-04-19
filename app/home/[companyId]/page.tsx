import { headers } from "next/headers";
import { type SettingsRow, supabaseRequest } from "@/lib/supabase";
import { whopsdk } from "@/lib/whop-sdk";
import { HomeDashboardClient } from "./home-dashboard-client";

export default async function HomeDashboardPage({
	params,
	searchParams,
}: {
	params: Promise<{ companyId: string }>;
	searchParams: Promise<{ toast?: string }>;
}) {
	const { companyId } = await params;
	const { toast } = await searchParams;
	await whopsdk.verifyUserToken(await headers());

	const settingsRows = await supabaseRequest<SettingsRow[]>({
		table: "settings",
		query: {
			company_id: `eq.${companyId}`,
			limit: 1,
		},
	});

	return (
		<HomeDashboardClient
			companyId={companyId}
			initialSettings={settingsRows[0] ?? null}
			initialToast={toast}
		/>
	);
}
