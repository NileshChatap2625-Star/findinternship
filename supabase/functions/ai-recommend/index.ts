import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skills, resume_text, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (type === "analyze") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a career advisor AI. Analyze the resume and provide: 1) A brief summary of strengths 2) Key skills identified 3) Areas for improvement 4) Suggested internship domains. Format with markdown." },
            { role: "user", content: `Analyze this resume:\n\n${resume_text}` },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error: ${status}`);
      }

      const data = await response.json();
      const analysis = data.choices?.[0]?.message?.content || "Unable to analyze resume.";
      return new Response(JSON.stringify({ analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Recommend internships
    const prompt = `Based on these skills: ${(skills || []).join(", ")}${resume_text ? `\n\nResume: ${resume_text}` : ""}\n\nProvide exactly 6 internship recommendations. For each, return a JSON object with "title", "role", and "reason" fields. Also provide skill improvement suggestions.\n\nReturn a JSON object with two keys: "recommendations" (array of objects) and "skill_suggestions" (string with markdown formatted suggestions).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an internship recommendation AI. Always respond with valid JSON only, no markdown code blocks." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_recommendations",
            description: "Provide internship recommendations and skill suggestions",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      role: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["title", "role", "reason"],
                  },
                },
                skill_suggestions: { type: "string" },
              },
              required: ["recommendations", "skill_suggestions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "provide_recommendations" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ recommendations: [], skill_suggestions: "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-recommend error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
