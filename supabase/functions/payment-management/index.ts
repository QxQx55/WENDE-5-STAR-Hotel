import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentPayload {
  invoice_id: string;
  amount: number;
  payment_method: "Cash" | "Card" | "Mobile";
  transaction_reference?: string;
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

    // GET /payment-management - List payments
    if (method === "GET") {
      const invoiceId = url.searchParams.get("invoice_id");
      let query = `${supabaseUrl}/rest/v1/payments?select=*`;

      if (invoiceId) {
        query += `&invoice_id=eq.${invoiceId}`;
      }

      const response = await fetch(query, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${token}`,
        },
      });

      const payments = await response.json();
      return new Response(JSON.stringify({ payments }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /payment-management - Record payment
    if (method === "POST") {
      const payload: PaymentPayload = await req.json();

      // Get invoice to update status
      const invoiceResponse = await fetch(
        `${supabaseUrl}/rest/v1/invoices?id=eq.${payload.invoice_id}&select=total_amount,payment_status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const invoices = await invoiceResponse.json();
      if (!invoices[0]) {
        return new Response(
          JSON.stringify({ error: "Invoice not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const invoice = invoices[0];
      let newPaymentStatus = "Partial";
      if (payload.amount >= invoice.total_amount) {
        newPaymentStatus = "Paid";
      }

      // Record payment
      const paymentResponse = await fetch(`${supabaseUrl}/rest/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoice_id: payload.invoice_id,
          amount: payload.amount,
          payment_method: payload.payment_method,
          transaction_reference: payload.transaction_reference,
          paid_at: new Date().toISOString(),
        }),
      });

      if (!paymentResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to record payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update invoice status
      await fetch(
        `${supabaseUrl}/rest/v1/invoices?id=eq.${payload.invoice_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ payment_status: newPaymentStatus }),
        }
      );

      const payment = await paymentResponse.json();
      return new Response(
        JSON.stringify({
          message: "Payment recorded",
          payment,
          invoice_status: newPaymentStatus,
        }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
