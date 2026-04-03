import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            { role: "system", content: "You are a career advisor AI and ATS (Applicant Tracking System) expert. Analyze the resume and provide:\n1) ATS Score (0-100) based on: keyword optimization, formatting, section structure, skills relevance, experience clarity, education details, measurable achievements, and action verbs usage.\n2) A brief summary of strengths\n3) Key skills identified\n4) Areas for improvement\n5) Suggested internship domains\n\nYou MUST start your response with exactly this format on the first line:\nATS_SCORE: <number>\n\nThen continue with the rest of your analysis in markdown format." },
            { role: "user", content: `Analyze this resume for ATS compatibility and career advice:\n\n${resume_text}` },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI service temporarily unavailable");
      }

      const data = await response.json();
      const fullAnalysis = data.choices?.[0]?.message?.content || "Unable to analyze resume.";
      
      // Extract ATS score from the response
      let atsScore = 0;
      let analysis = fullAnalysis;
      const scoreMatch = fullAnalysis.match(/ATS_SCORE:\s*(\d+)/);
      if (scoreMatch) {
        atsScore = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));
        analysis = fullAnalysis.replace(/ATS_SCORE:\s*\d+\s*\n?/, "").trim();
      }
      
      return new Response(JSON.stringify({ analysis, ats_score: atsScore }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      throw new Error("AI service temporarily unavailable");
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
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
