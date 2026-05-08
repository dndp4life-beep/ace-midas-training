alter table public.reply_intake
add column if not exists requested_course text;

alter table public.reply_intake
add column if not exists attendees text;

alter table public.reply_intake
add column if not exists location text;

alter table public.reply_intake
add column if not exists preferred_dates text;

alter table public.reply_intake
add column if not exists urgency text;

alter table public.reply_intake
add column if not exists approved_dates text;

alter table public.reply_intake
add column if not exists approved_availability_wording text;

alter table public.reply_intake
add column if not exists approved_price_payment_instruction text;

alter table public.reply_intake
add column if not exists theo_notes text;

alter table public.reply_intake
add column if not exists draft_response text;

create index if not exists reply_intake_urgency_idx
on public.reply_intake(urgency);
