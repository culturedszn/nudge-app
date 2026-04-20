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
		<div className="relative min-h-screen overflow-hidden bg-[#f2f4f6] px-4 py-6 md:px-6 md:py-8">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-[#FA4616]/14 blur-3xl" />
				<div className="absolute -right-16 bottom-12 h-64 w-64 rounded-full bg-[#0f172a]/7 blur-3xl" />
			</div>
			<div className="relative mx-auto w-full max-w-3xl">
				<div className="mb-6 rounded-[20px] border border-white/80 bg-white/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.1)] backdrop-blur-xl md:p-5">
					<div className="flex items-center gap-3">
					<Button
						asChild
						size="2"
						className="gap-1.5 rounded-full border border-white/70 bg-white/75 px-3 text-[#334155] shadow-[0_8px_20px_rgba(15,23,42,0.08)] backdrop-blur-md"
					>
						<Link href={`/dashboard/${companyId}`}>
							<span aria-hidden="true">←</span>
							<span>Back</span>
						</Link>
					</Button>
					<Heading size="6" className="text-[22px] font-semibold tracking-[-0.02em] text-[#0f172a]">
						Nudge Settings
					</Heading>
					</div>
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
