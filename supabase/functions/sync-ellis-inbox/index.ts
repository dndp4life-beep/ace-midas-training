import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const maxMessagesPerSync = 25;
const maxMessageBytes = 16384;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requiredSecret(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

function quoteImap(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function writeAll(conn: Deno.TlsConn, text: string) {
  const bytes = encoder.encode(text);
  let offset = 0;
  while (offset < bytes.length) offset += await conn.write(bytes.subarray(offset));
}

async function readUntil(conn: Deno.TlsConn, done: (text: string) => boolean) {
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (let reads = 0; reads < 200; reads += 1) {
    const buffer = new Uint8Array(8192);
    const size = await conn.read(buffer);
    if (size === null) break;
    chunks.push(buffer.slice(0, size));
    length += size;
    const merged = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    const text = decoder.decode(merged);
    if (done(text)) return text;
  }
  throw new Error("Mail server response was incomplete.");
}

async function command(conn: Deno.TlsConn, tag: string, value: string) {
  await writeAll(conn, `${tag} ${value}\r\n`);
  const response = await readUntil(conn, (text) => new RegExp(`(?:^|\\r\\n)${tag} (?:OK|NO|BAD)`, "m").test(text));
  if (!new RegExp(`(?:^|\\r\\n)${tag} OK`, "m").test(response)) {
    throw new Error(`Mail server rejected ${value.split(" ")[0]}.`);
  }
  return response;
}

function decodeQuotedPrintable(value: string) {
  return value
    .replace(/=\r?\n/g, "")
    .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function decodeMimeWord(value: string) {
  return value.replace(/=\?([^?]+)\?([bBqQ])\?([^?]+)\?=/g, (_, _charset, encoding, content) => {
    try {
      if (String(encoding).toLowerCase() === "b") return atob(content);
      return decodeQuotedPrintable(content.replace(/_/g, " "));
    } catch {
      return content;
    }
  });
}

function getHeader(headers: string, name: string) {
  const match = headers.match(new RegExp(`^${name}:\\s*(.+(?:\\r?\\n[ \\t].+)*)`, "im"));
  return decodeMimeWord(String(match?.[1] || "").replace(/\r?\n[ \t]+/g, " ").trim());
}

function parseSender(value: string) {
  const bracket = value.match(/^(.*?)<([^>]+)>/);
  if (bracket) {
    return {
      sender_name: bracket[1].replace(/^["']|["']$/g, "").trim(),
      sender_email: bracket[2].trim().toLowerCase(),
    };
  }
  const email = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  return { sender_name: value.replace(email, "").trim(), sender_email: email.toLowerCase() };
}

function stripBody(value: string) {
  return decodeQuotedPrintable(value)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRawEmail(raw: string, uid: string) {
  const [headers = "", ...bodyParts] = raw.split(/\r?\n\r?\n/);
  const sender = parseSender(getHeader(headers, "From"));
  const messageId = getHeader(headers, "Message-ID") || `livemail:inbox:${uid}`;
  const subject = getHeader(headers, "Subject") || "(No subject)";
  const dateHeader = getHeader(headers, "Date");
  const parsedDate = new Date(dateHeader);
  const excerpt = stripBody(bodyParts.join("\n\n")).slice(0, 1200);
  return {
    ...sender,
    subject,
    external_message_id: messageId,
    received_at: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
    raw_excerpt: excerpt || "No readable email body was available.",
  };
}

function classifyEmail(email: Record<string, string>) {
  const text = `${email.sender_name} ${email.sender_email} ${email.subject} ${email.raw_excerpt}`.toLowerCase();
  const has = (...values: string[]) => values.some((value) => text.includes(value));
  const unsolicitedServiceOffer = has("finance solution", "flexible finance", "business loan", "funding solution", "working capital", "local electrician", "electrician for", "seo", "backlink", "guest post", "web design", "marketing package", "lead generation", "outsourcing", "our services", "offer you our", "we offer businesses", "grow your business", "improve your website", "free consultation", "crypto");
  const protectedReview = !unsolicitedServiceOffer && has("council", "local authority", ".gov.uk", "school", "academy", "invoice", "payment", "legal", "compliance");
  let category = "Review Later";
  let priority = "Medium";
  let recommended_action = "Review";
  const matched_rules: string[] = [];

  if (unsolicitedServiceOffer) {
    category = "Likely Spam";
    priority = "Low";
    recommended_action = "Archive Suggestion";
    matched_rules.push("unsolicited_service_offer");
  } else if (has("council", "local authority", ".gov.uk")) {
    category = "Council / Local Authority";
    priority = "High";
    recommended_action = "Draft Reply";
    matched_rules.push("council_or_local_authority");
  } else if (has("school", "academy", "trust")) {
    category = "School / Academy Trust";
    priority = "High";
    recommended_action = "Draft Reply";
    matched_rules.push("school_or_academy");
  } else if (has("invoice", "payment", "receipt", "statement")) {
    category = "Invoice / Payment";
    priority = "High";
    recommended_action = "Review";
    matched_rules.push("invoice_or_payment");
  } else if (has("legal", "compliance", "gdpr", "safeguarding")) {
    category = "Compliance / Legal";
    priority = "High";
    recommended_action = "Review";
    matched_rules.push("compliance_or_legal");
  } else if (has("booking", "book", "dates", "availability", "quote", "training")) {
    category = "Booking Request";
    priority = "High";
    recommended_action = "Follow-Up Required";
    matched_rules.push("booking_or_training");
  } else if (has("unsubscribe", "seo", "backlink", "guest post", "crypto", "marketing package")) {
    category = "Likely Spam";
    priority = "Low";
    recommended_action = "Archive Suggestion";
    matched_rules.push("likely_spam");
  } else if (has("marketing", "newsletter", "promotion")) {
    category = "Marketing";
    priority = "Low";
    recommended_action = "Mark Marketing";
    matched_rules.push("marketing");
  }

  const confidence_score = matched_rules.length ? (protectedReview ? 92 : 84) : 55;
  return {
    summary: email.raw_excerpt.slice(0, 320),
    category,
    priority,
    confidence_score,
    recommended_action,
    requires_review: protectedReview || category === "Review Later" || category === "Booking Request",
    review_status: "Pending",
    reasoning_metadata: {
      version: "ellis_phase_2_livemail_rules_v1",
      matched_rules,
      protected_review: protectedReview,
      safety: { read_only_sync: true, auto_delete: false, auto_send: false, auto_archive: false, auto_unsubscribe: false },
    },
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  let conn: Deno.TlsConn | null = null;
  try {
    const supabaseUrl = requiredSecret("SUPABASE_URL");
    const serviceRoleKey = requiredSecret("SUPABASE_SERVICE_ROLE_KEY");
    const syncSecret = requiredSecret("ELLIS_SYNC_SECRET");
    if (req.headers.get("x-ellis-sync-secret") !== syncSecret) {
      return json({ error: "Unauthorized." }, 401);
    }
    const host = requiredSecret("ELLIS_IMAP_HOST");
    const user = requiredSecret("ELLIS_IMAP_USER");
    const password = requiredSecret("ELLIS_IMAP_PASSWORD");
    const port = Number(Deno.env.get("ELLIS_IMAP_PORT") || "993");
    if (!Number.isFinite(port)) throw new Error("ELLIS_IMAP_PORT must be numeric.");

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: connection, error: connectionError } = await supabase
      .from("mailbox_connections")
      .upsert({
        provider: "livemail_imap",
        mailbox_email: user,
        display_name: "Fasthosts Livemail",
        status: "connected_read_only",
        scopes: ["imap:read"],
        metadata: { host, port, tls: true, mode: "read_only", credential_source: "supabase_secret" },
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider,mailbox_email" })
      .select("id")
      .single();
    if (connectionError) throw connectionError;

    conn = await Deno.connectTls({ hostname: host, port });
    await readUntil(conn, (text) => /^\* OK/m.test(text));
    await command(conn, "A001", `LOGIN ${quoteImap(user)} ${quoteImap(password)}`);
    await command(conn, "A002", "EXAMINE INBOX");
    const searchResponse = await command(conn, "A003", "UID SEARCH UNSEEN");
    const searchLine = searchResponse.match(/^\* SEARCH(?: (.*))?$/m)?.[1] || "";
    const uids = searchLine.split(/\s+/).filter(Boolean).slice(-maxMessagesPerSync);

    let imported = 0;
    let duplicates_skipped = 0;
    const errors: string[] = [];

    for (let index = 0; index < uids.length; index += 1) {
      const uid = uids[index];
      try {
        const response = await command(conn, `F${String(index + 1).padStart(3, "0")}`, `UID FETCH ${uid} (UID BODY.PEEK[]<0.${maxMessageBytes}>)`);
        const literalMatch = response.match(/\{\d+\}\r?\n([\s\S]*?)\r?\n\)\r?\nF\d{3} OK/m);
        const raw = literalMatch?.[1] || "";
        const email = parseRawEmail(raw, uid);
        if (!email.sender_email) throw new Error(`Message ${uid} has no sender email.`);

        const { data: existing, error: existingError } = await supabase
          .from("email_triage")
          .select("id")
          .eq("external_message_id", email.external_message_id)
          .maybeSingle();
        if (existingError) throw existingError;
        if (existing) {
          duplicates_skipped += 1;
          continue;
        }

        const analysis = classifyEmail(email);
        const { data: inserted, error: insertError } = await supabase
          .from("email_triage")
          .insert({
            mailbox_connection_id: connection.id,
            source: "livemail_imap",
            ...email,
            ...analysis,
          })
          .select("id, subject, category, priority")
          .single();
        if (insertError) throw insertError;

        const { error: logError } = await supabase.from("ellis_activity_log").insert({
          email_triage_id: inserted.id,
          action_type: "livemail_email_imported",
          summary: `Ellis imported and triaged "${inserted.subject}" as ${inserted.category}.`,
          metadata: { provider: "livemail_imap", uid, priority: inserted.priority, read_only: true },
        });
        if (logError) throw logError;
        imported += 1;
      } catch (error) {
        console.error("Ellis message import error:", error);
        errors.push(error instanceof Error ? error.message : "Unable to import one email.");
      }
    }

    await command(conn, "A999", "LOGOUT");
    conn.close();
    conn = null;

    const { error: updateError } = await supabase
      .from("mailbox_connections")
      .update({ status: "connected_read_only", last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", connection.id);
    if (updateError) throw updateError;

    await supabase.from("ellis_activity_log").insert({
      action_type: "livemail_inbox_synced",
      summary: `Ellis completed a read-only Livemail inbox sync: ${imported} imported, ${duplicates_skipped} duplicate(s) skipped.`,
      metadata: { unread_found: uids.length, imported, duplicates_skipped, errors: errors.slice(0, 10), read_only: true },
    });

    return json({ success: true, unread_found: uids.length, imported, duplicates_skipped, errors });
  } catch (error) {
    console.error("Ellis inbox sync error:", error);
    try {
      conn?.close();
    } catch {
      // Ignore close failures while reporting the original connection error.
    }
    return json({ error: "Ellis could not sync the Livemail inbox. Check the secure mailbox settings and try again." }, 500);
  }
});
