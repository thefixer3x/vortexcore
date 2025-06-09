
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication if enabled in config.toml (verify_jwt = true)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Authorization header is required. Make sure you're authenticated.");
    }

    // Get the Gemini API key from environment variables
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API Key not configured in Supabase Secrets");
    }

    // Parse the request body
    const { prompt, systemPrompt, history, model = "gemini-pro" } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing request to Gemini AI with model: ${model}, prompt: ${prompt}`);

    // Prepare the request URL and body based on the requested model
    const isGemini2Model = model.startsWith("gemini-2");
    const apiEndpoint = isGemini2Model
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
      : `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    let requestBody;

    if (isGemini2Model) {
      // Format for Gemini 2.0 models
      requestBody = {
        contents: [
          {
            parts: [
              { text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };

      // Add history if provided
      if (history && Array.isArray(history) && history.length > 0) {
        requestBody.contents = history.map(msg => ({
          parts: [{ text: msg.content }],
          role: msg.role === 'user' ? 'user' : 'model'
        }));
        
        // Add the current prompt as the latest message
        requestBody.contents.push({
          parts: [{ text: prompt }],
          role: 'user'
        });
      }
    } else {
      // Format for Gemini 1.0 models (gemini-pro, etc.)
      requestBody = {
        contents: [
          {
            parts: [
              { text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };

      // Add history if provided
      if (history && Array.isArray(history) && history.length > 0) {
        const formattedHistory = [];
        
        for (const msg of history) {
          formattedHistory.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
        
        // Add current message
        formattedHistory.push({
          role: 'user',
          parts: [{ text: prompt }]
        });
        
        requestBody.contents = formattedHistory;
      }
    }

    console.log("Sending request to Gemini API:", JSON.stringify(requestBody, null, 2));

    // Make the request to Gemini API
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Parse and handle the response
    const data = await response.json();
    console.log("Received response from Gemini API:", JSON.stringify(data, null, 2));

    let text = "";
    
    // Extract the generated text based on model version
    if (isGemini2Model) {
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        text = data.candidates[0].content.parts[0].text;
      }
    } else {
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        text = data.candidates[0].content.parts[0].text;
      }
    }

    if (!text && data.error) {
      throw new Error(data.error.message || "Failed to get response from Gemini API");
    }

    console.log("Successfully processed Gemini AI response");

    return new Response(
      JSON.stringify({ response: text }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in gemini-ai function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred while processing your request",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
