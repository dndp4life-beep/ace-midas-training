# ACE MiDAS Training Project Architecture

This project is the public website and Back Office platform for ACE MiDAS Training.

Important context: this is not a transport company operations system. It is a training compliance, refresher tracking, certificate record, reminder automation, reporting, and AI-assisted business workflow platform for ACE MiDAS Training. Do not build unnecessary fleet, journey, vehicle, incident, depot, or live transport operations systems unless the user explicitly asks for them.

## Current Stack

- Frontend: React with Vite
- Hosting: Vercel
- Source control: GitHub
- Database: Supabase Postgres
- Storage: Supabase Storage
- Supabase Edge Functions: contact form and reminder automation workflows
- Email: Resend
- Payments: Stripe Checkout/API flow
- Styling: Tailwind-style utility classes inside React components

## Core Public Website Features

- Home page
- Training pages and course cards
- Compliance product pages
- Blog previews and blog detail pages
- Reviews page with public review submission
- Contact page
- Footer and legal links
- URL-based routing with refresh-safe navigation
- Stripe-powered booking/payment flow
- Booking success and onboarding success journeys

## Back Office Features

- Admin unlock/login for Back Office access
- Blog management with Supabase saving
- Review management with Supabase saving
- Members and onboarding management
- Training Compliance tracker
- Reports & Exports
- Export Centre
- Media Manager for card/site images
- Settings for footer/contact/business details
- Agent Operations Centre
- Ellis Operations Centre
- Workflow Debug Trace

## Training Compliance

The Training Compliance section uses Supabase data for:

- Organisations
- Members/staff
- Courses
- Training records
- Certificate/evidence uploads
- Reminder queues/logs

Training records are linked through:

- `training_records.member_id -> members.id`
- `members.organisation_id -> organisations.id`
- `training_records.course_id -> courses.id`

Do not assume `training_records.organisation_id` exists.

## Certificates

Training certificate uploads are stored in Supabase Storage using the `training-evidence` bucket.

The user-facing wording should say "Certificate" where relevant, but internal database/storage names may still use "evidence":

- `training_evidence` table
- `training-evidence` storage bucket

The Back Office supports:

- Upload Certificate
- View Certificate
- Download Certificate
- Delete Certificate
- Certificate attached: Yes/No

## Reports

Reports & Exports use real Supabase-loaded compliance data.

Current reporting features include:

- Organisation Compliance Report PDF
- Audit Trail Report PDF
- CSV/export tools
- Report history records
- Recent Reports section
- PDF generation using client-side PDF tooling

PDF reports should include certificate status where relevant.

## Reminder Automation

Reminder automation uses:

- `notification_queue`
- `notification_logs`
- Supabase Edge Function: `generate-training-reminders`
- Supabase Edge Function: `process-reminders`

Reminder types include:

- `training_expiry_90_days`
- `training_expiry_60_days`
- `training_expiry_30_days`
- `training_expiry_7_days`
- `training_expired`

## Contact Form And Agent Routing

The public contact form uses a Supabase Edge Function, not Formspree.

Expected flow:

1. Public contact form submits to the Supabase Edge Function.
2. The function inserts into `contact_submissions`.
3. The function emails the enquiry notification to ACE MiDAS Training.
4. The function inserts into `inbound_messages`.
5. Ellis classifies and routes the message.
6. Safe enquiries may trigger Mia or Theo auto-replies.
7. Booking/date/payment commitments are routed to Theo approval.

Do not remove the notification email while adding agent routing.

## Agent Operations Centre

The AI Operations Centre provides structured operational workflows for:

- Ava
- Mia
- Theo
- Nia
- Ellis
- Rory

Agents must follow approval and safety rules documented in `AGENTS.md` and `WORKFLOW_RULES.md`.

## Ellis Executive Assistant

Ellis Phase 1 is a review-first internal operations workspace. It uses:

- `email_triage`
- `ellis_daily_briefings`
- `ellis_tasks`
- `ellis_activity_log`
- `mailbox_connections`

The Back Office Ellis Operations Centre supports:

- Manual email intake and structured classification
- Priority, category, confidence, and recommended-action metadata
- Daily briefings with urgent emails and recommendations
- Review queue filters and safe user-controlled review actions
- Follow-up task creation and task status tracking
- Read-only Fasthosts Livemail IMAP sync
- Future mailbox connection readiness for Gmail and Microsoft 365 / Outlook

Ellis must not automatically send, delete, archive, or unsubscribe. The Fasthosts Livemail connection uses server-side Supabase secrets for read-only IMAP access. Vercel triggers the sync using a separate `ELLIS_SYNC_SECRET` shared only between the Vercel server and Supabase Edge Function. Future Gmail and Microsoft inbox integrations must use OAuth 2.0 with PKCE and secure server-side token references. Passwords and raw OAuth tokens must never be stored in frontend code.

## Ellis CRM Intelligence

Ellis Phase 3 adds structured organisational memory without retraining an AI model. Useful inbox records are linked to CRM contacts, organisations and interactions. Spam and marketing messages stay outside relationship scoring.

Phase 3 uses:

- `crm_contacts`
- enriched `organisations`
- `crm_interactions`
- `relationship_scores`
- `crm_insights`
- `ellis_learning_events`
- `ellis_action_history`

User corrections to category, priority and agent routing are stored as learning events. Undo actions are recorded separately and must not count as positive learning signals. Ellis remains review-first: complaints, legal matters, safeguarding, invoices, payment disputes, compliance concerns and low-confidence classifications must remain under human control.

## Ellis Phase 4 Automation And Security

Ellis Phase 4 adds a continuously operating, approval-first foundation:

- Back Office unlock is validated by `/api/admin-auth`.
- Successful unlock creates a signed, HttpOnly, Secure, SameSite session cookie.
- `/api/admin` rejects requests without a valid Admin session.
- `/api/admin` permits the read-only `get-settings` action without an Admin session so public footer and contact details load from persisted Supabase settings after refresh. All settings writes remain protected.
- The session payload is role-aware and currently issues the `Admin` role.
- Future roles are prepared conceptually: `Admin`, `Operations`, `Training Team`, and `Booking Team`.
- `sync-ellis-inbox` remains read-only and now writes `ellis_sync_history`.
- Supabase Cron can trigger `sync-ellis-inbox` every 10 minutes after Vault activation.
- `sender_domain_intelligence` stores domain patterns, confidence, routing suggestions, classification history, and admin corrections.
- The Ellis Operations Centre shows sync status, recent runs, domain intelligence, and an approval-first Routing Review panel.
- Enhanced daily briefings include urgent email actions, open follow-ups, relationship insights, and routing recommendations.

Required Vercel secrets:

- `BACK_OFFICE_ADMIN_CODE`
- `BACK_OFFICE_SESSION_SECRET`

Required Supabase Edge Function secrets remain:

- `ELLIS_SYNC_SECRET`
- `ELLIS_IMAP_HOST`
- `ELLIS_IMAP_PORT`
- `ELLIS_IMAP_USER`
- `ELLIS_IMAP_PASSWORD`

Supabase Cron activation stores the existing `ELLIS_SYNC_SECRET` value inside Supabase Vault using `private.set_ellis_sync_secret(text)`, then schedules the ten-minute job using `private.schedule_ellis_inbox_cron(text)`. The database cannot read Supabase Edge Function secrets automatically. Do not put mailbox passwords, session secrets, or sync secrets in frontend code.

## Ellis Phase 5 Controlled Delegation

Ellis Phase 5 adds reviewable operational delegation without automatic replies or destructive inbox actions.

Phase 5 uses:

- `ellis_delegations`
- `agent_work_queue`
- `ellis_alert_settings`
- `ellis_urgent_alerts`

For relevant inbox emails, Ellis creates a suggested delegation with a recommended agent, task, due date, reason and structured handoff note. Tasks enter an agent queue only after Back Office approval. Queue statuses are `New`, `In Progress`, `Waiting for Marvin`, `Waiting for Customer`, `Completed`, and `Cancelled`.

Urgent Rory prospect alerts are created when a new inbox email matches a qualified Rory prospect by public contact email, organisation domain or organisation mention. Alerts are deduplicated by email and email notifications use a configurable prospect cooldown. Alerts are internal only.

## Ellis Phase 6 Opportunity Management

Ellis Phase 6 adds a review-first opportunity pipeline without automatic customer replies.

Phase 6 uses:

- `opportunities`
- `opportunity_email_links`
- `opportunity_response_drafts`
- enriched `prospects.pipeline_stage`
- enriched `agent_work_queue.linked_opportunity_id`

Rory prospects receive opportunity records, known prospect replies can advance the pipeline, quote requests and engaged contacts are marked hot, and suggested follow-up work is placed in the existing agent queue. Mia may prepare response drafts for review. Approving a draft records an internal decision only: it does not send an email.

Opportunity stages are `Prospect Found`, `Outreach Sent`, `Contact Engaged`, `Information Requested`, `Quote Requested`, `Quote Sent`, `Follow-Up Due`, `Negotiation`, `Won`, `Lost`, and `Dormant`.

## Mia Phase 7 Trusted Communication Automation

Mia Phase 7 adds an internal learning and trust layer around reviewable opportunity drafts. The default remains Level 1: draft only.

Phase 7 uses:

- enriched `opportunity_response_drafts`
- `mia_communication_settings`
- `mia_communication_trust_profiles`
- `mia_communication_memory`
- `mia_follow_up_sequences`
- `mia_follow_up_sequence_steps`

Mia records approvals, edits and rejections per communication category. Drafts show confidence, similarity, trust, similar approved reply count and the reason automation is or is not eligible. Review-first follow-up sequences can prepare Day 0, 7, 21 and 45 steps without sending customer emails.

Trusted sending has an explicit Back Office processor. It remains disabled at Level 1. Even at Level 3 or 4, the admin must explicitly enable automation and confirm processing before eligible approved drafts can be sent. A future phase may move this processor into a monitored background worker after sufficient review history exists.

Restricted categories always remain under Marvin review: complaints, legal/compliance matters, safeguarding, invoices/payments, payment disputes, council tenders, contract negotiations and low-confidence communications.

## Rory To Mia Outreach Queue

Rory prospect handoffs use `mia_outreach_queue` as a durable service-role-only delivery ledger.

- Selecting prospects and sending them to Mia creates or updates an initial outreach queue record.
- Queue statuses are `sent_to_mia`, `drafted`, `queued`, `sending`, `sent`, `failed`, `skipped`, and `awaiting_review`.
- A prospect is marked `contacted` only after Resend confirms that the initial outreach email was accepted.
- Missing or invalid public emails and do-not-contact prospects are skipped with a visible reason.
- Initial outreach is deduplicated per prospect.
- Follow-up tasks are scheduled only after a successful initial email send.
- Rory Prospecting Centre shows a prominent Mia Outreach Workspace with delivery counts, per-prospect next steps, exact prepared-email previews, and a confirmed `Approve & Send Email` action for reviewed drafts.
- Website enquiry auto-replies remain separate and are not changed by this queue.

## Phase 8A Executive Command Centre

The Back Office Dashboard is the read-only Executive Command Centre and becomes the default landing tab after a fresh admin unlock.

It summarises existing operational data without changing automation behaviour:

- Active and hot opportunities
- Follow-ups and bookings awaiting action
- New replies and urgent alerts
- Estimated pipeline value
- Rory prospecting quality and outreach readiness
- Mia outreach and communication outcomes
- Ellis inbox, CRM and routing activity
- Theo booking workload
- A deterministic morning briefing and Marvin urgent-actions panel

The protected `/api/admin` action is `get-executive-dashboard`. It only reads existing operational tables and does not send email, update records, advance opportunity stages or create tasks.

## Phase 8B Revenue Intelligence

Phase 8B extends the existing Executive Command Centre with read-only pipeline forecasting. It does not change Mia sending, Ellis inbox automation, Rory prospecting or Theo booking behaviour.

Revenue intelligence adds:

- Opportunity service type, participant count, quoted value, actual value, probability, expected value, close likelihood and expected close date
- Stage-based default probabilities with database-side expected-value calculation
- Value-review flags for opportunities that still need a human estimate
- `opportunity_quotes` for lightweight quote tracking
- Revenue cards, pipeline-by-stage summaries, service summaries, monthly forecasts, top revenue opportunities, quote follow-up visibility and Ellis revenue insights

The quote tracker is available from the existing Opportunity Pipeline tab. It stores quote records and updates won revenue when a quote is marked accepted. It does not send emails.

## Phase 8C AI Business Analyst

Phase 8C adds a read-only Business Analyst panel inside the Executive Command Centre. It answers operational questions from stored CRM, opportunity, quote, inbox, booking and agent activity records.

The analyst:

- Uses deterministic stored-data analysis rather than invented figures
- Supports quick insights for priorities, overdue follow-ups, hot opportunities, forecasts, quotes, agent performance, schools, councils, stalled opportunities and missing data
- Returns a direct answer, supporting facts, recommended actions, related opportunities, a confidence level and a data-quality note
- Stores an audit record in `business_analyst_queries`
- Cannot send email, alter pipeline stages, change routing, approve automation, delete records or trigger campaigns

## Important Development Rules

- Do not expose secret keys in frontend code.
- Use Vercel API routes or Supabase Edge Functions for server-side secrets.
- Do not remove working Stripe, Supabase, contact form, reminder, report, certificate, or Back Office functionality.
- Do not create unnecessary transport/fleet/incident/journey systems.
- Keep the platform focused on ACE MiDAS Training: training, compliance, certificates, reminders, reporting, bookings, enquiries, outreach, and internal agent workflows.
