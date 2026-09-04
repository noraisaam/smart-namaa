import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const systemPrompt = `You are the AI Agronomist Assistant for the NAMAA (نماء) precision agriculture platform.
You have two personas that the user can switch between:
1. Ghaith (غيث): Friendly, practical, expert male agronomy advisor.
2. Nada (ندى): Precise, analytical, highly technical female agronomy advisor.
Your Expertise & Domain Constraints:
- You specialize ONLY in precision agriculture, sub-surface 7-in-1 soil sensors (N, P, K, EC, Temp, pH, Moisture/VWC), micro-topography dynamics, and sustainable farming.
- Ground all recommendations in verified FAO agronomic guidelines, soil science, and scientific formulas.
- Always translate raw sensor data into clear, human-friendly, practical instructions for farmers (e.g., advising on exact meter priority, timing fertilizer based on 2nd-layer moisture to prevent nutrient leaching, and managing water scarcity).
- If the user asks non-agricultural questions, politely redirect them back to farm and soil management.
- Keep tone helpful, professional, and empathetic to farmers' practical needs.`;

interface ChatRequest {
  persona: "ghaith" | "nada";
  messages: { role: "user" | "assistant"; content: string }[];
  userApiKey?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function simulatedReply(persona: "ghaith" | "nada", messages: ChatRequest["messages"]): string {
  const latest = messages[messages.length - 1]?.content.toLowerCase() ?? "";
  const greeting = persona === "nada"
    ? "I'm Nada (ندى), using the NAMAA simulated agronomy dataset."
    : "I'm Ghaith (غيث), using the NAMAA simulated field dataset.";

  if (latest.includes("water") || latest.includes("irrigat") || latest.includes("rain")) {
    return `${greeting}\n\n**Current recommendation:** Prioritize Meter 6 first (19% VWC, high elevation, west-facing), then Meter 1 (24% VWC, southwest-facing). Rain is expected in approximately 2h45m, so use reduced irrigation doses before the event and hold the remaining meters.\n\nThis is simulated guidance. Connect an OpenAI key for live agronomy responses.`;
  }

  if (latest.includes("fertil") || latest.includes("nitrogen") || latest.includes("phosph") || latest.includes("potass") || latest.includes("salin")) {
    return `${greeting}\n\n**Soil nutrition snapshot:** Meter 3 has low Phosphorus (9 mg/kg), low Potassium (120 mg/kg), and high EC (7.2 mS/cm). Hold Nitrogen and delay fertilizer until after the incoming rain and drainage. Recheck EC before applying nutrients.\n\nThis is simulated guidance. Connect an OpenAI key for live agronomy responses.`;
  }

  return `${greeting}\n\nI can help review simulated NAMAA readings for **N, P, K, EC, soil temperature, pH, and VWC** across Meters 1–6. Ask about irrigation priority, incoming rain, fertilizer timing, salinity, or water scarcity.\n\nThis is simulated guidance. Connect an OpenAI key for live agronomy responses.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "Only POST requests are supported." }, 405);

    const body = await req.json() as ChatRequest;
    const persona = body.persona === "nada" ? "nada" : "ghaith";
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const userApiKey = typeof body.userApiKey === "string" ? body.userApiKey.trim() : "";
    const apiKey = userApiKey || Deno.env.get("OPENAI_API_KEY");

    if (messages.length === 0 || messages.length > 40) return json({ error: "A conversation with 1 to 40 messages is required." }, 400);
    if (!apiKey) return json({ content: simulatedReply(persona, messages), mode: "simulated" });

    const personaInstruction = persona === "nada"
      ? "Speak as Nada (ندى): precise, analytical, highly technical, while remaining clear for farmers."
      : "Speak as Ghaith (غيث): friendly, practical, expert, and action-oriented for farmers.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: "system", content: `${systemPrompt}\n\nActive persona: ${personaInstruction}` },
          ...messages,
        ],
      }),
    });

    const result = await response.json() as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
    if (!response.ok) return json({ error: result.error?.message || "OpenAI could not complete the request." }, response.status >= 500 ? 502 : response.status);

    const content = result.choices?.[0]?.message?.content;
    if (!content) return json({ error: "OpenAI returned an empty response." }, 502);
    return json({ content });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to process the chat request." }, 500);
  }
});
