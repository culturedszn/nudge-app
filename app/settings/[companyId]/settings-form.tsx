"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SettingsRow } from "@/lib/supabase";

type FormState = Pick<
	SettingsRow,
	| "inactive_days"
	| "inactive_message"
	| "inactive_enabled"
	| "cancel_message"
	| "cancel_enabled"
	| "payment_message"
	| "payment_enabled"
>;

export function SettingsForm({
	companyId,
	initialValues,
	initialTrackedCount,
}: {
	companyId: string;
	initialValues: FormState;
	initialTrackedCount: number;
}) {
	const router = useRouter();
	const [values, setValues] = useState<FormState>(initialValues);
	const [isSaving, setIsSaving] = useState(false);
	const [isSyncing, setIsSyncing] = useState(true);
	const [trackedCount, setTrackedCount] = useState(initialTrackedCount);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;
		async function syncMembers() {
			try {
				const response = await fetch("/api/sync-members", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ company_id: companyId }),
				});
				if (!response.ok) {
					throw new Error("Unable to sync members");
				}

				const result = (await response.json()) as { synced_count?: number };
				if (isMounted && typeof result.synced_count === "number") {
					setTrackedCount((prev) => Math.max(prev, result.synced_count ?? prev));
				}
			} catch (syncError) {
				console.error(syncError);
			} finally {
				if (isMounted) {
					setIsSyncing(false);
				}
			}
		}

		syncMembers();
		return () => {
			isMounted = false;
		};
	}, [companyId]);

	const inactiveCount = useMemo(
		() => values.inactive_message.trim().length,
		[values.inactive_message],
	);
	const cancelCount = useMemo(
		() => values.cancel_message.trim().length,
		[values.cancel_message],
	);
	const paymentCount = useMemo(
		() => values.payment_message.trim().length,
		[values.payment_message],
	);

	async function saveSettings() {
		setIsSaving(true);
		setError(null);
		try {
			const response = await fetch("/api/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ company_id: companyId, ...values }),
			});

			if (!response.ok) {
				throw new Error("Unable to save settings");
			}

			router.push(`/log/${companyId}`);
			router.refresh();
		} catch (saveError) {
			console.error(saveError);
			setError("Could not save your settings. Please try again.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="space-y-5">
			<TriggerCard
				title="💤 Inactive Members"
				description="Sent when a member hasn't been active for a while"
				enabled={values.inactive_enabled}
				onToggle={(enabled) =>
					setValues((prev) => ({ ...prev, inactive_enabled: enabled }))
				}
			>
				<div className="space-y-2">
					<label className="text-sm font-medium text-[#111827]">Send after</label>
					<select
						value={values.inactive_days}
						onChange={(event) =>
							setValues((prev) => ({
								...prev,
								inactive_days: Number(event.target.value),
							}))
						}
						className="h-11 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827] outline-none focus:border-[#9ca3af]"
					>
						<option value={3}>3 days</option>
						<option value={7}>7 days</option>
						<option value={14}>14 days</option>
						<option value={30}>30 days</option>
					</select>
				</div>
				<MessageField
					label="Message"
					value={values.inactive_message}
					onChange={(next) =>
						setValues((prev) => ({ ...prev, inactive_message: next.slice(0, 160) }))
					}
					placeholder="Hey [username], we miss you! Come check out what's new..."
					count={inactiveCount}
				/>
			</TriggerCard>

			<TriggerCard
				title="🚨 Canceling Members"
				description="Sent when a member has scheduled their cancellation but is still subscribed - your last chance to save them"
				enabled={values.cancel_enabled}
				onToggle={(enabled) =>
					setValues((prev) => ({ ...prev, cancel_enabled: enabled }))
				}
			>
				<MessageField
					label="Message"
					value={values.cancel_message}
					onChange={(next) =>
						setValues((prev) => ({ ...prev, cancel_message: next.slice(0, 160) }))
					}
					placeholder="Hey [username], we noticed you're leaving. We'd hate to see you go - reply here and let us know how we can help."
					count={cancelCount}
				/>
			</TriggerCard>

			<TriggerCard
				title="💳 Failed Payments"
				description="Sent when a member's payment fails - many don't even know their card declined"
				enabled={values.payment_enabled}
				onToggle={(enabled) =>
					setValues((prev) => ({ ...prev, payment_enabled: enabled }))
				}
			>
				<MessageField
					label="Message"
					value={values.payment_message}
					onChange={(next) =>
						setValues((prev) => ({ ...prev, payment_message: next.slice(0, 160) }))
					}
					placeholder="Hey [username], your payment didn't go through. Update your billing here: [billing link] so you don't lose access."
					count={paymentCount}
				/>
			</TriggerCard>

			<p className="text-sm text-[#6b7280]">
				{isSyncing ? "Syncing members..." : `${trackedCount} members currently being tracked`}
			</p>

			{error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}

			<button
				type="button"
				onClick={saveSettings}
				disabled={isSaving}
				className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#f97316] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-70"
			>
				{isSaving ? "Saving..." : "Save & Activate Nudge"}
			</button>
		</div>
	);
}

function TriggerCard({
	title,
	description,
	enabled,
	onToggle,
	children,
}: {
	title: string;
	description: string;
	enabled: boolean;
	onToggle: (value: boolean) => void;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 md:p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
					<p className="mt-1 text-sm text-[#6b7280]">{description}</p>
				</div>
				<Toggle checked={enabled} onChange={onToggle} />
			</div>
			<div className="mt-5 space-y-4">{children}</div>
		</section>
	);
}

function MessageField({
	label,
	value,
	onChange,
	placeholder,
	count,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	count: number;
}) {
	return (
		<div className="space-y-2">
			<label className="text-sm font-medium text-[#111827]">{label}</label>
			<textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				rows={4}
				className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm text-[#111827] outline-none focus:border-[#9ca3af]"
			/>
			<p className="text-xs text-[#9ca3af]">{count}/160</p>
		</div>
	);
}

function Toggle({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(!checked)}
			className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
				checked ? "bg-[#f97316]" : "bg-[#d1d5db]"
			}`}
		>
			<span
				className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
					checked ? "translate-x-5" : "translate-x-1"
				}`}
			/>
		</button>
	);
}
