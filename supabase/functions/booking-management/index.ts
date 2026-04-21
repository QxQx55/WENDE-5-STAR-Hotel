import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingPayload {
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  special_requests?: string;
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

    // GET /booking-management - List bookings
    if (method === "GET" && url.searchParams.get("action") !== "create-invoice") {
      const userId = url.searchParams.get("user_id");
      let query = `${supabaseUrl}/rest/v1/reservations?select=*,room_id(room_number,room_type,price_per_night)&limit=100`;

      if (userId) {
        query += `&created_by=eq.${userId}`;
      }

      const response = await fetch(query, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${token}`,
        },
      });

      const bookings = await response.json();
      return new Response(JSON.stringify({ bookings }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /booking-management - Create booking
    if (method === "POST" && url.searchParams.get("action") !== "create-invoice") {
      const payload: BookingPayload = await req.json();

      // Get room price
      const roomResponse = await fetch(
        `${supabaseUrl}/rest/v1/rooms?id=eq.${payload.room_id}&select=price_per_night`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const rooms = await roomResponse.json();
      if (!rooms[0]) {
        return new Response(
          JSON.stringify({ error: "Room not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const checkIn = new Date(payload.check_in_date);
      const checkOut = new Date(payload.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * parseFloat(rooms[0].price_per_night);

      const response = await fetch(`${supabaseUrl}/rest/v1/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guest_id: payload.guest_id,
          room_id: payload.room_id,
          check_in_date: payload.check_in_date,
          check_out_date: payload.check_out_date,
          number_of_guests: payload.number_of_guests,
          special_requests: payload.special_requests,
          status: "Pending",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return new Response(
          JSON.stringify({ error: error.message || "Failed to create booking" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const booking = await response.json();

      return new Response(
        JSON.stringify({
          message: "Booking created",
          booking,
          total_price: totalPrice,
          nights,
        }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // PUT /booking-management?id=<bookingId> - Update booking status
    if (method === "PUT") {
      const bookingId = url.searchParams.get("id");
      if (!bookingId) {
        return new Response(
          JSON.stringify({ error: "Booking ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload = await req.json();

      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations?id=eq.${bookingId}`,
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
          JSON.stringify({ error: "Failed to update booking" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ message: "Booking updated" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /booking-management?id=<bookingId> - Cancel booking
    if (method === "DELETE") {
      const bookingId = url.searchParams.get("id");
      if (!bookingId) {
        return new Response(
          JSON.stringify({ error: "Booking ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations?id=eq.${bookingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "Cancelled" }),
        }
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to cancel booking" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ message: "Booking cancelled" }), {
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
