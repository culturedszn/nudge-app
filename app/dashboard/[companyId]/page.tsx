import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
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

	return (
		<div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f5f5f5] px-4 py-10 text-center md:px-6 md:py-16">
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

			<h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
				Never lose a member again.
			</h1>
			<p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-[#6b7280] md:text-base">
				Nudge automatically re-engages inactive members, saves canceling
				subscribers, and recovers failed payments. Set it up once. Let it run.
			</p>

			{hasSettings ? (
				<div className="mx-auto mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row">
					<Link
						href={`/log/${companyId}`}
						className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
					>
						View sent nudges
					</Link>
					<Link
						href={`/settings/${companyId}`}
						className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#e5e7eb] px-4 text-sm font-semibold text-[#1f2937] transition hover:bg-[#d1d5db]"
					>
						Edit settings
					</Link>
				</div>
			) : (
				<Link
					href={`/settings/${companyId}?${query}`}
					className="mx-auto mt-9 inline-flex h-12 w-full max-w-[400px] items-center justify-center rounded-xl bg-[#f97316] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea580c]"
				>
					Set up Nudge
				</Link>
			)}
		</div>
	);
}
