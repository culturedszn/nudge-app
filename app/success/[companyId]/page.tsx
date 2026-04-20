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
		<div className="relative min-h-screen overflow-hidden bg-[#f2f4f6] px-4 py-10 text-center">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[#FA4616]/14 blur-2xl" />
				<div className="absolute -right-20 bottom-8 h-64 w-64 rounded-full bg-[#0f172a]/6 blur-2xl" />
			</div>

			<div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[540px] items-center justify-center">
				<div className="w-full rounded-[28px] border border-white/80 bg-white/80 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.14)] sm:p-9">
					<Image
						src="/thumbsup.svg"
						alt="Thumbs up illustration"
						width={180}
						height={180}
						className="mx-auto h-[180px] w-auto"
						priority
					/>

					<h1 className="mt-6 text-[30px] font-semibold tracking-[-0.02em] text-[#0f172a]">
						Nudge is running.
					</h1>
					<p className="mx-auto mt-3 max-w-[360px] text-[15px] leading-[1.65] text-[#526070]">
						We&apos;re watching your members in the background. You&apos;ll never lose one without a
						fight.
					</p>

					<Button
						asChild
						size="3"
						className="mt-8 h-12 w-full rounded-xl border border-white/40 bg-[linear-gradient(135deg,#ff6a3d,#FA4616)] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(250,70,22,0.34)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-95"
					>
						<Link href={`/home/${companyId}`}>Go to Dashboard</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
