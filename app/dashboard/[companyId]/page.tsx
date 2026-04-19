import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Button, Heading, Text } from "@whop/react/components";
import { DEFAULT_SETTINGS, type SettingsRow, supabaseRequest } from "@/lib/supabase";
import { whopsdk } from "@/lib/whop-sdk";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	await whopsdk.verifyUserToken(await headers());

	const settings = await supabaseRequest<SettingsRow[]>({
		table: "settings",
		query: {
			company_id: `eq.${companyId}`,
			select: "company_id",
			limit: 1,
		},
	});

	const hasSettings = settings.length > 0;
	const settingsState = hasSettings
		? await supabaseRequest<SettingsRow[]>({
				table: "settings",
				query: {
					company_id: `eq.${companyId}`,
					limit: 1,
				},
		  })
		: [];
	const activeSettings = settingsState[0];
	const query = new URLSearchParams({
		companyId,
		...(!hasSettings
			? {
					inactive_days: String(DEFAULT_SETTINGS.inactive_days ?? 7),
					inactive_message: DEFAULT_SETTINGS.inactive_message ?? "",
					inactive_enabled: String(DEFAULT_SETTINGS.inactive_enabled ?? true),
					cancel_message: DEFAULT_SETTINGS.cancel_message ?? "",
					cancel_enabled: String(DEFAULT_SETTINGS.cancel_enabled ?? true),
					payment_message: DEFAULT_SETTINGS.payment_message ?? "",
					payment_enabled: String(DEFAULT_SETTINGS.payment_enabled ?? true),
			  }
			: {}),
	}).toString();

	if (hasSettings) {
		return (
			<div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#f5f5f5] px-4 py-10 text-center">
				<Image
					src="/thumbsup.svg"
					alt="Thumbs up illustration"
					width={180}
					height={180}
					className="h-[180px] w-auto"
					priority
				/>

				<h1 className="mt-6 text-[28px] font-bold text-[#111111]">Nudge is running.</h1>
				<p className="mt-3 max-w-[380px] text-center text-[15px] leading-[1.6] text-[#666666]">
					We&apos;re watching your members in the background. You&apos;ll never lose one without a
					fight.
				</p>

				<div className="mt-8 flex items-center justify-center gap-3">
					<div
						className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium"
						style={{ border: "1.5px solid #eee" }}
					>
						<span>💤 Inactive</span>
						<span
							style={{ color: activeSettings?.inactive_enabled ? "#22c55e" : "#9ca3af" }}
						>
							{activeSettings?.inactive_enabled ? "Active" : "Off"}
						</span>
					</div>
					<div
						className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium"
						style={{ border: "1.5px solid #eee" }}
					>
						<span>🚨 Canceling</span>
						<span
							style={{ color: activeSettings?.cancel_enabled ? "#22c55e" : "#9ca3af" }}
						>
							{activeSettings?.cancel_enabled ? "Active" : "Off"}
						</span>
					</div>
					<div
						className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium"
						style={{ border: "1.5px solid #eee" }}
					>
						<span>💳 Payments</span>
						<span
							style={{ color: activeSettings?.payment_enabled ? "#22c55e" : "#9ca3af" }}
						>
							{activeSettings?.payment_enabled ? "Active" : "Off"}
						</span>
					</div>
				</div>

				<div className="mt-10 flex w-full max-w-[380px] flex-col gap-3">
					<Button
						asChild
						size="3"
						className="w-full"
						style={{
							height: "48px",
							borderRadius: "10px",
							border: "none",
							backgroundColor: "#FA4616",
							color: "white",
							fontSize: "15px",
							fontWeight: 600,
						}}
					>
						<Link href={`/log/${companyId}`}>View sent nudges</Link>
					</Button>
					<Button
						asChild
						size="3"
						className="w-full"
						style={{
							height: "48px",
							borderRadius: "10px",
							border: "1.5px solid #FA4616",
							backgroundColor: "transparent",
							color: "#FA4616",
							fontSize: "15px",
							fontWeight: 600,
						}}
					>
						<Link href={`/settings/${companyId}`}>Edit settings</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 text-center md:px-6 md:py-16">
			<div className="mx-auto mb-7 h-[182px] w-[182px] md:h-[220px] md:w-[220px]">
				<Image
					src="/whop-illo-telescope.svg"
					alt="Telescope illustration"
					width={220}
					height={220}
					className="h-full w-full object-contain"
					priority
				/>
			</div>

			<Heading size="6">
				Never lose a member again.
			</Heading>
			<Text color="gray" className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 md:text-base">
				Nudge automatically re-engages inactive members, saves canceling
				subscribers, and recovers failed payments. Set it up once. Let it run.
			</Text>

			<Button asChild size="3" className="mx-auto mt-9 w-full max-w-[400px]" style={{ backgroundColor: "#FA4616", color: "white" }}>
				<Link href={`/settings/${companyId}?${query}`}>Set up Nudge</Link>
			</Button>
		</div>
	);
}
