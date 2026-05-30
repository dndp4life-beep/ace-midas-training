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

## Important Development Rules

- Do not expose secret keys in frontend code.
- Use Vercel API routes or Supabase Edge Functions for server-side secrets.
- Do not remove working Stripe, Supabase, contact form, reminder, report, certificate, or Back Office functionality.
- Do not create unnecessary transport/fleet/incident/journey systems.
- Keep the platform focused on ACE MiDAS Training: training, compliance, certificates, reminders, reporting, bookings, enquiries, outreach, and internal agent workflows.
