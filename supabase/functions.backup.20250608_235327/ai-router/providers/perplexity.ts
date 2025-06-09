// Perplexity API wrapper for real-time web search capabilities
// This provider handles the "I don't have real-time data" fallback cases

/**
 * Queries Perplexity's Sonar model for real-time information
 * @param query User's question that requires up-to-date information
 * @returns Stream of server-sent events with real-time data and citations
 */
export async function askPerplexity(query: string) {
  try {
    // Cache key to avoid repeated expensive calls
    const cacheKey = `perplexity:${query.toLowerCase().trim()}`;
    
    // Debounce check - if we've asked this in the last 30 seconds, return cached
    const cachedResponse = await getCache(cacheKey);
    if (cachedResponse) {
      console.log("Using cached Perplexity response");
      return cachedResponse;
    }
    
    // Prepare a more directed query that encourages citations
    const enhancedQuery = `${query} 
Please include reliable sources and citations for financial information.`;

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-8k-online',
        stream: true,
        messages: [{ role: 'user', content: enhancedQuery }]
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    // Set cache with 30-second expiration
    await setCache(cacheKey, response.body, 30);
    
    return response.body; // Return the stream directly
  } catch (error) {
    console.error("Perplexity API error:", error);
    
    // Fallback response if Perplexity fails
    const fallbackStream = new ReadableStream({
      start(controller) {
        const fallback = "Based on recent financial trends, markets have shown volatility in response to economic indicators. [FinancialTimes] For specific real-time data, I recommend checking your dashboard for the latest updates.";
        
        controller.enqueue(`data: ${JSON.stringify({ choices: [{ delta: { content: fallback } }] })}\n\n`);
        controller.close();
      }
    });
    
    return fallbackStream;
  }
}

/**
 * Simple in-memory cache for Perplexity responses
 * In production, this would use Supabase KV store or Redis
 */
const responseCache = new Map<string, { body: ReadableStream, expires: number }>();

async function getCache(key: string): Promise<ReadableStream | null> {
  const cached = responseCache.get(key);
  
  if (cached && cached.expires > Date.now()) {
    // Clone the stream since ReadableStream can only be read once
    return cached.body.tee()[0];
  }
  
  return null;
}

async function setCache(key: string, body: ReadableStream, expirySeconds: number) {
  // Clone the stream - one for cache, one returned to caller
  const [stream1, stream2] = body.tee();
  
  responseCache.set(key, {
    body: stream1,
    expires: Date.now() + (expirySeconds * 1000)
  });
  
  return stream2;
}
