alter table public.opportunities
  add column if not exists service_type text default 'Mixed Opportunity',
  add column if not exists participant_count integer check (participant_count is null or participant_count >= 0),
  add column if not exists quoted_value numeric(12, 2) default 0,
  add column if not exists actual_value numeric(12, 2) default 0,
  add column if not exists probability integer check (probability is null or probability between 0 and 100),
  add column if not exists expected_value numeric(12, 2) default 0,
  add column if not exists close_likelihood text default 'Needs review',
  add column if not exists expected_close_date date,
  add column if not exists value_review_required boolean default true,
  add column if not exists value_estimate_source text default 'Needs Value Review';

create or replace function public.phase8b_probability_for_stage(opportunity_stage text)
returns integer
language sql
immutable
as $$
  select case opportunity_stage
    when 'Prospect Found' then 10
    when 'Outreach Sent' then 15
    when 'Contact Engaged' then 30
    when 'Information Requested' then 40
    when 'Quote Requested' then 55
    when 'Quote Sent' then 65
    when 'Follow-Up Due' then 60
    when 'Negotiation' then 75
    when 'Won' then 100
    when 'Lost' then 0
    when 'Dormant' then 5
    else 10
  end;
$$;

create or replace function public.phase8b_close_days_for_stage(opportunity_stage text)
returns integer
language sql
immutable
as $$
  select case opportunity_stage
    when 'Prospect Found' then 90
    when 'Outreach Sent' then 75
    when 'Contact Engaged' then 60
    when 'Information Requested' then 45
    when 'Quote Requested' then 30
    when 'Quote Sent' then 21
    when 'Follow-Up Due' then 14
    when 'Negotiation' then 14
    when 'Won' then 0
    else null
  end;
$$;

create or replace function public.phase8b_prepare_opportunity_revenue()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  close_days integer;
begin
  if new.probability is null
    or (tg_op = 'UPDATE' and new.stage is distinct from old.stage and new.probability is not distinct from old.probability)
  then
    new.probability := public.phase8b_probability_for_stage(new.stage);
  end if;

  new.expected_value := round(coalesce(new.estimated_value, 0) * coalesce(new.probability, 0) / 100.0, 2);
  new.value_review_required := coalesce(new.estimated_value, 0) <= 0;

  if new.expected_close_date is null
    or (tg_op = 'UPDATE' and new.stage is distinct from old.stage and new.expected_close_date is not distinct from old.expected_close_date)
  then
    close_days := public.phase8b_close_days_for_stage(new.stage);
    new.expected_close_date := case when close_days is null then null else current_date + close_days end;
  end if;

  new.close_likelihood := case
    when coalesce(new.probability, 0) >= 75 then 'High'
    when coalesce(new.probability, 0) >= 40 then 'Medium'
    when coalesce(new.probability, 0) > 0 then 'Low'
    else 'Closed'
  end;

  return new;
end;
$$;

drop trigger if exists phase8b_prepare_opportunity_revenue_trigger on public.opportunities;
create trigger phase8b_prepare_opportunity_revenue_trigger
before insert or update on public.opportunities
for each row execute function public.phase8b_prepare_opportunity_revenue();

update public.opportunities
set probability = coalesce(probability, public.phase8b_probability_for_stage(stage)),
    updated_at = updated_at;

create table if not exists public.opportunity_quotes (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  quote_reference text unique not null,
  quoted_value numeric(12, 2) not null default 0 check (quoted_value >= 0),
  quote_status text not null default 'Draft'
    check (quote_status in ('Draft', 'Sent', 'Awaiting Response', 'Accepted', 'Rejected', 'Expired')),
  sent_at timestamptz,
  expires_at date,
  follow_up_due date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists opportunity_quotes_opportunity_id_idx on public.opportunity_quotes(opportunity_id);
create index if not exists opportunity_quotes_status_idx on public.opportunity_quotes(quote_status);
create index if not exists opportunity_quotes_follow_up_due_idx on public.opportunity_quotes(follow_up_due);
create index if not exists opportunities_expected_close_date_idx on public.opportunities(expected_close_date);
create index if not exists opportunities_service_type_idx on public.opportunities(service_type);
create index if not exists opportunities_value_review_required_idx on public.opportunities(value_review_required) where value_review_required = true;

alter table public.opportunity_quotes enable row level security;
revoke all on table public.opportunity_quotes from anon, authenticated;
grant select, insert, update, delete on table public.opportunity_quotes to service_role;
