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
				<div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#FA4616]/22 blur-3xl" />
				<div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-[#0f172a]/10 blur-3xl" />
				<div className="absolute bottom-0 left-1/2 h-64 w-[90%] -translate-x-1/2 rounded-full bg-white/35 blur-3xl" />
			</div>

			<div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[760px] flex-col items-center justify-center text-center">
				<div className="inline-flex items-center rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[12px] font-semibold tracking-[0.08em] text-[#334155] backdrop-blur-sm">
					WELCOME TO NUDGE
				</div>

				<div className="mt-6 rounded-[26px] border border-white/70 bg-white/30 p-5 backdrop-blur-md sm:p-7">
					<div className="mx-auto h-[220px] w-auto sm:h-[250px]">
						<Image
							src="/whop-illo-telescope.svg"
							alt="Telescope illustration"
							width={290}
							height={250}
							className="h-full w-full object-contain"
							priority
						/>
					</div>
				</div>

				<h1 className="mt-8 max-w-[640px] text-[34px] font-semibold tracking-[-0.03em] text-[#0f172a] sm:text-[44px]">
					Turn churn into second chances.
				</h1>
				<p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.7] text-[#526070]">
					Nudge gently reaches out to inactive members, canceling subscribers, and
					failed payments so you recover revenue automatically while staying focused
					on your community.
				</p>

				<Button
					asChild
					size="3"
					className="mt-9 h-12 w-full max-w-[360px] rounded-xl bg-[#FA4616] text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(250,70,22,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-95"
				>
					<Link href={`/settings/${companyId}`}>Set up Nudge</Link>
				</Button>
			</div>
		</div>
	);
}
