import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  MessageCircle, 
  Send, 
  User, 
  Clock, 
  CheckCircle,
  LayoutDashboard,
  Package,
  FileText,
  Film,
  ArrowLeft,
  Headphones,
  BarChart3,
  Crown,
  PanelRightClose,
  PanelRightOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { CannedResponses } from "@/components/chat/CannedResponses";
import { AttachmentPreview } from "@/components/chat/ChatAttachment";
import { ChatPriorityBadge } from "@/components/chat/ChatPriorityBadge";
import { SatisfactionAlerts } from "@/components/admin/SatisfactionAlerts";
import { ChatTransferDialog } from "@/components/chat/ChatTransferDialog";
import { ChatQueueManager } from "@/components/admin/ChatQueueManager";
import { CustomerLoyaltyBadge } from "@/components/chat/CustomerLoyaltyBadge";
import { CustomerDetailsSidebar } from "@/components/chat/CustomerDetailsSidebar";

type Priority = 'low' | 'normal' | 'high' | 'urgent' | 'vip';

interface Conversation {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  assigned_agent_id: string | null;
  created_at: string;
  updated_at: string;
  priority: Priority;
  is_vip: boolean;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_type: string;
  message: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
}

const AdminChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);

  // Typing indicator for agent
  const { isOtherTyping, handleTypingChange, stopTyping } = useTypingIndicator({
    conversationId: selectedConversation?.id || null,
    userId,
    userType: 'agent'
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await fetchAgentStatus(session.user.id);
        await fetchConversations();
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Subscribe to new conversations
  useEffect(() => {
    const channel = supabase
      .channel('admin-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.info('🔔 New Chat Request', {
              description: 'A customer requires assistance in Live Chat.'
            });
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    fetchMessages(selectedConversation.id);

    const channel = supabase
      .channel(`admin-chat-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  const fetchAgentStatus = async (uid: string) => {
    const { data } = await supabase
      .from('support_agents')
      .select('is_available')
      .eq('user_id', uid)
      .single();
    
    if (data) {
      setIsAvailable(data.is_available);
    }
  };

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('status', ['waiting', 'active'])
      .order('priority', { ascending: false })
      .order('is_vip', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Sort by priority weight
      const priorityWeight: Record<string, number> = { vip: 5, urgent: 4, high: 3, normal: 2, low: 1 };
      const sorted = [...data].sort((a, b) => {
        const aWeight = (a.is_vip ? 5 : priorityWeight[(a.priority as string) || 'normal']) || 2;
        const bWeight = (b.is_vip ? 5 : priorityWeight[(b.priority as string) || 'normal']) || 2;
        if (bWeight !== aWeight) return bWeight - aWeight;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      setConversations(sorted as Conversation[]);
    }
  };

  const updatePriority = async (conversationId: string, priority: Priority) => {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ priority, is_vip: priority === 'vip' })
      .eq('id', conversationId);

    if (!error) {
      toast.success(`Priority updated to ${priority}`);
      fetchConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, priority, is_vip: priority === 'vip' } : null);
      }
    } else {
      toast.error('Failed to update priority');
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const toggleAvailability = async () => {
    if (!userId) return;

    const newStatus = !isAvailable;
    
    // Check if agent record exists
    const { data: existing } = await supabase
      .from('support_agents')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase
        .from('support_agents')
        .update({ is_available: newStatus })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('support_agents')
        .insert({
          user_id: userId,
          display_name: 'Support Agent',
          is_available: newStatus
        });
    }

    setIsAvailable(newStatus);
    toast.success(newStatus ? 'You are now available for chats' : 'You are now offline');
  };

  const assignToMe = async (conversation: Conversation) => {
    if (!userId) return;

    await supabase
      .from('chat_conversations')
      .update({ 
        assigned_agent_id: userId,
        status: 'active'
      })
      .eq('id', conversation.id);

    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: userId,
        sender_type: 'system',
        message: 'An agent has joined the conversation.'
      });

    toast.success('Conversation assigned to you');
    fetchConversations();
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation || !userId) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: userId,
        sender_type: 'agent',
        message: inputValue.trim()
      });

    if (!error) {
      setInputValue("");
    } else {
      toast.error('Failed to send message');
    }
  };

  const resolveConversation = async () => {
    if (!selectedConversation) return;

    await supabase
      .from('chat_conversations')
      .update({ status: 'resolved', closed_at: new Date().toISOString() })
      .eq('id', selectedConversation.id);

    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_type: 'system',
        message: 'This conversation has been resolved. Thank you for contacting us!'
      });

    toast.success('Conversation resolved');
    setSelectedConversation(null);
    fetchConversations();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Waiting</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

   return (
     <>
       {/* Real-time notifications for new chats - handled by channel below */}
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-xl">Live Chat Support</h1>
          </div>
          <div className="flex items-center gap-3">
            <SatisfactionAlerts userId={userId} />
            <span className="text-sm text-muted-foreground">
              {isAvailable ? '🟢 Available' : '⚫ Offline'}
            </span>
            <Switch checked={isAvailable} onCheckedChange={toggleAvailability} />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-background border-r hidden lg:block">
          <nav className="p-4 space-y-2">
            <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm">Dashboard</span>
            </Link>
            <Link to="/admin/products" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <Package className="h-4 w-4" />
              <span className="text-sm">Products</span>
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Orders</span>
            </Link>
            <Link to="/admin/reels" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <Film className="h-4 w-4" />
              <span className="text-sm">Reels</span>
            </Link>
            <Link to="/admin/chat" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary">
              <Headphones className="h-4 w-4" />
              <span className="text-sm">Live Chat</span>
            </Link>
            <Link to="/admin/analytics" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Analytics</span>
            </Link>
          </nav>
        </aside>

        {/* Conversations List */}
        <div className="w-[300px] md:w-80 shrink-0 border-r bg-background flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Conversations
                {conversations.length > 0 && (
                  <Badge variant="secondary">{conversations.length}</Badge>
                )}
              </h2>
            </div>
          </div>
          {/* Chat Queue Manager inside Conversations removed to prevent duplicate lists and save vertical space */}
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active conversations</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                      selectedConversation?.id === conv.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                        {conv.customer_name || 'Anonymous Customer'}
                        </span>
                        {(conv.is_vip || conv.priority === 'vip') && (
                          <Crown className="h-3 w-3 text-purple-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <CustomerLoyaltyBadge customerId={conv.customer_id} showTooltip={false} />
                        <ChatPriorityBadge 
                          priority={conv.priority || 'normal'} 
                          isVip={conv.is_vip}
                        />
                        {getStatusBadge(conv.status)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.customer_email || 'No email provided'}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(conv.created_at).toLocaleTimeString()}
                    </div>
                    {conv.status === 'waiting' && conv.assigned_agent_id !== userId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          assignToMe(conv);
                        }}
                      >
                        Assign to me
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {selectedConversation.customer_name || 'Anonymous Customer'}
                      {(selectedConversation.is_vip || selectedConversation.priority === 'vip') && (
                        <Crown className="h-4 w-4 text-purple-500" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.customer_email || 'No email'}
                    </p>
                  </div>
                  <CustomerLoyaltyBadge customerId={selectedConversation.customer_id} />
                  <ChatPriorityBadge
                    priority={selectedConversation.priority || 'normal'}
                    isVip={selectedConversation.is_vip}
                    editable
                    onChange={(priority) => updatePriority(selectedConversation.id, priority)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.assigned_agent_id === userId && (
                    <ChatTransferDialog
                      conversationId={selectedConversation.id}
                      currentAgentId={userId}
                      onTransferComplete={() => {
                        setSelectedConversation(null);
                        fetchConversations();
                      }}
                    />
                  )}
                  <Button variant="outline" size="sm" onClick={resolveConversation}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                    title={showCustomerDetails ? "Hide customer details" : "Show customer details"}
                  >
                    {showCustomerDetails ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_type === 'agent' ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.sender_type !== 'agent' && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-4 py-2",
                          msg.sender_type === 'agent'
                            ? "bg-primary text-primary-foreground"
                            : msg.sender_type === 'system'
                            ? "bg-muted/50 border text-center w-full max-w-full"
                            : "bg-muted"
                        )}
                      >
                        {msg.attachment_url && msg.attachment_type && (
                          <AttachmentPreview 
                            url={msg.attachment_url} 
                            type={msg.attachment_type}
                            className="mb-2"
                          />
                        )}
                        {msg.message && !msg.message.includes('Sent an attachment') && (
                          <p className="text-sm">{msg.message}</p>
                        )}
                        <p className={cn(
                          "text-xs mt-1",
                          msg.sender_type === 'agent' ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isOtherTyping && (
                    <div className="flex justify-start">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <p className="text-xs text-muted-foreground mb-1">Customer is typing...</p>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                    stopTyping();
                  }}
                  className="flex gap-2"
                >
                  <CannedResponses 
                    onSelect={(message) => setInputValue(message)} 
                    inputValue={inputValue}
                  />
                  <Input
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      handleTypingChange();
                    }}
                    onBlur={stopTyping}
                    placeholder="Type your response... (use /shortcuts)"
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!inputValue.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start responding</p>
              </div>
            </div>
          )}
        </div>

        {/* Customer Details Sidebar */}
        {selectedConversation && showCustomerDetails && (
          <CustomerDetailsSidebar
            customerId={selectedConversation.customer_id}
            customerName={selectedConversation.customer_name}
            customerEmail={selectedConversation.customer_email}
          />
        )}
      </div>
    </div>
     </>
  );
};

export default AdminChat;
