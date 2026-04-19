"use client";

import { useEffect, useState } from "react";
import { Text } from "@whop/react/components";

type ToastType = "success" | "error";

export function Toast({
	message,
	type,
	visible,
}: {
	message: string;
	type: ToastType;
	visible: boolean;
}) {
	const [isShown, setIsShown] = useState(false);

	useEffect(() => {
		if (!visible) {
			setIsShown(false);
			return;
		}

		setIsShown(true);
		const timer = setTimeout(() => {
			setIsShown(false);
		}, 3000);

		return () => clearTimeout(timer);
	}, [visible]);

	return (
		<div
			className={[
				"pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 transition-all duration-300",
				isShown ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
			].join(" ")}
		>
			<div
				className={[
					"flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg",
					type === "success" ? "bg-[#16a34a] text-white" : "bg-[#dc2626] text-white",
				].join(" ")}
			>
				<Text className="text-white">{type === "success" ? "✓" : "✕"}</Text>
				<Text className="text-white" size="2" weight="medium">
					{message}
				</Text>
			</div>
		</div>
	);
}
