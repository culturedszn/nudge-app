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

			{hasSettings ? (
				<div className="mx-auto mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row">
					<Button asChild size="3" className="w-full">
						<Link href={`/log/${companyId}`}>
						View sent nudges
						</Link>
					</Button>
					<Button asChild size="3" variant="surface" className="w-full">
						<Link href={`/settings/${companyId}`}>
						Edit settings
						</Link>
					</Button>
				</div>
			) : (
				<Button asChild size="3" color="orange" className="mx-auto mt-9 w-full max-w-[400px]">
					<Link href={`/settings/${companyId}?${query}`}>Set up Nudge</Link>
				</Button>
			)}
		</div>
	);
}
