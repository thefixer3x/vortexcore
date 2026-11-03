// Lovable AI Gateway — OpenAI Responses via the Vercel AI SDK (server-only).
import { createOpenAI } from "npm:@ai-sdk/openai@4";
import { jsonSchema, Output, streamText, type ModelMessage } from "npm:ai@7";

import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id.ts";

export const GATEWAY_URL = "https://ai.gateway.lovable.dev";
export const DEFAULT_CHAT_MODEL = "openai/gpt-6-astra";

/** Create a request-scoped Responses provider that resends the gateway run id. */
export function createResponsesProvider(request: Request, apiKey: string) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: `${GATEWAY_URL}/v1`,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return { provider, runIdFetch };
}

/**
 * Stream a structured-output Responses call and return the parsed object.
 * Throws an Error with a `status` property for gateway failures.
 */
export async function streamStructured<T>(
  request: Request,
  apiKey: string,
  opts: { instructions: string; messages: ModelMessage[]; schema: Record<string, unknown>; name: string },
): Promise<T> {
  const { provider } = createResponsesProvider(request, apiKey);
  let streamError: unknown;
  const result = streamText({
    model: provider.responses(DEFAULT_CHAT_MODEL),
    instructions: opts.instructions,
    messages: opts.messages,
    abortSignal: request.signal,
    output: Output.object({ schema: jsonSchema(opts.schema), name: opts.name }),
    onError: ({ error }) => { streamError = error; },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  // Drain the stream so errors surface, then read the parsed object.
  for await (const _ of result.fullStream) { /* consume */ }
  if (streamError) throw toGatewayError(streamError);
  try {
    return (await result.output) as T;
  } catch (e) {
    throw toGatewayError(e);
  }
}

export function toGatewayError(e: unknown): Error & { status: number } {
  const anyErr = e as { statusCode?: number; status?: number; message?: string; name?: string };
  const status = anyErr?.statusCode ?? anyErr?.status ?? (anyErr?.name === "AbortError" ? 499 : 502);
  const message = status === 429 ? "VortexAI is busy. Please try again shortly."
    : status === 402 ? "VortexAI credits are exhausted. Please contact the app owner."
    : status === 403 ? "VortexAI access is blocked. Please contact the app owner."
    : status === 499 ? "Request cancelled."
    : "VortexAI couldn't read this file.";
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}
