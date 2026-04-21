import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UserUpdatePayload {
  full_name?: string;
  phone?: string;
  bio?: string;
  profile_image_url?: string;
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

    // GET /user-management - Get all users (admin only)
    if (method === "GET" && url.searchParams.get("action") === "list") {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=id,email,full_name,role,phone,created_at&limit=100`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const users = await response.json();
      return new Response(JSON.stringify({ users }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /user-management?id=<userId> - Get user profile
    if (method === "GET" && url.searchParams.get("id")) {
      const userId = url.searchParams.get("id");

      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profiles = await response.json();
      if (!profiles[0]) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ user: profiles[0] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /user-management?id=<userId> - Update user profile
    if (method === "PUT") {
      const userId = url.searchParams.get("id");
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "User ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload: UserUpdatePayload = await req.json();

      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: payload.full_name,
            phone: payload.phone,
            bio: payload.bio,
            profile_image_url: payload.profile_image_url,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to update user profile" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ message: "User profile updated" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /user-management?id=<userId> - Deactivate user (admin only)
    if (method === "DELETE") {
      const userId = url.searchParams.get("id");
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "User ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete user profile (will cascade delete user)
      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
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
          JSON.stringify({ error: "Failed to delete user" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ message: "User deleted" }), {
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
