import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Minimize2, User, Headphones } from "lucide-react";        
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { ChatHistory } from "./ChatHistory";
import { SatisfactionSurvey } from "./SatisfactionSurvey";
import { ChatAttachment, AttachmentPreview } from "./ChatAttachment";
interface Message {
  id: string;
  text: string;
  sender: "user" | "support" | "system";
  timestamp: Date;
  senderName?: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

interface ConversationState {
  id: string | null;
  status: 'idle' | 'waiting' | 'active' | 'resolved';
  agentName: string | null;
  agentId: string | null;
}

const quickReplies = [
  "I need help with my order",
  "Track my shipment",
  "Return or exchange",
  "Product inquiry"
];

export const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! 👋 Welcome to Lumière support. How can we assist you today?",
      sender: "system",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; type: string } | null>(null);
  const [conversation, setConversation] = useState<ConversationState>({
    id: null,
    status: 'idle',
    agentName: null,
    agentId: null
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [resolvedConversationId, setResolvedConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Typing indicator hook
  const { isOtherTyping, handleTypingChange, stopTyping } = useTypingIndicator({
    conversationId: conversation.id,
    userId,
    userType: 'customer'
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversation.id) return;

    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as {
            id: string;
            message: string;
            sender_type: string;
            created_at: string;
          };
          
          // Only add if not from current user (to avoid duplicates)
          if (newMessage.sender_type !== 'customer') {
            setMessages(prev => {
              // Check if message already exists
              if (prev.some(m => m.id === newMessage.id)) return prev;
              
              return [...prev, {
                id: newMessage.id,
                text: newMessage.message,
                sender: newMessage.sender_type as 'support' | 'system',
                timestamp: new Date(newMessage.created_at),
                senderName: newMessage.sender_type === 'agent' ? conversation.agentName || 'Agent' : undefined
              }];
            });
            setIsTyping(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, conversation.agentName]);

  // Subscribe to conversation status changes
  useEffect(() => {
    if (!conversation.id) return;

    const channel = supabase
      .channel(`conversation-status-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_conversations',
          filter: `id=eq.${conversation.id}`
        },
        (payload) => {
          const updated = payload.new as {
            status: string;
            assigned_agent_id: string | null;
          };
          
          // Show survey when conversation is resolved
          if (updated.status === 'resolved' && conversation.status !== 'resolved') {
            setResolvedConversationId(conversation.id);
            setShowSurvey(true);
          }
          
          setConversation(prev => ({
            ...prev,
            status: updated.status as ConversationState['status']
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, conversation.status]);

  const startConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          customer_id: userId,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      setConversation({
        id: data.id,
        status: 'waiting',
        agentName: null,
        agentId: null
      });

      // Request agent assignment
      const { data: assignData } = await supabase.functions.invoke('assign-chat-agent', {
        body: {
          conversationId: data.id,
          customerName: 'Customer',
          customerId: userId,
        }
      });

      if (assignData?.agentName) {
        setConversation(prev => ({
          ...prev,
          status: assignData.status,
          agentName: assignData.agentName
        }));
      }

      return data.id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
      return null;
    }
  };

  const sendMessage = async (text: string, attachmentUrl?: string, attachmentType?: string) => {
    if (!text.trim() && !attachmentUrl) return;

    let conversationId = conversation.id;
    const isFirstMessage = !conversationId;
    
    // Start a new conversation if needed
    if (!conversationId) {
      conversationId = await startConversation();
      if (!conversationId) return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim() || (attachmentUrl ? 'Sent an attachment' : ''),
      sender: "user",
      timestamp: new Date(),
      attachmentUrl,
      attachmentType
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setPendingAttachment(null);
    setIsTyping(true);

    try {
      // Save message to database
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_type: 'customer',
        message: text.trim() || (attachmentUrl ? 'Sent an attachment' : ''),
        attachment_url: attachmentUrl || null,
        attachment_type: attachmentType || null
      });

      // Notify agents about new message (only for first message or if no agent assigned)
      if (isFirstMessage || conversation.status !== 'active') {
        supabase.functions.invoke('notify-new-message', {
          body: {
            conversationId,
            customerName: 'Customer',
            customerEmail: '',
            messagePreview: attachmentUrl ? '[Attachment] ' + text.trim() : text.trim()
          }
        }).catch(err => console.log('Agent notification failed:', err));
      }

      // If no agent assigned yet, try AI response or fall back to auto-responses
      if (conversation.status !== 'active') {
                try {
                    // First, check if there are any available agents
          const { data: availableAgents } = await supabase
            .from('support_agents')
            .select('user_id')
            .eq('is_available', true)
            .lt('current_conversations', 5)
            .limit(1);
          // If no agents available, use AI-powered responses
          if (!availableAgents || availableAgents.length === 0) {
            // Build conversation history for context
            const recentMessages = messages.slice(-6).map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            }));
            const { data: aiData, error: aiError } = await supabase.functions.invoke('chat-ai-response', {
              body: {
                conversationId,
                message: text,
                conversationHistory: recentMessages
              }
            });
            if (!aiError && aiData?.response) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: aiData.response,
                sender: "system",
                timestamp: new Date(),
                senderName: "AI Assistant"
              }]);
              setIsTyping(false);
              return;
            }
          }
          // Fall back to keyword-based auto-responses

          const { data: autoResponses } = await supabase
            .from('chat_auto_responses')
            .select('*')
            .eq('is_active', true)
            .order('priority', { ascending: false });
          let matchedResponse = null;
          const lowerText = text.toLowerCase();
          
          if (autoResponses) {
            for (const response of autoResponses) {
              const hasMatch = response.trigger_keywords.some((keyword: string) => 
                lowerText.includes(keyword.toLowerCase())
              );
              if (hasMatch) {
                matchedResponse = response;
                break;
              }
            }
          }
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: matchedResponse?.response_message || 
                "Thank you for your message. An agent will respond shortly. In the meantime, feel free to provide more details about your inquiry.",
              sender: "system",
              timestamp: new Date()
            }]);
            setIsTyping(false);
          }, 1500);
        } catch (err) {
          console.log('Auto-response lookup failed:', err);
          setIsTyping(false);
      }
    }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue, pendingAttachment?.url, pendingAttachment?.type);
  };

  const handleAttachment = (url: string, type: string) => {
    setPendingAttachment({ url, type });
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const endChat = async () => {
    if (conversation.id) {
      try {
        // Show survey before closing if conversation was active
        if (conversation.status === 'active' || conversation.status === 'resolved') {
          setResolvedConversationId(conversation.id);
          setShowSurvey(true);
          return; // Don't close yet, let survey handle it
        }
        
        await supabase
          .from('chat_conversations')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('id', conversation.id);
        
        resetChat();
      } catch (error) {
        console.error('Error ending chat:', error);
      }
    }
    setIsOpen(false);
  };

  const resetChat = () => {
    setConversation({ id: null, status: 'idle', agentName: null, agentId: null });
    setMessages([{
      id: "welcome",
      text: "Hello! 👋 Welcome to Lumière support. How can we assist you today?",
      sender: "system",
      timestamp: new Date()
    }]);
    setShowSurvey(false);
    setResolvedConversationId(null);
  };

  const handleSurveyClose = () => {
    setShowSurvey(false);
    resetChat();
    toast.success('Chat ended. Thank you for contacting us!');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 bg-background border rounded-lg shadow-2xl transition-all duration-300",
        isMinimized ? "w-72 h-14" : "w-80 sm:w-96 h-[500px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            {conversation.status === 'active' ? (
              <Headphones className="h-4 w-4" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">
              {conversation.agentName || 'Customer Support'}
            </p>
            {!isMinimized && (
              <p className="text-xs opacity-80">
                {conversation.status === 'waiting' && '⏳ Finding an agent...'}
                {conversation.status === 'active' && '🟢 Connected'}
                {conversation.status === 'idle' && 'Start a conversation'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {userId && <ChatHistory userId={userId} />}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={endChat}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Survey Overlay */}
          {showSurvey && resolvedConversationId && (
            <div className="absolute inset-0 bg-background/95 z-10 flex items-center justify-center p-4 rounded-lg">
              <SatisfactionSurvey
                conversationId={resolvedConversationId}
                customerId={userId}
                agentId={conversation.agentId}
                onClose={handleSurveyClose}
                onSubmit={handleSurveyClose}
              />
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="h-[340px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.sender !== "user" && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mr-2 flex-shrink-0">
                      {message.sender === "support" ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <MessageCircle className="h-3 w-3" />
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.sender === "system"
                        ? "bg-muted/50 border border-border"
                        : "bg-muted"
                    )}
                  >
                    {message.senderName && (
                      <p className="text-xs font-semibold mb-1 opacity-70">{message.senderName}</p>
                    )}
                    {message.attachmentUrl && message.attachmentType && (
                      <AttachmentPreview 
                        url={message.attachmentUrl} 
                        type={message.attachmentType}
                        className="mb-2"
                      />
                    )}
                    {message.text && !message.text.includes('Sent an attachment') && (
                      <p>{message.text}</p>
                    )}
                    <p className={cn(
                      "text-xs mt-1",
                      message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {(isTyping || isOtherTyping) && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mr-2">
                    <User className="h-3 w-3" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <p className="text-xs text-muted-foreground mb-1">Agent is typing...</p>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            {messages.length <= 2 && conversation.status === 'idle' && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">Quick options:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t">
            {pendingAttachment && (
              <div className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2">
                <AttachmentPreview url={pendingAttachment.url} type={pendingAttachment.type} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto"
                  onClick={() => setPendingAttachment(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2 items-center">
              <ChatAttachment onAttach={handleAttachment} />
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  handleTypingChange();
                }}
                onBlur={stopTyping}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" disabled={!inputValue.trim() && !pendingAttachment}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
