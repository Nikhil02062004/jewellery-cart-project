import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { History, Download, MessageCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Conversation {
  id: string;
  status: string;
  created_at: string;
  closed_at: string | null;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
}

interface ChatHistoryProps {
  userId: string | null;
}

export const ChatHistory = ({ userId }: ChatHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchConversations();
    }
  }, [isOpen, userId]);

  const fetchConversations = async () => {
    if (!userId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('id, status, created_at, closed_at')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConversations(data);
    }
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, message, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const exportTranscript = () => {
    if (!selectedConversation || messages.length === 0) return;

    const transcript = messages.map(msg => {
      const time = format(new Date(msg.created_at), 'MMM d, yyyy h:mm a');
      const sender = msg.sender_type === 'customer' ? 'You' : 
                     msg.sender_type === 'agent' ? 'Support Agent' : 'System';
      return `[${time}] ${sender}: ${msg.message}`;
    }).join('\n\n');

    const header = `Chat Transcript - Lumière Support\n` +
                   `Date: ${format(new Date(selectedConversation.created_at), 'MMMM d, yyyy')}\n` +
                   `Conversation ID: ${selectedConversation.id.slice(0, 8)}\n` +
                   `${'='.repeat(50)}\n\n`;

    const footer = `\n${'='.repeat(50)}\n` +
                   `End of transcript\n` +
                   `Thank you for contacting Lumière Support`;

    const blob = new Blob([header + transcript + footer], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumiere-chat-${selectedConversation.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Transcript downloaded successfully');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Active</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Chat History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Your Chat History
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 h-[500px]">
          {/* Conversations List */}
          <div className="col-span-1 border rounded-lg">
            <div className="p-3 border-b bg-muted/50">
              <h3 className="font-medium text-sm">Conversations</h3>
            </div>
            <ScrollArea className="h-[440px]">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No chat history yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          #{conv.id.slice(0, 8)}
                        </span>
                        {getStatusBadge(conv.status)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(conv.created_at), 'MMM d, yyyy')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages */}
          <div className="col-span-2 border rounded-lg flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">
                      Conversation #{selectedConversation.id.slice(0, 8)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedConversation.created_at), 'MMMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportTranscript} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.sender_type === 'customer'
                              ? 'bg-primary text-primary-foreground'
                              : msg.sender_type === 'system'
                              ? 'bg-muted/50 border text-center w-full max-w-full text-xs'
                              : 'bg-muted'
                          }`}
                        >
                          <p>{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_type === 'customer' 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
