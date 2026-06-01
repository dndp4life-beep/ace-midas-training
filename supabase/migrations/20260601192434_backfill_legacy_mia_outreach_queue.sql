insert into public.mia_outreach_queue (
  prospect_id,
  outreach_type,
  recipient_email,
  email_subject,
  status,
  autosend_enabled,
  sent_at,
  failure_reason,
  provider_response
)
select
  p.id,
  'initial',
  p.contact_email,
  'Legacy Rory to Mia handoff',
  case
    when p.first_contact_sent_at is not null then 'sent'
    when p.status = 'pending_outreach' then 'failed'
    else 'awaiting_review'
  end,
  false,
  p.first_contact_sent_at,
  case
    when p.first_contact_sent_at is not null then 'Imported from the legacy workflow. Provider response was not stored before the queue was added.'
    when p.status = 'pending_outreach' then 'Imported from the legacy workflow. Previous send outcome needs review.'
    else 'Imported from the legacy workflow. Delivery was not verified, so this record needs review.'
  end,
  '{}'::jsonb
from public.prospects p
where
  p.first_contact_sent_at is not null
  or p.assigned_to = 'Mia'
  or p.status in ('contacted', 'ready_for_outreach', 'pending_outreach', 'pending_outreach_approval')
on conflict (prospect_id, outreach_type) do nothing;
