drop index if exists public.email_triage_external_message_id_unique_idx;
create unique index email_triage_external_message_id_unique_idx
  on public.email_triage(external_message_id);

drop index if exists public.mailbox_connections_provider_mailbox_unique_idx;
create unique index mailbox_connections_provider_mailbox_unique_idx
  on public.mailbox_connections(provider, mailbox_email);
