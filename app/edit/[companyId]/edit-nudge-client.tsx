"use client";

import Link from "next/link";
import { type ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Heading, Select, Switch, Text, TextArea } from "@whop/react/components";
import { Toast } from "@/components/toast";
import type { SettingsRow } from "@/lib/supabase";

type Trigger = "inactive" | "canceling" | "payment";

export function EditNudgeClient({
	companyId,
	trigger,
	settings,
}: {
	companyId: string;
	trigger: Trigger;
	settings: SettingsRow | null;
}) {
	const router = useRouter();
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastType, setToastType] = useState<"success" | "error">("success");
	const [toastMessage, setToastMessage] = useState("");

	const [inactiveDays, setInactiveDays] = useState<number>(settings?.inactive_days ?? 7);
	const [inactiveEnabled, setInactiveEnabled] = useState<boolean>(Boolean(settings?.inactive_enabled));
	const [inactiveMessage, setInactiveMessage] = useState<string>(settings?.inactive_message ?? "");

	const [cancelEnabled, setCancelEnabled] = useState<boolean>(Boolean(settings?.cancel_enabled));
	const [cancelMessage, setCancelMessage] = useState<string>(settings?.cancel_message ?? "");

	const [paymentEnabled, setPaymentEnabled] = useState<boolean>(Boolean(settings?.payment_enabled));
	const [paymentMessage, setPaymentMessage] = useState<string>(settings?.payment_message ?? "");

	const triggerConfig = useMemo(() => {
		if (trigger === "inactive") {
			return {
				title: "💤 Inactive Members",
				enabled: inactiveEnabled,
				message: inactiveMessage,
				count: inactiveMessage.trim().length,
			};
		}
		if (trigger === "canceling") {
			return {
				title: "🚨 Canceling Members",
				enabled: cancelEnabled,
				message: cancelMessage,
				count: cancelMessage.trim().length,
			};
		}
		return {
			title: "💳 Failed Payments",
			enabled: paymentEnabled,
			message: paymentMessage,
			count: paymentMessage.trim().length,
		};
	}, [trigger, inactiveEnabled, inactiveMessage, cancelEnabled, cancelMessage, paymentEnabled, paymentMessage]);

	function showError(message: string) {
		setToastType("error");
		setToastMessage(message);
		setToastVisible(true);
	}

	async function saveChanges() {
		setIsSaving(true);
		try {
			const body: Record<string, unknown> = { company_id: companyId };
			if (trigger === "inactive") {
				body.inactive_enabled = inactiveEnabled;
				body.inactive_days = inactiveDays;
				body.inactive_message = inactiveMessage;
			}
			if (trigger === "canceling") {
				body.cancel_enabled = cancelEnabled;
				body.cancel_message = cancelMessage;
			}
			if (trigger === "payment") {
				body.payment_enabled = paymentEnabled;
				body.payment_message = paymentMessage;
			}

			const response = await fetch("/api/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (!response.ok) throw new Error("Failed to save");

			router.push(`/home/${companyId}?toast=updated`);
			router.refresh();
		} catch (error) {
			console.error(error);
			showError("Unable to save changes");
		} finally {
			setIsSaving(false);
		}
	}

	async function deleteNudge() {
		setIsDeleting(true);
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
			if (!response.ok) throw new Error("Failed to delete");

			router.push(`/home/${companyId}?toast=deleted`);
			router.refresh();
		} catch (error) {
			console.error(error);
			showError("Unable to delete nudge");
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#f5f5f5] px-4 py-6 md:px-6 md:py-8">
			<Toast message={toastMessage} type={toastType} visible={toastVisible} />

			<div className="mx-auto w-full max-w-2xl">
				<div className="mb-6 flex items-center gap-3">
					<Button asChild size="2" className="gap-1.5 rounded-full border border-zinc-300 bg-white px-3 text-zinc-700">
						<Link href={`/home/${companyId}`}>← Back</Link>
					</Button>
					<Heading size="6" className="text-[20px] font-bold">Edit Nudge</Heading>
				</div>

				<Card className="rounded-[14px] bg-white p-5 [box-shadow:0_1px_4px_rgba(0,0,0,0.07)]">
					<div className="flex items-start justify-between gap-3">
						<Heading size="4">{triggerConfig.title}</Heading>
						<Switch
							checked={triggerConfig.enabled}
							onCheckedChange={(next: boolean) => {
								if (trigger === "inactive") setInactiveEnabled(next);
								if (trigger === "canceling") setCancelEnabled(next);
								if (trigger === "payment") setPaymentEnabled(next);
							}}
						/>
					</div>

					{trigger === "inactive" ? (
						<div className="mt-4">
							<Text className="mb-2 text-[13px] font-medium text-zinc-600">Send after</Text>
							<Select.Root value={String(inactiveDays)} onValueChange={(value: string) => setInactiveDays(Number(value))}>
								<Select.Trigger />
								<Select.Content>
									<Select.Item value="3">3 days</Select.Item>
									<Select.Item value="7">7 days</Select.Item>
									<Select.Item value="14">14 days</Select.Item>
									<Select.Item value="30">30 days</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
					) : null}

					<div className="mt-4">
						<Text className="mb-2 text-[13px] font-medium text-zinc-600">Message</Text>
						<TextArea
							rows={4}
							maxLength={160}
							value={trigger === "inactive" ? inactiveMessage : trigger === "canceling" ? cancelMessage : paymentMessage}
							onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
								const next = event.target.value.slice(0, 160);
								if (trigger === "inactive") setInactiveMessage(next);
								if (trigger === "canceling") setCancelMessage(next);
								if (trigger === "payment") setPaymentMessage(next);
							}}
						/>
						<Text className="mt-1 text-[12px] text-zinc-500">{triggerConfig.count}/160</Text>
					</div>
				</Card>

				<div className="mt-5 flex flex-col gap-2">
					<Button
						type="button"
						onClick={() => void saveChanges()}
						disabled={isSaving}
						className="h-12 w-full rounded-[10px] bg-[#FA4616] text-[15px] font-semibold text-white"
					>
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>

					<Button
						type="button"
						variant="ghost"
						onClick={() => setConfirmDelete((prev) => !prev)}
						className="mx-auto text-[13px] text-[#ef4444]"
					>
						Delete this nudge
					</Button>
				</div>

				{confirmDelete ? (
					<div className="mt-3 rounded-xl border border-[#fecaca] bg-[#fff5f5] p-3">
						<Text className="text-[13px] text-[#991b1b]">
							Are you sure? This will stop this nudge permanently.
						</Text>
						<div className="mt-3 flex gap-2">
							<Button type="button" variant="soft" className="h-8 border border-zinc-300 text-xs" onClick={() => setConfirmDelete(false)}>
								Cancel
							</Button>
							<Button type="button" className="h-8 bg-[#ef4444] text-xs text-white" onClick={() => void deleteNudge()} disabled={isDeleting}>
								{isDeleting ? "Deleting..." : "Delete"}
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
