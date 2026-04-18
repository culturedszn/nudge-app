"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Button,
	Card,
	Heading,
	Select,
	Spinner,
	Switch,
	Text,
	TextArea,
} from "@whop/react/components";
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
					<Text size="2" weight="medium">
						Send after
					</Text>
					<Select.Root
						value={String(values.inactive_days)}
						onValueChange={(nextValue) =>
							setValues((prev) => ({
								...prev,
								inactive_days: Number(nextValue),
							}))
						}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="3">3 days</Select.Item>
							<Select.Item value="7">7 days</Select.Item>
							<Select.Item value="14">14 days</Select.Item>
							<Select.Item value="30">30 days</Select.Item>
						</Select.Content>
					</Select.Root>
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

			{isSyncing ? (
				<Text color="gray" size="2" className="inline-flex items-center gap-2">
					<Spinner loading size="1" />
					Syncing members...
				</Text>
			) : (
				<Text color="gray" size="2">
					{`${trackedCount} members currently being tracked`}
				</Text>
			)}

			{error ? (
				<Text size="2" color="red">
					{error}
				</Text>
			) : null}

			<Button
				type="button"
				onClick={saveSettings}
				disabled={isSaving}
				size="3"
				color="orange"
				style={{ width: "100%" }}
			>
				<Spinner loading={isSaving} size="1">
					{isSaving ? "Saving..." : "Save & Activate Nudge"}
				</Spinner>
			</Button>
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
		<Card style={{ padding: "1.25rem" }}>
			<div className="flex items-start justify-between gap-4">
				<div>
					<Heading size="3">{title}</Heading>
					<Text size="2" color="gray" className="mt-1">
						{description}
					</Text>
				</div>
				<Switch checked={enabled} onCheckedChange={onToggle} />
			</div>
			<div className="mt-5 space-y-4">{children}</div>
		</Card>
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
			<Text size="2" weight="medium">
				{label}
			</Text>
			<TextArea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				maxLength={160}
				rows={4}
			/>
			<Text size="1" color="gray">
				{count}/160
			</Text>
		</div>
	);
}
