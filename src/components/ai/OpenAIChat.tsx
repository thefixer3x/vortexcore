import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LogRocket from "logrocket";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function OpenAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to VortexCore! How can I assist you with your financial needs today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { getAccessToken, isAuthenticated } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: message,
    };

    // Push user message and a placeholder assistant bubble for streaming
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);
    setMessage("");
    setIsLoading(true);

    try {
      LogRocket.track("ai_prompt_sent", {
        provider: "vortex_router",
        promptLength: userMessage.content.length,
        historyLength: messages.length,
      });

      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const wantRealtime = /today|current|latest|now|price|index|market|exchange rate/i.test(
        userMessage.content
      );

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isAuthenticated) {
        const token = await getAccessToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseAnonKey) headers["apikey"] = supabaseAnonKey;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL");
      const endpoint = `${supabaseUrl}/functions/v1/ai-router`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [...history, userMessage],
          model: "gpt-4o-mini",
          wantRealtime,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to connect to VortexAI";
        if (response.status === 404) {
          errorMessage =
            "AI assistant is temporarily unavailable. Our team is working to restore service.";
        } else if (response.status === 500) {
          errorMessage =
            "AI assistant is experiencing technical difficulties. Please try again in a few moments.";
        } else if (response.status === 403) {
          errorMessage =
            "AI assistant access is currently restricted. Please check your account status.";
        } else {
          errorMessage = `AI assistant is temporarily unavailable (Error ${response.status}). Please try again later.`;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content:
              data.response ||
              "I apologize, but I couldn't generate a response at this time.",
          };
          return updated;
        });
      } else if (contentType.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Response body is not readable");

        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const payload = trimmed.replace(/^data:\s*/, "");
            if (payload === "[DONE]") {
              buffer = "";
              break;
            }
            try {
              const json = JSON.parse(payload);
              if (json.choices?.[0]?.delta?.content) {
                assistantText += json.choices[0].delta.content;
              } else if (json.response) {
                assistantText = json.response;
              } else if (typeof json === "string") {
                assistantText += json;
              } else if (json.content) {
                assistantText += json.content;
              }
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantText,
                };
                return updated;
              });
            } catch {
              if (payload !== "[DONE]") {
                assistantText += payload;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantText,
                  };
                  return updated;
                });
              }
            }
          }
        }
      } else {
        const text = await response.text();
        let assistantText =
          "I received a response, but it was in an unexpected format.";
        try {
          const data = JSON.parse(text);
          if (data.response) assistantText = data.response;
        } catch {
          if (text && text.length < 1000) assistantText = text;
        }
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantText };
          return updated;
        });
      }

      setRetryCount(0);
    } catch (error) {
      console.error("Error in OpenAI chat:", error);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) return prev.slice(0, -1);
        return prev;
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error while processing your request. Please try again.",
        },
      ]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      setRetryCount((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      setMessage(lastUserMessage.content);
    }
  };

  const toggleMinimize = () => setIsMinimized((v) => !v);

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Welcome to VortexCore! How can I assist you with your financial needs today?",
      },
    ]);
    setRetryCount(0);
    toast({ title: "Chat cleared", description: "All messages have been cleared" });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 p-0 bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        <Button
          onClick={toggleMinimize}
          className="rounded-full h-14 w-14 p-0 bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <div className="mb-2 w-80 md:w-96 bg-card rounded-lg shadow-lg border border-border overflow-hidden flex flex-col max-h-[500px]">
        <div className="bg-primary p-3 text-primary-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
              <img src="/favicon.svg" alt="VortexAI" className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-medium">VortexAI Assistant</h3>
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-primary-foreground"
              onClick={toggleMinimize}
              title="Minimize"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-primary-foreground"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 min-h-[300px]">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                }`}
              >
                {msg.content || (isLoading && index === messages.length - 1 ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  ""
                ))}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />

          {retryCount > 0 && !isLoading && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-3 border-t">
          <div className="relative flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 min-h-[60px] resize-none pr-10"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (message.trim()) handleSendMessage(e);
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {isLoading ? "Sending..." : "⏎ to send"}
              </span>
            </div>
            <Button type="submit" size="icon" className="h-10 w-10 self-end" disabled={isLoading || !message.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-muted-foreground ml-1">Shift+Enter for new line</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                clearChat();
              }}
              className="text-xs"
            >
              Clear Chat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
