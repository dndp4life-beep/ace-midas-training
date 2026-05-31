alter table public.opportunity_response_drafts
  drop constraint if exists opportunity_response_drafts_status_check;

alter table public.opportunity_response_drafts
  add constraint opportunity_response_drafts_status_check
  check (status in ('draft', 'approved', 'edited', 'rejected', 'sent', 'paused'));
