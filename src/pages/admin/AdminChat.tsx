import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Package,
  Film,
  ArrowLeft,
  Headphones,
  BarChart3,
  Crown,
  PanelRightClose,
  PanelRightOpen,
  ShoppingBag,
  Users,
  LogOut,
  ChevronLeft,
  LayoutDashboard,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from 'react';
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
  is_read: boolean;
}

const AdminChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isAgentOnline, setIsAgentOnline] = useState(true);
  const [convoSearchQuery, setConvoSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) { navigate('/'); return; }
      
      setIsAdmin(true);
      fetchConversations();
    };

    checkAdmin();
  }, [navigate]);

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
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to messages
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
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error("Failed to load conversations");
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  };
  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error("Failed to load messages");
    } else {
      setMessages(data || []);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const messageContent = newMessage;
    setNewMessage("");

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: session.user.id,
        sender_type: 'agent',
        message: messageContent
      });

    if (error) {
      toast.error("Failed to send message");
      setNewMessage(messageContent);
    } else {
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString(), status: 'active' })
        .eq('id', selectedConversation.id);
    }
  };

  const filteredConversations = conversations.filter(c => 
    (c.customer_name?.toLowerCase() || "").includes(convoSearchQuery.toLowerCase()) ||
    (c.customer_email?.toLowerCase() || "").includes(convoSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-slate-400 hover:text-charcoal transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="font-display text-xl font-bold text-charcoal">Concierge Desk</h1>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant Status</span>
              <div className={cn("w-2 h-2 rounded-full", isAgentOnline ? "bg-emerald-500" : "bg-slate-300")} />
              <Switch checked={isAgentOnline} onCheckedChange={setIsAgentOnline} className="data-[state=checked]:bg-gold" />
           </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Admin Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col shrink-0">
          <nav className="space-y-1 flex-1">
            <SidebarItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" />
            <SidebarItem to="/admin/products" icon={<Package />} label="Inventory" />
            <SidebarItem to="/admin/orders" icon={<ShoppingBag />} label="Orders" />
            <SidebarItem to="/admin/inquiries" icon={<MessageSquare />} label="Inquiries" />
            <SidebarItem to="/admin/reels" icon={<Film />} label="Reels" />
            <SidebarItem to="/admin/chat" icon={<Headphones />} label="Live Chat" active />
            <SidebarItem to="/admin/analytics" icon={<BarChart3 />} label="Analytics" />
          </nav>
        </aside>

        {/* Conversations List Panel */}
        <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
          <div className="p-6 space-y-4 border-b border-slate-100">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
               <Input 
                 placeholder="Search transmissions..." 
                 value={convoSearchQuery}
                 onChange={e => setConvoSearchQuery(e.target.value)}
                 className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-xs"
               />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all border group",
                    selectedConversation?.id === conv.id
                      ? "bg-white border-gold shadow-md text-charcoal"
                      : "bg-transparent border-transparent hover:bg-white/50 text-slate-500"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm truncate pr-2 group-hover:text-gold transition-colors">
                      {conv.customer_name || "New Client"}
                    </span>
                    {getStatusBadge(conv.status)}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                     <Clock className="w-3 h-3 text-gold/60" />
                     {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Message Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-charcoal font-display text-xl font-bold italic shadow-sm">
                    {selectedConversation.customer_name?.[0] || 'C'}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-charcoal">{selectedConversation.customer_name || "Anonymous Client"}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-slate-400 font-medium lowercase italic">{selectedConversation.customer_email}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(!isDetailsOpen)} className="text-slate-300 hover:text-gold hover:bg-gold/5">
                  {isDetailsOpen ? <PanelRightClose /> : <PanelRightOpen />}
                </Button>
              </div>

              {/* Messages Scroll Area */}
              <ScrollArea className="flex-1 px-8 py-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-[0.98]">
                <div className="space-y-8 max-w-4xl mx-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col group",
                        msg.sender_type === 'agent' ? "ml-auto items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "px-6 py-4 rounded-3xl shadow-sm text-sm max-w-lg leading-relaxed",
                          msg.sender_type === 'agent'
                            ? "bg-charcoal text-white rounded-tr-none font-medium"
                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-none italic"
                        )}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-2 px-3">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-8 border-t border-slate-100 bg-white">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
                  <Input
                    value={newMessage}
                    onChange={(e) => {
                       setNewMessage(e.target.value);
                    }}
                    placeholder="Provide professional concierge support..."
                    className="h-16 bg-slate-50 border-slate-100 rounded-[2rem] pl-8 pr-20 text-sm italic focus:ring-1 focus:ring-gold/20 focus:bg-white transition-all shadow-sm"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gold text-white rounded-full h-10 w-10 hover:bg-gold/90 transition-all shadow-lg active:scale-95"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-200">
              <Headphones className="w-20 h-20 mb-6 opacity-20" />
              <p className="font-display text-2xl font-bold uppercase tracking-[0.3em] opacity-40 italic">Waiting Room</p>
              <p className="text-xs text-slate-300 font-medium mt-4 tracking-widest uppercase">Select a transmission to engage</p>
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        {isDetailsOpen && selectedConversation && (
          <div className="w-80 border-l border-slate-200 bg-slate-50/50 flex flex-col p-8 overflow-y-auto shrink-0 animate-in slide-in-from-right duration-500">
             <h3 className="font-display text-xl font-bold text-charcoal italic mb-8">Client Insight</h3>
             <CustomerDetailsSidebar conversation={selectedConversation} />
             <CustomerDetailsSidebar conversation={selectedConversation} />
          </div>
        )}
      </div>
    </div>
  );
};

const SidebarItem = ({ to, icon, label, active = false }: { to: string, icon: any, label: string, active?: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group",
      active 
        ? "bg-gold/10 text-gold shadow-sm font-bold" 
        : "text-slate-500 hover:bg-slate-50 hover:text-charcoal"
    )}
  >
    {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 flex-shrink-0" })}
    <span className="font-body text-sm font-medium">{label}</span>
  </Link>
);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'waiting':
      return <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-200">Awaiting Service</span>;
    case 'active':
      return <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-200 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live Support</span>;
    default:
      return <Badge className="bg-slate-100 text-slate-400 border-slate-200 font-bold text-[8px] uppercase">{status}</Badge>;
  }
};

export default AdminChat;
