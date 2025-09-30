import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useVortexChatPersistent } from '@/hooks/useVortexChatPersistent';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageSquare,
  Send,
  Loader2,
  Plus,
  Archive,
  Search,
  Clock,
  Trash2,
  Edit3
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Enhanced VortexAI Chat Component with Persistent Sessions
 * Features:
 * - Database-backed message persistence
 * - Session management (create, load, delete, rename)
 * - Chat history sidebar
 * - Real-time message sync
 * - Responsive design
 */
export function EnhancedVortexAIChat() {
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  const {
    messages,
    isLoading,
    sendMessage,
    startNewChat,
    askForMarketData,
    currentSessionId,
    sessions,
    loadSession,
    deleteSession,
    renameSession,
    hasUnsavedChanges
  } = useVortexChatPersistent();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    await loadSession(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this chat session?')) {
      await deleteSession(sessionId);
    }
  };

  const handleRenameSession = async (sessionId: string) => {
    if (!editingSessionName.trim()) return;
    await renameSession(sessionId, editingSessionName.trim());
    setEditingSessionId(null);
    setEditingSessionName('');
  };

  const startEditingSession = (sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId);
    setEditingSessionName(currentName || '');
  };

  const filteredSessions = sessions.filter(session =>
    (session.session_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentSessionName = () => {
    const currentSession = sessions.find(s => s.id === currentSessionId);
    return currentSession?.session_name || 'New Chat';
  };

  return (
    <div className="flex h-full max-h-[800px]">
      {/* Chat History Sidebar for Authenticated Users */}
      {isAuthenticated && (
        <div className="w-80 border-r bg-muted/50 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Chat History</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={startNewChat}
                className="h-8 px-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                    currentSessionId === session.id
                      ? 'bg-primary/10 border-primary/20'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleLoadSession(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingSessionName}
                            onChange={(e) => setEditingSessionName(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') {
                                handleRenameSession(session.id);
                              } else if (e.key === 'Escape') {
                                setEditingSessionId(null);
                              }
                            }}
                            className="h-6 text-sm"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium truncate">
                            {session.session_name || 'Untitled Chat'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(session.updated_at).toLocaleDateString()}</span>
                            <Badge variant="secondary" className="h-4 px-1 text-xs">
                              {session.messages?.length || 0}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingSession(session.id, session.session_name || '');
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">VortexAI Assistant</h2>
                {isAuthenticated && (
                  <p className="text-sm text-muted-foreground">
                    {getCurrentSessionName()}
                    {hasUnsavedChanges && (
                      <span className="text-orange-500 ml-2">• Unsaved</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <Badge variant="outline" className="text-xs">
                  {sessions.length} Sessions
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => askForMarketData('What are the current market trends?')}
                disabled={isLoading}
              >
                Market Data
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <Card
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.timestamp && (
                        <div className="flex justify-between items-center text-xs opacity-70">
                          <span className="capitalize font-medium">
                            {message.role}
                          </span>
                          <span>{formatMessageTime(message.timestamp)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      VortexAI is thinking...
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask VortexAI anything about your finances..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="lg"
              className="px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Sign in to save your chat history and access advanced features
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedVortexAIChat;