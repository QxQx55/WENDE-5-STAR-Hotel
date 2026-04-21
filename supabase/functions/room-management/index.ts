import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RoomPayload {
  room_number: string;
  room_type: "Standard" | "Deluxe" | "Suite" | "Presidential";
  price_per_night: number;
  max_occupancy: number;
  floor: number;
  amenities?: string[];
  description?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;
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

    // GET /room-management?action=list - List all rooms
    if (method === "GET" && url.searchParams.get("action") === "list") {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rooms?select=*&limit=100`,
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
      return new Response(JSON.stringify({ rooms }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /room-management?action=available - List available rooms
    if (method === "GET" && url.searchParams.get("action") === "available") {
      const checkIn = url.searchParams.get("check_in");
      const checkOut = url.searchParams.get("check_out");

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rooms?status=eq.Available&select=*`,
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
      return new Response(JSON.stringify({ rooms }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /room-management - Create room (admin only)
    if (method === "POST") {
      const payload: RoomPayload = await req.json();

      const response = await fetch(`${supabaseUrl}/rest/v1/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_number: payload.room_number,
          room_type: payload.room_type,
          price_per_night: payload.price_per_night,
          max_occupancy: payload.max_occupancy,
          floor: payload.floor,
          amenities: payload.amenities || [],
          status: "Available",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return new Response(JSON.stringify({ error: error.message || "Failed to create room" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const room = await response.json();
      return new Response(JSON.stringify({ message: "Room created", room }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /room-management?id=<roomId> - Update room (admin only)
    if (method === "PUT") {
      const roomId = url.searchParams.get("id");
      if (!roomId) {
        return new Response(
          JSON.stringify({ error: "Room ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload = await req.json();

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to update room" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ message: "Room updated" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /room-management?id=<roomId> - Delete room (admin only)
    if (method === "DELETE") {
      const roomId = url.searchParams.get("id");
      if (!roomId) {
        return new Response(
          JSON.stringify({ error: "Room ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to delete room" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ message: "Room deleted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
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
