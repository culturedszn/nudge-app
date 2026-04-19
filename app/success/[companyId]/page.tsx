import Image from "next/image";
import Link from "next/link";
import { Button } from "@whop/react/components";

export default async function SuccessPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

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
			<p className="mt-3 max-w-[360px] text-[15px] leading-[1.6] text-[#666666]">
				We&apos;re watching your members in the background. You&apos;ll never lose one without a
				fight.
			</p>

			<Button
				asChild
				size="3"
				className="mt-8 h-12 w-full max-w-[360px] rounded-[10px] bg-[#FA4616] text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-95"
			>
				<Link href={`/home/${companyId}`}>Go to Dashboard</Link>
			</Button>
		</div>
	);
}
