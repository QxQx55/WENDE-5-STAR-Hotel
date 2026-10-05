import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function auth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing authorization header");
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Invalid or expired token");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { user, profile };
}

function requireRole(profile: Record<string, unknown> | null, ...roles: string[]) {
  if (!profile || !roles.includes(profile.role as string)) throw new Error(`Insufficient permissions`);
}

async function logAudit(userId: string, action: string, resourceType: string, resourceId: string | null, details?: string) {
  await supabase.from("pms_audit_logs").insert({ user_id: userId, action, resource_type: resourceType, resource_id: resourceId, details });
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace("/pms-api", "").replace(/^\/+|\/+$/g, "");
  const method = req.method;
  const segments = path.split("/").filter(Boolean);
  const resource = segments[0];
  const resourceId = segments[1];
  const subResource = segments[2];

  try {
    const { profile } = await auth(req);
    let result: unknown;

    switch (resource) {
      case "guests":
        if (method === "GET" && !resourceId) result = (await supabase.from("pms_guests").select("*").order("last_name")).data;
        else if (method === "GET" && resourceId) {
          const guest = (await supabase.from("pms_guests").select("*").eq("id", resourceId).single()).data;
          const history = (await supabase.from("pms_reservations").select("id, check_in_date, check_out_date, status, base_rate, room_type:pms_room_types(name)").eq("guest_id", resourceId).order("created_at", { ascending: false })).data;
          result = { ...guest, reservation_history: history };
        } else if (method === "POST") {
          requireRole(profile, "admin", "manager", "front_desk");
          result = (await supabase.from("pms_guests").insert([await req.json()]).select().single()).data;
          await logAudit(profile.id as string, "CREATE_GUEST", "guest", (result as {id: string}).id, "Created guest");
        } else if (method === "PUT" && resourceId) {
          requireRole(profile, "admin", "manager", "front_desk");
          result = (await supabase.from("pms_guests").update(await req.json()).eq("id", resourceId).select().single()).data;
        }
        break;

      case "rooms":
        if (method === "GET" && !resourceId) result = (await supabase.from("pms_rooms").select("*, room_type:pms_room_types(*)").order("room_number")).data;
        else if (method === "GET" && resourceId) result = (await supabase.from("pms_rooms").select("*, room_type:pms_room_types(*)").eq("id", resourceId).single()).data;
        else if (method === "PUT" && resourceId && subResource === "status") {
          requireRole(profile, "admin", "manager");
          const body = await req.json();
          result = (await supabase.from("pms_rooms").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", resourceId).select("*, room_type:pms_room_types(*)").single()).data;
          await logAudit(profile.id as string, "UPDATE_ROOM_STATUS", "room", resourceId, `Room status changed to ${body.status}`);
        }
        break;

      case "room-types":
        if (method === "GET") result = (await supabase.from("pms_room_types").select("*").eq("is_active", true).order("sort_order")).data;
        break;

      case "reservations":
        if (method === "GET" && !resourceId) result = (await supabase.from("pms_reservations").select("*, guest:pms_guests(*), room_type:pms_room_types(*), assigned_room:pms_rooms(*)").order("created_at", { ascending: false })).data;
        else if (method === "GET" && resourceId) result = (await supabase.from("pms_reservations").select("*, guest:pms_guests(*), room_type:pms_room_types(*), assigned_room:pms_rooms(*)").eq("id", resourceId).single()).data;
        else if (method === "POST") {
          requireRole(profile, "admin", "manager", "front_desk");
          const body = await req.json();
          const { data: rate } = await supabase.rpc("pms_calculate_rate", { p_room_type_id: body.room_type_id, p_check_in: body.check_in_date, p_check_out: body.check_out_date });
          const { data: avail } = await supabase.rpc("pms_check_availability", { p_room_type_id: body.room_type_id, p_check_in: body.check_in_date, p_check_out: body.check_out_date });
          if (!avail) throw new Error("No rooms available for selected dates");
          result = (await supabase.from("pms_reservations").insert([{ ...body, base_rate: rate, created_by: profile.id }]).select("*, guest:pms_guests(*), room_type:pms_room_types(*)").single()).data;
          await logAudit(profile.id as string, "CREATE_RESERVATION", "reservation", (result as {id: string}).id, "Reservation created");
        } else if (method === "PUT" && resourceId && subResource === "confirm") {
          requireRole(profile, "admin", "manager", "front_desk");
          result = (await supabase.from("pms_reservations").update({ status: "CONFIRMED", updated_at: new Date().toISOString() }).eq("id", resourceId).select("*, guest:pms_guests(*), room_type:pms_room_types(*)").single()).data;
          await logAudit(profile.id as string, "CONFIRM_RESERVATION", "reservation", resourceId, "Reservation confirmed");
        } else if (method === "PUT" && resourceId && subResource === "cancel") {
          requireRole(profile, "admin", "manager", "front_desk");
          result = (await supabase.from("pms_reservations").update({ status: "CANCELLED", updated_at: new Date().toISOString() }).eq("id", resourceId).select("*, guest:pms_guests(*), room_type:pms_room_types(*)").single()).data;
          await logAudit(profile.id as string, "CANCEL_RESERVATION", "reservation", resourceId, "Reservation cancelled");
        } else if (method === "PUT" && resourceId && subResource === "check-in") {
          requireRole(profile, "admin", "manager", "front_desk");
          const body = await req.json();
          const { data: res } = await supabase.from("pms_reservations").select("*, guest:pms_guests(*)").eq("id", resourceId).single();
          if (!res || res.status !== "CONFIRMED") throw new Error("Reservation must be CONFIRMED to check in");
          const { data: room } = await supabase.from("pms_rooms").select("status").eq("id", body.assigned_room_id).single();
          if (!room || !["AVAILABLE", "RESERVED"].includes(room.status)) throw new Error(`Room not available. Status: ${room?.status}`);
          await supabase.from("pms_rooms").update({ status: "OCCUPIED", updated_at: new Date().toISOString() }).eq("id", body.assigned_room_id);
          result = (await supabase.from("pms_reservations").update({ status: "CHECKED_IN", assigned_room_id: body.assigned_room_id, checked_in_by: profile.id, updated_at: new Date().toISOString() }).eq("id", resourceId).select("*, guest:pms_guests(*), room_type:pms_room_types(*), assigned_room:pms_rooms(*)").single()).data;
          await supabase.rpc("pms_add_room_charge", { p_reservation_id: resourceId });
          await logAudit(profile.id as string, "CHECK_IN", "reservation", resourceId, "Guest checked in");
        } else if (method === "PUT" && resourceId && subResource === "check-out") {
          requireRole(profile, "admin", "manager", "front_desk");
          const { data: res } = await supabase.from("pms_reservations").select("*, folio:pms_folios(*)").eq("id", resourceId).single();
          if (!res || res.status !== "CHECKED_IN") throw new Error("Reservation must be CHECKED_IN to check out");
          const folio = Array.isArray(res.folio) ? res.folio[0] : res.folio;
          if (folio && folio.balance > 0) throw new Error(`Outstanding balance: ${folio.balance}. Please settle first.`);
          if (res.assigned_room_id) {
            await supabase.from("pms_rooms").update({ status: "DIRTY", updated_at: new Date().toISOString() }).eq("id", res.assigned_room_id);
            await supabase.from("pms_housekeeping_tasks").insert([{ room_id: res.assigned_room_id, task_status: "PENDING", reason: "checkout", priority: "high" }]);
          }
          result = (await supabase.from("pms_reservations").update({ status: "CHECKED_OUT", checked_out_by: profile.id, updated_at: new Date().toISOString() }).eq("id", resourceId).select("*, guest:pms_guests(*), room_type:pms_room_types(*)").single()).data;
          if (folio) await supabase.from("pms_folios").update({ status: "SETTLED", updated_at: new Date().toISOString() }).eq("id", folio.id);
          await logAudit(profile.id as string, "CHECK_OUT", "reservation", resourceId, "Guest checked out");
        }
        break;

      case "housekeeping":
        if (method === "GET") result = (await supabase.from("pms_housekeeping_tasks").select("*, room:pms_rooms(*, room_type:pms_room_types(*))").order("created_at", { ascending: false })).data;
        else if (method === "PUT" && resourceId) {
          requireRole(profile, "admin", "manager", "housekeeping");
          const body = await req.json();
          const { data: task } = await supabase.from("pms_housekeeping_tasks").select("task_status, room_id").eq("id", resourceId).single();
          if (!task) throw new Error("Task not found");
          const updates: Record<string, unknown> = { task_status: body.task_status, updated_at: new Date().toISOString() };
          if (body.task_status === "IN_PROGRESS") updates.started_at = new Date().toISOString();
          if (body.task_status === "COMPLETED") updates.completed_at = new Date().toISOString();
          result = (await supabase.from("pms_housekeeping_tasks").update(updates).eq("id", resourceId).select("*, room:pms_rooms(*)").single()).data;
          if (body.task_status === "COMPLETED") await supabase.from("pms_rooms").update({ status: "AVAILABLE", last_cleaned_at: new Date().toISOString() }).eq("id", task.room_id);
          else if (body.task_status === "IN_PROGRESS") await supabase.from("pms_rooms").update({ status: "CLEANING" }).eq("id", task.room_id);
          await logAudit(profile.id as string, "UPDATE_HOUSEKEEPING", "housekeeping_task", resourceId, `Status: ${body.task_status}`);
        }
        break;

      case "folios":
        if (method === "GET" && !resourceId) result = (await supabase.from("pms_folios").select("*, guest:pms_guests(*), charges:pms_folio_charges(*), payments:pms_payments(*)").order("created_at", { ascending: false })).data;
        else if (method === "GET" && resourceId) result = (await supabase.from("pms_folios").select("*, guest:pms_guests(*), charges:pms_folio_charges(*), payments:pms_payments(*)").eq("id", resourceId).single()).data;
        else if (method === "POST" && resourceId && subResource === "charges") {
          requireRole(profile, "admin", "manager", "front_desk", "finance");
          const body = await req.json();
          result = (await supabase.from("pms_folio_charges").insert([{ folio_id: resourceId, ...body }]).select().single()).data;
          const { data: folio } = await supabase.from("pms_folios").select("subtotal, tax_amount, service_charge, total_amount, amount_paid, balance").eq("id", resourceId).single();
          if (folio) {
            const newSubtotal = folio.subtotal + (body.amount as number) * ((body.quantity as number) || 1);
            const newTax = newSubtotal * 0.1;
            const newService = newSubtotal * 0.05;
            const newTotal = newSubtotal + newTax + newService;
            await supabase.from("pms_folios").update({ subtotal: newSubtotal, tax_amount: newTax, service_charge: newService, total_amount: newTotal, balance: newTotal - folio.amount_paid }).eq("id", resourceId);
          }
          await logAudit(profile.id as string, "ADD_FOLIO_CHARGE", "folio", resourceId, `Added: ${body.description}`);
        }
        break;

      case "payments":
        if (method === "GET") result = (await supabase.from("pms_payments").select("*, folio:pms_folios(*)").order("created_at", { ascending: false })).data;
        else if (method === "POST") {
          requireRole(profile, "admin", "finance");
          const body = await req.json();
          result = (await supabase.from("pms_payments").insert([{ ...body, processed_by: profile.id, status: "VERIFIED", verified_at: new Date().toISOString() }]).select().single()).data;
          const { data: folio } = await supabase.from("pms_folios").select("balance, amount_paid, total_amount").eq("id", body.folio_id).single();
          if (folio) {
            const newPaid = folio.amount_paid + (body.amount as number);
            const newBalance = folio.total_amount - newPaid;
            await supabase.from("pms_folios").update({ amount_paid: newPaid, balance: newBalance, status: newBalance <= 0 ? "SETTLED" : "OPEN" }).eq("id", body.folio_id);
          }
          await logAudit(profile.id as string, "RECORD_PAYMENT", "payment", (result as {id: string}).id, `Payment: ${body.amount}`);
        }
        break;

      case "services":
        if (method === "GET") result = (await supabase.from("pms_services").select("*").eq("is_active", true).order("category")).data;
        break;

      case "dashboard":
        if (method === "GET") {
          const { count: totalRooms } = await supabase.from("pms_rooms").select("*", { count: "exact", head: true });
          const { count: availableRooms } = await supabase.from("pms_rooms").select("*", { count: "exact", head: true }).eq("status", "AVAILABLE");
          const { count: occupiedRooms } = await supabase.from("pms_rooms").select("*", { count: "exact", head: true }).eq("status", "OCCUPIED");
          const { count: dirtyRooms } = await supabase.from("pms_rooms").select("*", { count: "exact", head: true }).eq("status", "DIRTY");
          const { count: cleaningRooms } = await supabase.from("pms_rooms").select("*", { count: "exact", head: true }).eq("status", "CLEANING");
          const { count: maintenanceRooms } = await supabase.from("pms_rooms").select("*", { count: "exact", head: true }).eq("status", "MAINTENANCE");
          const { count: pendingRes } = await supabase.from("pms_reservations").select("*", { count: "exact", head: true }).eq("status", "PENDING");
          const { count: checkedInRes } = await supabase.from("pms_reservations").select("*", { count: "exact", head: true }).eq("status", "CHECKED_IN");
          const { count: pendingCleaning } = await supabase.from("pms_housekeeping_tasks").select("*", { count: "exact", head: true }).eq("task_status", "PENDING");
          const { count: inProgCleaning } = await supabase.from("pms_housekeeping_tasks").select("*", { count: "exact", head: true }).eq("task_status", "IN_PROGRESS");
          const occupancyRate = totalRooms ? ((occupiedRooms || 0) / totalRooms) * 100 : 0;
          result = {
            rooms: { total: totalRooms || 0, available: availableRooms || 0, occupied: occupiedRooms || 0, dirty: dirtyRooms || 0, cleaning: cleaningRooms || 0, maintenance: maintenanceRooms || 0 },
            reservations: { pending: pendingRes || 0, checkedIn: checkedInRes || 0 },
            housekeeping: { pending: pendingCleaning || 0, inProgress: inProgCleaning || 0 },
            occupancyRate: Math.round(occupancyRate * 10) / 10,
          };
        }
        break;

      case "audit-logs":
        if (method === "GET") {
          let q = supabase.from("pms_audit_logs").select("*, user:profiles(*)").order("created_at", { ascending: false }).limit(100);
          const rt = url.searchParams.get("resource_type");
          if (rt) q = q.eq("resource_type", rt);
          result = (await q).data;
        }
        break;

      default:
        throw new Error("Resource not found");
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("authorization") || message.includes("Insufficient") || message.includes("Invalid or expired") ? 401
      : message.includes("not available") || message.includes("must be") || message.includes("Cannot") || message.includes("Outstanding balance") ? 422
      : message.includes("Not found") || message.includes("Resource not found") ? 404
      : 500;
    return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  return handleRequest(req);
});
