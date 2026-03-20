import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
interface Agent {
  id: string;
  user_id: string;
  display_name: string;
  is_available: boolean;
  current_conversations: number;
  max_conversations: number;
}
interface ChatTransferDialogProps {
  conversationId: string;
  currentAgentId: string;
  onTransferComplete?: () => void;
}
export const ChatTransferDialog = ({
  conversationId,
  currentAgentId,
  onTransferComplete,
}: ChatTransferDialogProps) => {
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [transferNote, setTransferNote] = useState("");
  useEffect(() => {
    if (open) {
      fetchAvailableAgents();
    }
  }, [open]);
  const fetchAvailableAgents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_agents")
        .select("*")
        .eq("is_available", true)
        .lt("current_conversations", 5)
        .neq("user_id", currentAgentId);
      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load available agents");
    } finally {
      setLoading(false);
    }
  };
  const handleTransfer = async () => {
    if (!selectedAgent) {
      toast.error("Please select an agent to transfer to");
      return;
    }
    setTransferring(true);
    try {
      const { error } = await supabase.functions.invoke("transfer-chat", {
        body: {
          conversationId,
          fromAgentId: currentAgentId,
          toAgentId: selectedAgent,
          transferNote,
        },
      });
      if (error) throw error;
      toast.success("Chat transferred successfully");
      setOpen(false);
      setSelectedAgent(null);
      setTransferNote("");
      onTransferComplete?.();
    } catch (error) {
      console.error("Error transferring chat:", error);
      toast.error("Failed to transfer chat");
    } finally {
      setTransferring(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Select Agent</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : agents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No other agents available at the moment
              </p>
            ) : (
              <ScrollArea className="h-48 mt-2 border rounded-md">
                <div className="p-2 space-y-2">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.user_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        selectedAgent === agent.user_id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedAgent === agent.user_id
                            ? "bg-primary-foreground/20"
                            : "bg-muted"
                        }`}
                      >
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {agent.display_name}
                        </p>
                        <p
                          className={`text-xs ${
                            selectedAgent === agent.user_id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {agent.current_conversations}/{agent.max_conversations}{" "}
                          active chats
                        </p>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          agent.is_available ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <div>
            <Label htmlFor="transfer-note" className="text-sm font-medium">
              Transfer Note (Optional)
            </Label>
            <Textarea
              id="transfer-note"
              placeholder="Add context for the receiving agent..."
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedAgent || transferring}
            >
              {transferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Transfer Chat"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};