create index if not exists ellis_activity_log_email_triage_id_idx
  on public.ellis_activity_log(email_triage_id);

create index if not exists ellis_activity_log_owner_id_idx
  on public.ellis_activity_log(owner_id);

create index if not exists ellis_activity_log_task_id_idx
  on public.ellis_activity_log(task_id);

create index if not exists ellis_daily_briefings_owner_id_idx
  on public.ellis_daily_briefings(owner_id);

create index if not exists ellis_tasks_owner_id_idx
  on public.ellis_tasks(owner_id);

create index if not exists ellis_tasks_related_email_id_idx
  on public.ellis_tasks(related_email_id);

create index if not exists email_triage_mailbox_connection_id_idx
  on public.email_triage(mailbox_connection_id);

create index if not exists email_triage_owner_id_idx
  on public.email_triage(owner_id);
