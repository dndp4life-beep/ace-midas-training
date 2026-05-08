alter table public.agent_activity_logs
add column if not exists agent_role text;

alter table public.agent_activity_logs
add column if not exists action_label text;

alter table public.agent_activity_logs
add column if not exists organisation_id uuid;

alter table public.agent_activity_logs
add column if not exists member_id uuid;

alter table public.agent_activity_logs
add column if not exists training_record_id uuid;

create index if not exists agent_activity_logs_action_type_idx on public.agent_activity_logs(action_type);
create index if not exists agent_activity_logs_organisation_id_idx on public.agent_activity_logs(organisation_id);
create index if not exists agent_activity_logs_member_id_idx on public.agent_activity_logs(member_id);
create index if not exists agent_activity_logs_training_record_id_idx on public.agent_activity_logs(training_record_id);
