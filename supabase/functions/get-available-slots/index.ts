import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { instructorId, dateIso } = await req.json();
    if (!instructorId || !dateIso) {
      return errorResponse("instructorId and dateIso are required");
    }

    const requestedDate = new Date(dateIso);
    const dayOfWeek = requestedDate.getDay(); // 0 = Sunday

    // Existing bookings for the day (anything not cancelled blocks the slot)
    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("instructor_id", instructorId)
      .neq("status", "cancelled")
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString());
    if (bookingsError) throw bookingsError;

    // Instructor's recurring weekly availability windows for this weekday.
    const { data: windows, error: availError } = await supabase
      .from("availability_slots")
      .select("start_time, end_time")
      .eq("instructor_id", instructorId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);
    if (availError) throw availError;

    // Default to 9–17 when the instructor hasn't set a calendar yet.
    const ranges = windows && windows.length > 0
      ? windows.map((w) => ({
        start: parseInt(w.start_time.split(":")[0], 10),
        end: parseInt(w.end_time.split(":")[0], 10),
      }))
      : [{ start: 9, end: 17 }];

    const slots: string[] = [];
    for (const range of ranges) {
      for (let hour = range.start; hour < range.end; hour++) {
        const slot = new Date(requestedDate);
        slot.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slot.getTime() + 60 * 60 * 1000);

        if (slot < new Date()) continue;

        const isBooked = (bookings ?? []).some((b) => {
          const bStart = new Date(b.start_time).getTime();
          const bEnd = new Date(b.end_time).getTime();
          return bStart < slotEnd.getTime() && bEnd > slot.getTime();
        });
        if (!isBooked) slots.push(slot.toISOString());
      }
    }

    return jsonResponse({ slots: [...new Set(slots)].sort() });
  } catch (error: any) {
    return errorResponse(error.message ?? "Failed to fetch slots");
  }
});
