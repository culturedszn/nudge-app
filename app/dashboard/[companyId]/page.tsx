import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@whop/react/components";
import { type SettingsRow, supabaseRequest } from "@/lib/supabase";
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

	if (hasSettings) {
		redirect(`/home/${companyId}`);
	}

	return (
		<div className="relative min-h-screen overflow-hidden bg-[#f2f4f6] px-4 py-10">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[#FA4616]/18 blur-3xl" />
				<div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[#0f172a]/8 blur-3xl" />
			</div>

			<div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[540px] items-center justify-center">
				<div className="w-full rounded-[28px] border border-white/80 bg-white/75 p-7 text-center shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-9">
					<div className="mx-auto h-[210px] w-auto">
						<Image
							src="/whop-illo-telescope.svg"
							alt="Telescope illustration"
							width={240}
							height={210}
							className="h-full w-full object-contain"
							priority
						/>
					</div>

					<h1 className="mt-5 text-[30px] font-semibold tracking-[-0.02em] text-[#0f172a]">
						Never lose a member again.
					</h1>
					<p className="mx-auto mt-3 max-w-[390px] text-[15px] leading-[1.65] text-[#526070]">
						Nudge automatically re-engages inactive members, saves canceling subscribers,
						and recovers failed payments. Set it up once, then let it run in the
						background.
					</p>
					<Button
						asChild
						size="3"
						className="mt-8 h-12 w-full rounded-xl bg-[#FA4616] text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(250,70,22,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-95"
					>
						<Link href={`/settings/${companyId}`}>Set up Nudge</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
