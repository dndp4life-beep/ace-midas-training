create index if not exists ellis_delegations_contact_id_idx
  on public.ellis_delegations(contact_id);

create index if not exists ellis_delegations_organisation_id_idx
  on public.ellis_delegations(organisation_id);

create index if not exists agent_work_queue_linked_contact_id_idx
  on public.agent_work_queue(linked_contact_id);

create index if not exists agent_work_queue_linked_organisation_id_idx
  on public.agent_work_queue(linked_organisation_id);

create index if not exists agent_work_queue_prospect_id_idx
  on public.agent_work_queue(prospect_id);

create index if not exists ellis_urgent_alerts_prospect_id_idx
  on public.ellis_urgent_alerts(prospect_id);

create index if not exists ellis_urgent_alerts_organisation_id_idx
  on public.ellis_urgent_alerts(organisation_id);
