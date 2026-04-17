import { NextRequest, NextResponse } from "next/server";
import { type MembershipStatus, upsertRows } from "@/lib/supabase";
import { whopsdk } from "@/lib/whop-sdk";

interface WhopMemberLike {
	id?: string;
	username?: string;
	user?: { username?: string };
	most_recent_action_at?: string | null;
	last_active_at?: string | null;
	joined_at?: string | null;
	created_at?: string | null;
	membership_status?: MembershipStatus;
	status?: MembershipStatus;
	cancel_at_period_end?: boolean;
	cancellation_reason?: string | null;
}

function getMembersFromResponse(payload: any): WhopMemberLike[] {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.data)) return payload.data;
	if (Array.isArray(payload?.members)) return payload.members;
	if (Array.isArray(payload?.results)) return payload.results;
	return [];
}

function getNextCursor(payload: any): string | null {
	return (
		payload?.next_cursor ??
		payload?.nextCursor ??
		payload?.cursor ??
		payload?.pagination?.next_cursor ??
		null
	);
}

function hasMoreResults(payload: any, nextCursor: string | null): boolean {
	if (typeof payload?.has_more === "boolean") return payload.has_more;
	if (typeof payload?.hasMore === "boolean") return payload.hasMore;
	return Boolean(nextCursor);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		const body = (await request.json()) as { company_id?: string };
		const companyId = body.company_id;

		if (!companyId) {
			return NextResponse.json({ error: "company_id is required" }, { status: 400 });
		}

		let cursor: string | null = null;
		let hasMore = true;
		let totalSynced = 0;

		while (hasMore) {
			const response = await whopsdk.members.list({
				company_id: companyId,
				...(cursor ? { next_cursor: cursor } : {}),
			} as never);

			const members = getMembersFromResponse(response);
			if (members.length > 0) {
				await upsertRows({
					table: "members",
					onConflict: "id",
					rows: members
						.filter((member) => Boolean(member.id))
						.map((member) => ({
							id: member.id,
							company_id: companyId,
							username: member.user?.username ?? member.username ?? "member",
							last_active_at:
								member.most_recent_action_at ?? member.last_active_at ?? null,
							joined_at: member.joined_at ?? member.created_at ?? null,
							membership_status:
								member.membership_status ?? member.status ?? "active",
							cancel_at_period_end: Boolean(member.cancel_at_period_end),
							cancellation_reason: member.cancellation_reason ?? null,
						})),
				});
				totalSynced += members.length;
			}

			const nextCursor = getNextCursor(response);
			hasMore = hasMoreResults(response, nextCursor);
			cursor = nextCursor;

			if (hasMore && !cursor) {
				break;
			}
		}

		return NextResponse.json(
			{ ok: true, synced_count: totalSynced },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Failed syncing members", error);
		return NextResponse.json(
			{ error: "Failed syncing members" },
			{ status: 500 },
		);
	}
}
