create unique index if not exists email_triage_external_message_id_unique_idx
  on public.email_triage(external_message_id)
  where external_message_id is not null;

create unique index if not exists mailbox_connections_provider_mailbox_unique_idx
  on public.mailbox_connections(provider, mailbox_email)
  where mailbox_email is not null;
