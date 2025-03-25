
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Send, 
  ChevronUp, 
  ChevronDown,
  Sparkles
} from "lucide-react";

export function VortexAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "ai", content: "Welcome to VortexCore! How can I assist you today?" }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Add user message to chat
    setChatHistory([...chatHistory, { role: "user", content: message }]);
    
    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev, 
        { 
          role: "ai", 
          content: "I'm VortexAI, your personal financial assistant. I can help you manage your accounts, track spending, and provide financial insights. What would you like to know?" 
        }
      ]);
    }, 1000);
    
    setMessage("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-2 w-80 md:w-96 bg-card rounded-lg shadow-lg border border-border overflow-hidden flex flex-col max-h-[500px]">
          <div className="bg-primary p-3 text-primary-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-medium">VortexAI Assistant</h3>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground" onClick={() => setIsOpen(false)}>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 min-h-[300px]">
            {chatHistory.map((msg, index) => (
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
          </div>
          
          <form onSubmit={handleSendMessage} className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon" className="h-10 w-10">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
      
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className="rounded-full h-12 w-12 p-0 bg-primary hover:bg-primary/90"
      >
        {isOpen ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
