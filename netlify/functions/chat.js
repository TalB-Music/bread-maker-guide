export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();

  // Convert Anthropic format → Gemini format
  const geminiBody = {
    system_instruction: body.system
      ? { parts: [{ text: body.system }] }
      : undefined,
    contents: body.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: body.max_tokens ?? 1000 },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    }
  );

  const data = await response.json();

  // Convert Gemini response → Anthropic format so the frontend needs no changes
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

  const anthropicFormat = {
    content: [{ type: "text", text }],
  };

  return new Response(JSON.stringify(anthropicFormat), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/chat" };
