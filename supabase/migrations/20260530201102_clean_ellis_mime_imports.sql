with cleaned as (
  select
    id,
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            raw_excerpt,
            '^.*?Content-Transfer-Encoding:\s*(quoted-printable|7bit|8bit|base64)\s+',
            '',
            'i'
          ),
          '^Content-Type:\s*[^ ]+(?:;\s*charset=[^ ]+)?\s+',
          '',
          'i'
        ),
        '\s+--[-_?=A-Za-z0-9]+(?:\s+Content-Type:|--).*$',
        '',
        's'
      )
    ) as body
  from public.email_triage
  where source = 'livemail_imap'
    and raw_excerpt ~* 'content-(type|transfer-encoding)'
)
update public.email_triage as triage
set
  raw_excerpt = cleaned.body,
  summary = left(cleaned.body, 320),
  updated_at = now(),
  reasoning_metadata = coalesce(triage.reasoning_metadata, '{}'::jsonb)
    || jsonb_build_object(
      'mime_cleanup',
      'ellis_mime_cleanup_v1',
      'mime_cleanup_at',
      now()
    )
from cleaned
where triage.id = cleaned.id
  and cleaned.body <> '';
