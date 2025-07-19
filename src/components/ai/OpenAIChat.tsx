import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Send, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  X,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogRocket from "logrocket";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function OpenAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to VortexCore! How can I assist you with your financial needs today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { getAccessToken, isAuthenticated } = useAuth();

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: message,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    
    try {
      // Track AI prompt sent event
      LogRocket.track('ai_prompt_sent', {
        provider: 'vortex-ai',
        promptLength: message.length,
        historyLength: messages.length
      });
      
      // Prepare conversation history for the API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get auth token if authenticated
      // Heuristic to decide if the user is asking for live‑data answers
      const wantRealtime = /today|current|latest|now|price|index|market|exchange rate/i.test(message);
      let authHeaders = {};
      if (isAuthenticated) {
        const token = await getAccessToken();
        if (token) {
          authHeaders = {
            Authorization: `Bearer ${token}`
          };
        }
      }

      // Get location if needed (removed for now to prevent errors)
      // const location = await getLocation();
      
      // Use the Supabase client's URL
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL || 'https://muyhurqfcsjqtnbozyir.supabase.co'}/functions/v1/ai-router`;

      // Add a placeholder assistant bubble so the UI can live‑update
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: message }],
          // location: location, // Removed for now
          model: 'gpt-4', // Default model
          wantRealtime
        })
      });

      if (!res.ok || !res.body) {
        toast({
          title: 'VortexAI Error',
          description: 'Failed to connect to VortexAI',
          variant: 'destructive'
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split on newlines to get complete SSE frames
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const payload = trimmed.replace(/^data:\s*/, '');
          if (payload === '[DONE]') {
            buffer = '';
            break;
          }

          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              assistantText += delta;
              // Update the last assistant bubble incrementally
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            }
          } catch {
            // If it isn't valid JSON, just append raw text
            assistantText += payload;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantText };
              return updated;
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in OpenAI chat:", error);
      
      // Remove the loading message if it exists
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'assistant' && !lastMessage.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'I\'m sorry, I encountered an error while processing your request. Please try again.' 
        }
      ]);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const clearChat = () => {
    setMessages([
      { role: "assistant", content: "Welcome to VortexCore! How can I assist you with your financial needs today?" }
    ]);
    toast({
      title: "Chat cleared",
      description: "All messages have been cleared",
    });
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
              <img 
                src="/favicon.svg" 
                alt="VortexAI" 
                className="h-5 w-5 text-primary-foreground" 
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('span');
                  fallback.className = 'text-sm font-bold text-primary-foreground';
                  fallback.textContent = 'V';
                  target.parentNode?.appendChild(fallback);
                }}
              />
            </div>
            <h3 className="font-medium">VortexAI Assistant</h3>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground" onClick={toggleMinimize} title="Minimize">
              <ChevronDown className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground" onClick={() => setIsOpen(false)} title="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 min-h-[300px]">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground ml-auto" 
                    : "bg-muted"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (message.trim()) {
                    handleSendMessage(e);
                  }
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {isLoading ? 'Sending...' : '⏎ to send'}
              </span>
            </div>
            <Button 
              type="submit" 
              size="icon" 
              className="h-10 w-10 self-end" 
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-muted-foreground ml-1">
              Shift+Enter for new line
            </span>
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
