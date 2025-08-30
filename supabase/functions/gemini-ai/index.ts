import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { withAuthMiddleware } from "../_shared/middleware.ts";

serve(withAuthMiddleware(async (req) => {
  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("Gemini API Key not configured in Supabase Secrets");

    const { prompt, systemPrompt, history, model = "gemini-pro" } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const isGemini2Model = model.startsWith("gemini-2");
    const apiEndpoint = isGemini2Model
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
      : `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    let contents: any[] = [];
    if (history && Array.isArray(history) && history.length > 0) {
      if (isGemini2Model) {
        contents = history.map((msg: any) => ({ parts: [{ text: msg.content }], role: msg.role === 'user' ? 'user' : 'model' }));
      } else {
        contents = history.map((msg: any) => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] }));
      }
    }
    contents.push(isGemini2Model ? { parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }], role: 'user' } : { role: 'user', parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }] });

    const requestBody = { contents, generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 } };

    const response = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
    const data = await response.json();
    let text = '';
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) text = data.candidates[0].content.parts[0].text;
    if (!text && data.error) throw new Error(data.error.message || "Failed to get response from Gemini API");

    return new Response(JSON.stringify({ response: text }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in gemini-ai function:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred while processing your request" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}, ['POST'])));

