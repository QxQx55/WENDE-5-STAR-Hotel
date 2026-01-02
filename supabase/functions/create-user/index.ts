import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.auth.admin.createUser({
      email: "New@hotel.com",
      password: "New123456",
      email_confirm: true,
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: data.user.id,
            email: "demo@hotel.com",
            full_name: "Demo Admin",
            role: "admin",
          },
        ]);

      if (profileError) throw profileError;
    }

    return new Response(
      JSON.stringify({
        message: "User created successfully",
        email: "demo@hotel.com",
        password: "Demo123456",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
