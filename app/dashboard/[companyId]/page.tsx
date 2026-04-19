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
		<div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#f5f5f5] px-4 py-10 text-center">
			<div className="mx-auto h-[200px] w-auto">
				<Image
					src="/telescope.svg"
					alt="Telescope illustration"
					width={200}
					height={200}
					className="h-full w-full object-contain"
					priority
				/>
			</div>

			<h1 className="mt-6 text-[28px] font-bold text-[#111111]">Never lose a member again.</h1>
			<p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-[1.6] text-[#666666]">
				Nudge automatically re-engages inactive members, saves canceling
				subscribers, and recovers failed payments. Set it up once. Let it run.
			</p>

			<Button
				asChild
				size="3"
				className="mt-8 h-12 w-full max-w-[360px] rounded-[10px] bg-[#FA4616] text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-95"
			>
				<Link href={`/settings/${companyId}`}>Set up Nudge</Link>
			</Button>
		</div>
	);
}
