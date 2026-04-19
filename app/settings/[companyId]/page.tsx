import { headers } from "next/headers";
import Link from "next/link";
import { Button, Heading } from "@whop/react/components";
import { DEFAULT_SETTINGS, type MemberRow, type SettingsRow, supabaseRequest } from "@/lib/supabase";
import { whopsdk } from "@/lib/whop-sdk";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	await whopsdk.verifyUserToken(await headers());

	const [settingsRows, memberRows] = await Promise.all([
		supabaseRequest<SettingsRow[]>({
			table: "settings",
			query: {
				company_id: `eq.${companyId}`,
				limit: 1,
			},
		}),
		supabaseRequest<MemberRow[]>({
			table: "members",
			query: {
				company_id: `eq.${companyId}`,
				select: "id",
			},
		}),
	]);

	const existing = settingsRows[0];
	const initialValues = {
		inactive_days: existing?.inactive_days ?? DEFAULT_SETTINGS.inactive_days,
		inactive_message:
			existing?.inactive_message ?? DEFAULT_SETTINGS.inactive_message,
		inactive_enabled:
			existing?.inactive_enabled ?? DEFAULT_SETTINGS.inactive_enabled,
		cancel_message: existing?.cancel_message ?? DEFAULT_SETTINGS.cancel_message,
		cancel_enabled: existing?.cancel_enabled ?? DEFAULT_SETTINGS.cancel_enabled,
		payment_message:
			existing?.payment_message ?? DEFAULT_SETTINGS.payment_message,
		payment_enabled:
			existing?.payment_enabled ?? DEFAULT_SETTINGS.payment_enabled,
	};

	return (
		<div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
			<div className="mx-auto w-full max-w-3xl">
				<div className="mb-6 flex items-center gap-3">
					<Button
						asChild
						size="2"
						className="gap-1.5"
						style={{
							backgroundColor: "#FFF4F0",
							color: "#FA4616",
							border: "1px solid #FFD6C8",
						}}
					>
						<Link href={`/dashboard/${companyId}`}>
							<span aria-hidden="true">←</span>
							<span>Back</span>
						</Link>
					</Button>
					<Heading size="6">Nudge Settings</Heading>
				</div>

				<SettingsForm
					companyId={companyId}
					initialValues={initialValues}
					initialTrackedCount={memberRows.length}
				/>
			</div>
		</div>
	);
}
