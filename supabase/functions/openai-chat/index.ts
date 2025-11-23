import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { withPublicMiddleware } from "../_shared/middleware.ts";
serve(withPublicMiddleware(async (req)=>{
  try {
    // Get the OpenAI API key from environment variables
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(JSON.stringify({
        error: "OpenAI service is not configured. Please contact support."
      }), { 
        status: 503, 
        headers: { "Content-Type": "application/json" } 
      });
    }
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body as JSON:", parseError);
      return new Response(JSON.stringify({
        error: "Invalid JSON in request body"
      }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const { prompt, systemPrompt, history } = body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({
        error: "A valid prompt is required"
      }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    console.log(`Processing request to OpenAI with prompt: ${prompt}`);
    // Format messages for OpenAI API
    let messages = [];
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt
      });
    } else {
      messages.push({
        role: "system",
        content: "You are VortexAI, a helpful assistant that provides financial advice and information about VortexCore's banking aggregation platform."
      });
    }
    // Add history if provided
    if (history && Array.isArray(history) && history.length > 0) {
      messages = messages.concat(history.map((msg)=>({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })));
    }
    // Add the current prompt as the latest message
    messages.push({
      role: "user",
      content: prompt
    });
    console.log("Sending request to OpenAI API:", JSON.stringify({
      messages
    }));
    // Make the request to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    // Parse and handle the response
    const data = await response.json();
    console.log("Received response from OpenAI API:", JSON.stringify(data));
    if (data.error) {
      throw new Error(data.error.message || "Failed to get response from OpenAI API");
    }
    const text = data.choices[0].message.content;
    console.log("Successfully processed OpenAI response");
    return new Response(JSON.stringify({ response: text }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in openai-chat function:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred while processing your request", details: error.toString() }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}));
