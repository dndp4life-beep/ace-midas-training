import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const trainingNotificationTypes = [
  { type: "training_expiry_90_days", daysBefore: 90 },
  { type: "training_expiry_60_days", daysBefore: 60 },
  { type: "training_expiry_30_days", daysBefore: 30 },
  { type: "training_expiry_7_days", daysBefore: 7 },
  { type: "training_expired", daysBefore: 0 },
];

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function scheduledDateFromExpiry(expiryDate: string, daysBefore: number) {
  const expiry = new Date(`${expiryDate}T09:00:00.000Z`);
  if (Number.isNaN(expiry.getTime())) return null;
  expiry.setUTCDate(expiry.getUTCDate() - daysBefore);
  return expiry;
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Reminder generator is not configured." }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 500, 1), 1000);
    const dryRun = Boolean(body?.dryRun);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: records, error: recordsError } = await supabase
      .from("training_records")
      .select("id, member_id, expiry_date")
      .not("expiry_date", "is", null)
      .order("expiry_date", { ascending: true })
      .limit(limit);

    if (recordsError) throw recordsError;
    if (!records?.length) {
      return jsonResponse({
        success: true,
        scanned: 0,
        created: 0,
        skipped: 0,
        dryRun,
      });
    }

    const recordIds = records.map((record) => record.id).filter(Boolean);
    const memberIds = [...new Set(records.map((record) => record.member_id).filter(Boolean))];
    const reminderTypes = trainingNotificationTypes.map((item) => item.type);

    const [membersResult, existingResult] = await Promise.all([
      memberIds.length
        ? supabase.from("members").select("id, organisation_id").in("id", memberIds)
        : Promise.resolve({ data: [], error: null }),
      recordIds.length
        ? supabase
            .from("notification_queue")
            .select("training_record_id, type")
            .in("training_record_id", recordIds)
            .in("type", reminderTypes)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const lookupError = membersResult.error || existingResult.error;
    if (lookupError) throw lookupError;

    const membersById = new Map((membersResult.data || []).map((member) => [member.id, member]));
    const existingKeys = new Set(
      (existingResult.data || []).map((item) => `${item.training_record_id}:${item.type}`)
    );

    const today = startOfTodayUtc();
    const rowsToCreate = [];
    let duplicatesSkipped = 0;
    let skipped = 0;

    for (const record of records) {
      const expiryDate = String(record.expiry_date || "");
      const member = membersById.get(record.member_id);

      if (!expiryDate || !record.id || !record.member_id) {
        skipped += 1;
        continue;
      }

      for (const reminder of trainingNotificationTypes) {
        const scheduledFor = scheduledDateFromExpiry(expiryDate, reminder.daysBefore);
        const existingKey = `${record.id}:${reminder.type}`;

        if (!scheduledFor) {
          skipped += 1;
          continue;
        }

        if (existingKeys.has(existingKey)) {
          duplicatesSkipped += 1;
          continue;
        }

        if (scheduledFor < today) {
          skipped += 1;
          continue;
        }

        rowsToCreate.push({
          organisation_id: member?.organisation_id || null,
          member_id: record.member_id,
          training_record_id: record.id,
          type: reminder.type,
          status: "pending",
          scheduled_for: scheduledFor.toISOString(),
        });
      }
    }

    if (dryRun || !rowsToCreate.length) {
      return jsonResponse({
        success: true,
        scanned: records.length,
        created: 0,
        planned: rowsToCreate.length,
        duplicatesSkipped,
        skipped,
        dryRun,
      });
    }

    const { data: createdRows, error: insertError } = await supabase
      .from("notification_queue")
      .insert(rowsToCreate)
      .select("id, training_record_id, member_id, organisation_id, type, status, scheduled_for");

    if (insertError) throw insertError;

    return jsonResponse({
      success: true,
      scanned: records.length,
      created: createdRows?.length || 0,
      duplicatesSkipped,
      skipped,
      dryRun: false,
    });
  } catch (error) {
    console.error("Reminder generator error:", error);
    return jsonResponse({ error: "Unable to generate training reminders." }, 500);
  }
});
