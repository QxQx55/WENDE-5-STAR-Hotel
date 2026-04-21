import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("authorization");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Get dashboard metrics
    if (url.searchParams.get("action") === "dashboard") {
      // Total bookings
      const bookingsRes = await fetch(
        `${supabaseUrl}/rest/v1/reservations?select=count()`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Total revenue
      const invoicesRes = await fetch(
        `${supabaseUrl}/rest/v1/invoices?select=total_amount`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Active rooms
      const roomsRes = await fetch(
        `${supabaseUrl}/rest/v1/rooms?status=eq.Occupied&select=count()`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Total guests
      const guestsRes = await fetch(
        `${supabaseUrl}/rest/v1/guests?select=count()`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Total users
      const usersRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=count()`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const bookings = await bookingsRes.json();
      const invoices = await invoicesRes.json();
      const rooms = await roomsRes.json();
      const guests = await guestsRes.json();
      const users = await usersRes.json();

      const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

      return new Response(
        JSON.stringify({
          metrics: {
            total_bookings: bookings[0]?.count || 0,
            total_revenue: totalRevenue,
            occupied_rooms: rooms[0]?.count || 0,
            total_guests: guests[0]?.count || 0,
            total_users: users[0]?.count || 0,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get revenue analytics
    if (url.searchParams.get("action") === "revenue") {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/payments?select=amount,payment_method,paid_at&order=paid_at.desc&limit=50`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const payments = await response.json();
      return new Response(JSON.stringify({ payments }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get occupancy analytics
    if (url.searchParams.get("action") === "occupancy") {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rooms?select=room_number,status,room_type`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const rooms = await response.json();

      const stats = {
        available: rooms.filter((r: any) => r.status === "Available").length,
        occupied: rooms.filter((r: any) => r.status === "Occupied").length,
        cleaning: rooms.filter((r: any) => r.status === "Cleaning").length,
        maintenance: rooms.filter((r: any) => r.status === "Maintenance").length,
        total: rooms.length,
        occupancy_rate: ((rooms.filter((r: any) => r.status === "Occupied").length / rooms.length) * 100).toFixed(2),
      };

      return new Response(JSON.stringify({ stats }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
