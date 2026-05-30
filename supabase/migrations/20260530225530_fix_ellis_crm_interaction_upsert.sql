drop index if exists public.crm_interactions_email_triage_unique_idx;

create unique index crm_interactions_email_triage_unique_idx
  on public.crm_interactions(email_triage_id);
