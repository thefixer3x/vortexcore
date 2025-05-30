import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Loader2, Send, Bot, User, Settings, Globe, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import LogRocket from "logrocket";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface Citation {
  text: string;
  url: string;
}

// Perplexity model options with business-friendly naming
const PERPLEXITY_MODELS = [
  { value: 'sonar-8k-online', label: 'VortexAI Realtime', description: 'Real-time data with web search' },
  { value: 'sonar-small-online', label: 'VortexAI Express', description: 'Faster responses with web search' },
  { value: 'mixtral-8x7b-instruct', label: 'VortexAI Advanced', description: 'Complex financial reasoning' },
  { value: 'claude-3-sonnet-20240229', label: 'VortexAI Analyst', description: 'Detailed financial analysis' }
];

export function PerplexityAIChat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Welcome to VortexAI Realtime. I can provide financial information, market data, and business insights with real-time information from the web. How can I assist you today?"
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<string>("sonar-8k-online");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { getAccessToken, isAuthenticated } = useAuth();

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    // Track analytics
    LogRocket.track('ai_prompt_sent', {
      provider: 'perplexity',
      model: model,
      promptLength: prompt.length,
      historyLength: messages.length
    });
    
    const userMessage: Message = {
      role: 'user',
      content: prompt,
    };
    
    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setPrompt("");
    
    try {
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

      // Call our AI router edge function
      const { data, error } = await supabase.functions.invoke("ai-router", {
        body: { 
          messages: messages.concat(userMessage).map(m => ({
            role: m.role,
            content: m.content
          })),
          wantRealtime: true,
          model: model
        },
        headers: authHeaders
      });

      if (error) {
        console.error("Error calling Perplexity AI:", error);
        toast({
          title: "Error",
          description: "Failed to get a response from the AI assistant",
          variant: "destructive",
        });
        return;
      }

      // Process response data
      if (data?.response) {
        // Extract citations if any (from markdown links)
        const linkRegex = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
        let match;
        const citations: Citation[] = [];
        let cleanResponse = data.response;
        
        while ((match = linkRegex.exec(data.response)) !== null) {
          citations.push({
            text: match[1],
            url: match[2]
          });
          
          // Replace markdown links with plain text for cleaner display
          cleanResponse = cleanResponse.replace(match[0], match[1]);
        }
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: cleanResponse, 
          citations: citations.length > 0 ? citations : undefined
        }]);
      } else if (data?.error) {
        toast({
          title: "AI Response Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in Perplexity chat:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get the selected model's label
  const selectedModelLabel = PERPLEXITY_MODELS.find(m => m.value === model)?.label || "VortexAI Realtime";

  return (
    <Card className="border shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Globe className="h-5 w-5 mr-2 text-primary" />
              VortexAI Realtime
            </CardTitle>
            <CardDescription>
              Powered by Perplexity with real-time information
            </CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Model Settings</h4>
                <div className="space-y-2">
                  <label htmlFor="model" className="text-sm text-muted-foreground">
                    AI Model
                  </label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERPLEXITY_MODELS.map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex flex-col">
                            <span>{model.label}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 border rounded-md bg-muted/30">
          {messages.map((message, index) => (
            <div key={index} className="flex gap-3">
              <Avatar className={message.role === 'user' ? 'bg-primary' : 'bg-muted'}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="bg-card p-3 rounded-lg shadow-sm">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Citation badges */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.citations.map((citation, i) => (
                        <a 
                          key={i} 
                          href={citation.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="no-underline"
                        >
                          <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                            <Globe className="h-3 w-3 mr-1" />
                            {citation.text}
                          </Badge>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about financial markets, business news, economic trends..."
              className="min-h-[80px] resize-none pr-12 bg-muted/30"
              disabled={isLoading}
            />
            <div className="absolute right-2 bottom-2">
              <Button 
                type="submit" 
                size="sm" 
                disabled={isLoading || !prompt.trim()}
                className="h-8 w-8 p-0 rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Using {selectedModelLabel} — responses include real-time information
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
