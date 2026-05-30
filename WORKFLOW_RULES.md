# ACE MiDAS Training Workflow Rules

This file documents operational workflow rules for future Codex sessions.

## Platform Focus

This platform supports ACE MiDAS Training with:

- Training compliance records
- Refresher tracking
- Certificate uploads
- Reminder automation
- Reporting and exports
- Booking enquiries
- Contact form routing
- AI-assisted internal workflows
- Safe customer follow-up

Do not expand it into an unrelated transport operations, fleet, journey, depot, medication, incident, or live tracking system unless explicitly requested.

## Contact Form Routing

The contact form should:

1. Save the enquiry to `contact_submissions`.
2. Send the notification email to ACE MiDAS Training.
3. Insert the message into `inbound_messages`.
4. Route/classify through Ellis.
5. Log routing and actions in `agent_activity_logs`.

The notification email must not be removed when adding or fixing agent routing.

## Ellis Classification Logic

Ellis classifies inbound messages into categories such as:

- General training enquiry
- Refresher enquiry
- Wants dates
- Wants pricing
- Wants more information
- Booking request
- Certificate request
- Not interested
- Spam/B2B irrelevant
- Unsubscribe/do not contact

Routing:

- General/refresher training enquiries -> Mia
- Booking/date/availability/payment questions -> Theo
- Compliance/refresher risk -> Ava
- Content/social opportunities -> Nia
- Research/prospect opportunities -> Rory
- Spam/B2B irrelevant -> Ellis archive/filter

## Ellis Executive Assistant Workflow

Ellis Phase 1 uses manual email intake. Live mailbox access is reserved for Phase 2.

For every processed email Ellis records:

- Short summary
- Suggested category
- Priority: Critical, High, Medium, or Low
- Confidence score
- Recommended action
- Internal reasoning metadata
- Whether admin review is required

Ellis categories include:

- High Priority
- Customer Enquiry
- Booking Request
- Council / Local Authority
- School / Academy Trust
- Supplier
- Invoice / Payment
- Compliance / Legal
- System Alert
- Internal Communication
- Follow-Up Required
- Marketing
- Sales Pitch
- Likely Spam
- Review Later

Ellis may recommend follow-up tasks and generate internal daily briefings. Ellis must not automatically send, delete, archive, or unsubscribe. Council, local authority, school, academy trust, invoice, payment, legal, compliance, and uncertain emails always require review.

Future Gmail and Microsoft 365 / Outlook connections must use OAuth 2.0 with PKCE, server-side token references, token refresh handling, and mailbox ownership. Passwords and raw OAuth tokens must not be stored in frontend code.

## Mia Safe Auto-Replies

Mia may auto-send safe standard emails for:

- Refresher reminders
- General refresher follow-up
- Safe training information requests

Mia must not:

- Confirm dates
- Promise availability
- Confirm bookings
- Change bookings
- Cancel bookings
- Agree custom prices
- Send custom payment links

If a message asks for booking/date/payment commitments, route to Theo.

## Theo Booking Rules

Theo may auto-reply to safe booking questions, including:

- How booking works
- What information is needed
- Group booking explanation
- Onsite training explanation
- General availability enquiry wording
- General pricing structure wording
- Refresher booking process
- Requests to provide course type, attendee count, location, and preferred timeframe

Theo must request human approval before:

- Confirming exact dates
- Promising availability
- Confirming bookings
- Changing bookings
- Cancelling bookings
- Agreeing custom prices
- Offering custom discounts
- Sending or requesting Stripe/custom payment links

Theo should generate draft responses using only approved information.

## Ava Compliance Rules

Ava is internal only.

Ava checks:

- Expired training
- Expiring within 7 days
- Expiring within 30 days
- Expiring within 60 days
- Expiring within 90 days
- Missing certificates
- Failed reminders
- Urgent organisations

Ava can:

- Create internal `agent_activity_logs`.
- Update the Daily AI Summary.
- Send internal end-of-day and end-of-week summaries to admin when configured.

Ava must not:

- Email customers.
- Confirm bookings.
- Change training data automatically.
- Send payment links.

## Rory Research Rules

Rory researches publicly available UK prospects only.

Rory can collect:

- Organisation name
- Website
- Location
- Sector
- Likely training need
- Public contact email/phone if available
- Public decision-maker name if available
- Source URL
- Notes
- Priority
- Relevance reason

Rory must not:

- Scrape private data.
- Send outreach automatically.
- Spam prospects.
- Use private personal data.

All prospects should go to a review list before outreach.

## Nia Content Rules

Nia can:

- Draft content ideas.
- Suggest promotional topics.
- Summarise content opportunities.

Nia must not:

- Publish without review.
- Make unsupported safeguarding, council, or compliance claims.
- Change legal wording without approval.
- Change pricing or booking commitments.

## What Requires Human Approval

Human approval is required for:

- Exact training dates
- Availability promises
- Booking confirmations
- Booking changes
- Cancellations
- Custom prices
- Custom discounts
- Payment links
- Legal/compliance-sensitive public claims
- Outreach to prospects
- Publishing public content

## What Can Be Automated

Automation is allowed for:

- Contact form notification email
- Contact form inbound message creation
- Ellis classification/routing
- Mia safe refresher reminders
- Mia safe general/refresher replies
- Ava internal monitoring logs
- Ava internal summaries
- Rory prospect research storage
- Nia draft content ideas
- Reminder queue generation
- Reminder processing where configured
- Report history logging

## Daily AI Summary Expectations

Daily AI Summary should include:

- Inbound messages received
- Messages routed
- Spam filtered
- Theo approvals created
- Mia replies/reminders sent
- Ava compliance risks
- Expired training count
- Expiring within 7/30/60/90 days
- Missing certificates
- Urgent organisations
- Rory prospects added
- Nia drafts created
- Failed sends or reminders

## Do Not Break Existing Workflows

When editing the project, avoid breaking:

- Stripe checkout
- Supabase blog/review saving
- Back Office tabs
- Contact form notification email
- Contact form agent routing
- Member login
- Certificates
- Training Compliance
- Reports and PDFs
- Report history
- Reminder automation
- Agent Operations Centre
- Workflow Debug Trace
