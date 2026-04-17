-- Enable extension for UUID generation
create extension if not exists pgcrypto;

create table if not exists public.members (
	id text primary key,
	company_id text not null,
	username text not null,
	last_active_at timestamptz,
	joined_at timestamptz,
	membership_status text not null check (membership_status in ('active', 'past_due', 'canceled', 'paused')),
	cancel_at_period_end boolean not null default false,
	cancellation_reason text,
	nudge_sent_at timestamptz,
	cancel_nudge_sent_at timestamptz,
	payment_nudge_sent_at timestamptz,
	created_at timestamptz not null default now()
);

create index if not exists idx_members_company_id on public.members(company_id);
create index if not exists idx_members_status on public.members(membership_status);
create index if not exists idx_members_last_active on public.members(last_active_at);
create index if not exists idx_members_cancel_period on public.members(cancel_at_period_end);

create table if not exists public.settings (
	company_id text primary key,
	inactive_days integer not null default 7,
	inactive_message text not null,
	inactive_enabled boolean not null default true,
	cancel_message text not null,
	cancel_enabled boolean not null default true,
	payment_message text not null,
	payment_enabled boolean not null default true,
	created_at timestamptz not null default now(),
	check (inactive_days in (3, 7, 14, 30))
);

create table if not exists public.nudge_log (
	id uuid primary key default gen_random_uuid(),
	company_id text not null,
	member_id text not null,
	username text not null,
	trigger_type text not null check (trigger_type in ('inactive', 'canceling', 'payment_failed')),
	message_sent text not null,
	sent_at timestamptz not null default now()
);

create index if not exists idx_nudge_log_company_sent_at on public.nudge_log(company_id, sent_at desc);
create index if not exists idx_nudge_log_member_id on public.nudge_log(member_id);
