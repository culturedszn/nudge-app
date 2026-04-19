"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Card, Heading, Text } from "@whop/react/components";
import { Toast } from "@/components/toast";
import type { SettingsRow } from "@/lib/supabase";

type TriggerKey = "inactive" | "canceling" | "payment";

type TriggerCardState = {
	key: TriggerKey;
	icon: string;
	title: string;
	message: string;
	enabled: boolean;
	days?: number | null;
};

function truncateMessage(message: string, max = 80): string {
	if (message.length <= max) return message;
	return `${message.slice(0, max).trimEnd()}...`;
}

export function HomeDashboardClient({
	companyId,
	initialSettings,
	initialToast,
}: {
	companyId: string;
	initialSettings: SettingsRow | null;
	initialToast?: string;
}) {
	const [settings, setSettings] = useState<SettingsRow | null>(initialSettings);
	const [deletedCards, setDeletedCards] = useState<Set<TriggerKey>>(new Set());
	const [confirmingDelete, setConfirmingDelete] = useState<TriggerKey | null>(null);
	const [isDeleting, setIsDeleting] = useState<TriggerKey | null>(null);
	const [toastState, setToastState] = useState<{
		visible: boolean;
		type: "success" | "error";
		message: string;
	}>(() => {
		if (initialToast === "updated") {
			return {
				visible: true,
				type: "success",
				message: "✓ Nudge updated successfully",
			};
		}
		if (initialToast === "deleted") {
			return {
				visible: true,
				type: "success",
				message: "Nudge deleted",
			};
		}
		return {
			visible: false,
			type: "success",
			message: "",
		};
	});

	const cards = useMemo<TriggerCardState[]>(() => {
		if (!settings) return [];
		const nextCards: TriggerCardState[] = [
			{
				key: "inactive",
				icon: "💤",
				title: "Inactive Members",
				message: settings.inactive_message ?? "",
				enabled: Boolean(settings.inactive_enabled),
				days: settings.inactive_days,
			},
			{
				key: "canceling",
				icon: "🚨",
				title: "Canceling Members",
				message: settings.cancel_message ?? "",
				enabled: Boolean(settings.cancel_enabled),
			},
			{
				key: "payment",
				icon: "💳",
				title: "Failed Payments",
				message: settings.payment_message ?? "",
				enabled: Boolean(settings.payment_enabled),
			},
		];

		return nextCards.filter((card) => !deletedCards.has(card.key));
	}, [settings, deletedCards]);

	const allPaused = cards.length > 0 && cards.every((card) => !card.enabled);

	async function deleteTrigger(trigger: TriggerKey) {
		setIsDeleting(trigger);
		try {
			const body: Record<string, unknown> = { company_id: companyId };
			if (trigger === "inactive") {
				body.inactive_enabled = false;
				body.inactive_message = null;
				body.inactive_days = null;
			}
			if (trigger === "canceling") {
				body.cancel_enabled = false;
				body.cancel_message = null;
			}
			if (trigger === "payment") {
				body.payment_enabled = false;
				body.payment_message = null;
			}

			const response = await fetch("/api/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error("Failed to delete nudge");
			}

			setSettings((prev) => {
				if (!prev) return prev;
				if (trigger === "inactive") {
					return {
						...prev,
						inactive_enabled: false,
						inactive_message: "",
						inactive_days: null as unknown as number,
					};
				}
				if (trigger === "canceling") {
					return {
						...prev,
						cancel_enabled: false,
						cancel_message: "",
					};
				}
				return {
					...prev,
					payment_enabled: false,
					payment_message: "",
				};
			});

			setToastState({ visible: true, type: "success", message: "Nudge deleted" });
			setDeletedCards((prev) => {
				const next = new Set(prev);
				next.add(trigger);
				return next;
			});
			setConfirmingDelete(null);
		} catch (error) {
			console.error(error);
			setToastState({ visible: true, type: "error", message: "Failed to delete nudge" });
		} finally {
			setIsDeleting(null);
		}
	}

	return (
		<div className="min-h-screen bg-[#f5f5f5] pb-10">
			<Toast
				message={toastState.message}
				type={toastState.type}
				visible={toastState.visible}
			/>

			<div className="flex items-start justify-between px-6 pb-0 pt-6">
				<div>
					<Heading size="6" className="text-[22px] font-bold text-[#111111]">
						Nudge
					</Heading>
					<Text className="mt-1 text-[13px] text-[#888888]">Your retention is on autopilot.</Text>
				</div>
				<Button asChild variant="ghost" className="text-[13px] font-medium text-[#FA4616]">
					<Link href={`/log/${companyId}`}>View sent nudges →</Link>
				</Button>
			</div>

			<Text className="px-6 pb-3 pt-6 text-[13px] font-semibold uppercase tracking-[0.5px] text-[#888888]">
				Active Nudges
			</Text>

			<div className="space-y-3 px-4">
				{cards.map((card) => (
					<Card
						key={card.key}
						className="rounded-[14px] bg-white p-[18px] [box-shadow:0_1px_4px_rgba(0,0,0,0.07)]"
					>
						{confirmingDelete === card.key ? (
							<div>
								<Text className="text-[14px] text-[#111111]">Delete this nudge?</Text>
								<div className="mt-3 flex gap-2">
									<Button
										type="button"
										variant="soft"
										onClick={() => setConfirmingDelete(null)}
										className="h-8 rounded-md border border-zinc-300 px-3 text-xs text-zinc-700"
									>
										Cancel
									</Button>
									<Button
										type="button"
										onClick={() => void deleteTrigger(card.key)}
										disabled={isDeleting === card.key}
										className="h-8 rounded-md bg-[#ef4444] px-3 text-xs font-medium text-white"
									>
										Delete
									</Button>
								</div>
							</div>
						) : (
							<>
								<div className="flex items-start justify-between gap-3">
									<div className="flex items-center gap-2 text-[15px] font-semibold text-[#111111]">
										<span>{card.icon}</span>
										<span>{card.title}</span>
									</div>
									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="ghost"
											className="h-7 w-7 min-w-7 p-0 text-[#888888] transition-colors duration-200 hover:text-[#FA4616]"
											asChild
										>
											<Link href={`/edit/${companyId}?trigger=${card.key}`}>✎</Link>
										</Button>
										<Button
											type="button"
											variant="ghost"
											className="h-7 w-7 min-w-7 p-0 text-[#888888] transition-colors duration-200 hover:text-[#ef4444]"
											onClick={() => setConfirmingDelete(card.key)}
										>
											🗑
										</Button>
									</div>
								</div>

								<div className="mt-2 rounded-lg bg-[#f9f9f9] px-3 py-2.5 text-left">
									<Text className="text-[13px] italic text-[#555555]">
										{card.message ? truncateMessage(card.message, 80) : "No message configured..."}
									</Text>
								</div>

								<div className="mt-2.5 flex items-center justify-between">
									<Text className="text-[12px] text-[#888888]">
										{card.key === "inactive" ? `Sends after ${card.days ?? "-"} days` : ""}
									</Text>
									<div className="flex items-center gap-1.5">
										<span
											className={[
												"h-2 w-2 rounded-full",
												card.enabled
													? "bg-[#22c55e] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
													: "bg-[#d1d5db]",
											].join(" ")}
										/>
										<Text
											className={card.enabled ? "text-[12px] font-medium text-[#22c55e]" : "text-[12px] text-[#9ca3af]"}
										>
											{card.enabled ? "Live" : "Paused"}
										</Text>
									</div>
								</div>
							</>
						)}
					</Card>
				))}
			</div>

			{allPaused ? (
				<div className="mx-4 mt-4 rounded-xl border border-[#fde8e0] bg-[#fff8f6] p-4">
					<Text className="text-center text-[13px] text-[#FA4616]">
						All nudges are paused. Edit a nudge to reactivate.
					</Text>
				</div>
			) : null}
		</div>
	);
}
