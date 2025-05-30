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
    
    // Track AI prompt sent event
    LogRocket.track('ai_prompt_sent', {
      provider: 'vortex-ai',
      promptLength: message.length,
      historyLength: messages.length
    });
    
    try {
      // Prepare conversation history for the API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Simple heuristic: if the user appears to want live data, ask the router for real‑time mode
      const wantRealtime = /today|current|latest|now|price|index|market|exchange rate/i.test(message);

      // Get auth token if authenticated
      let authHeaders = {};
      if (isAuthenticated) {
        const token = await getAccessToken();
        if (token) {
          authHeaders = {
            Authorization: `Bearer ${token}`
          };
        }
      }

      // --- Streamed request to ai‑router ---
      // Use the correct way to access Supabase URL
      const SUPABASE_URL = process.env.SUPABASE_URL || 'https://muyhurqfcsjqtnbozyir.supabase.co';
      const endpoint = `${SUPABASE_URL}/functions/v1/ai-router`;

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
      let assistantText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });

        // Push incremental content into the last assistant bubble
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantText };
          return updated;
        });
      }
    } catch (error) {
      console.error("Error in OpenAI chat:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
            <Sparkles className="h-5 w-5" />
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
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 min-h-[60px] resize-none"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button type="submit" size="icon" className="h-10 w-10" disabled={isLoading || !message.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs">
              Clear Chat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
