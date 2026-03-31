import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { z } from "https://esm.sh/zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ADMIN_EMAILS = ["nileshchatap25@gmail.com"];
const MAX_ATTEMPTS = 5;

const BodySchema = z.object({
  email: z.string().email().max(255),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, otp } = parsed.data;

    if (!ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Unauthorized email" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the latest OTP for this email
    const { data: otpRecord, error: fetchError } = await supabase
      .from("admin_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "No OTP found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from("admin_otps").delete().eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: "OTP has expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await supabase.from("admin_otps").delete().eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: "Too many failed attempts. Please request a new OTP." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP hash
    const otpHash = await hashOTP(otp);
    if (otpHash !== otpRecord.otp_hash) {
      // Increment attempts
      await supabase
        .from("admin_otps")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      const remaining = MAX_ATTEMPTS - otpRecord.attempts - 1;
      return new Response(
        JSON.stringify({ 
          error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP is valid - mark as verified and clean up
    await supabase.from("admin_otps").delete().eq("email", email.toLowerCase());

    // Check if user exists and has admin role
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const adminUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!adminUser) {
      return new Response(
        JSON.stringify({ error: "Admin account not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "You do not have admin privileges" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a session for the admin user
    // Use generateLink to create a magic link, then extract the token
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase(),
    });

    if (linkError || !linkData) {
      console.error("Failed to generate session link:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to create admin session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the token hash from the generated link properties
    const tokenHash = linkData.properties?.hashed_token;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "OTP verified successfully",
        token_hash: tokenHash,
        email: email.toLowerCase(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
