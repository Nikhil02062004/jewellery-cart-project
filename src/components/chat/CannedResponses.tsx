import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Plus, Search, Zap, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
interface CannedResponse {
  id: string;
  title: string;
  message: string;
  category: string | null;
  shortcut: string | null;
  is_global: boolean | null;
  created_by: string | null;
}
interface CannedResponsesProps {
  onSelect: (message: string) => void;
  inputValue: string;
}
export const CannedResponses = ({ onSelect, inputValue }: CannedResponsesProps) => {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newResponse, setNewResponse] = useState({
    title: "",
    message: "",
    category: "",
    shortcut: ""
  });
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    fetchResponses();
    getUserId();
  }, []);
  // Check for shortcut commands in input
  useEffect(() => {
    if (inputValue.startsWith("/") && inputValue.length >= 2) {
      const matchingResponse = responses.find(
        r => r.shortcut && r.shortcut.toLowerCase() === inputValue.toLowerCase()
      );
      if (matchingResponse) {
        onSelect(matchingResponse.message);
      }
    }
  }, [inputValue, responses, onSelect]);
  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
    }
  };
  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('canned_responses')
      .select('*')
      .order('category', { ascending: true });
    if (!error && data) {
      setResponses(data);
    }
  };
  const handleAddResponse = async () => {
    if (!newResponse.title.trim() || !newResponse.message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    const { error } = await supabase.from('canned_responses').insert({
      title: newResponse.title.trim(),
      message: newResponse.message.trim(),
      category: newResponse.category.trim() || null,
      shortcut: newResponse.shortcut.trim() || null,
      created_by: userId,
      is_global: false
    });
    if (error) {
      toast.error("Failed to add response");
      return;
    }
    toast.success("Canned response added");
    setNewResponse({ title: "", message: "", category: "", shortcut: "" });
    setIsAddDialogOpen(false);
    fetchResponses();
  };
  const handleDeleteResponse = async (id: string, isGlobal: boolean | null) => {
    if (isGlobal) {
      toast.error("Cannot delete global responses");
      return;
    }
    const { error } = await supabase
      .from('canned_responses')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error("Failed to delete response");
      return;
    }
    toast.success("Response deleted");
    fetchResponses();
  };
  const filteredResponses = responses.filter(response =>
    response.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    response.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (response.category && response.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (response.shortcut && response.shortcut.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const groupedResponses = filteredResponses.reduce((acc, response) => {
    const category = response.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(response);
    return acc;
  }, {} as Record<string, CannedResponse[]>);
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Canned Responses">
          <Zap className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Quick Responses</h4>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Canned Response</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Greeting"
                      value={newResponse.title}
                      onChange={(e) => setNewResponse(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Enter the canned response message..."
                      value={newResponse.message}
                      onChange={(e) => setNewResponse(prev => ({ ...prev, message: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        placeholder="e.g., general"
                        value={newResponse.category}
                        onChange={(e) => setNewResponse(prev => ({ ...prev, category: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shortcut">Shortcut</Label>
                      <Input
                        id="shortcut"
                        placeholder="e.g., /hi"
                        value={newResponse.shortcut}
                        onChange={(e) => setNewResponse(prev => ({ ...prev, shortcut: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddResponse} className="w-full">
                    Add Response
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or type shortcut..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {Object.entries(groupedResponses).length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No responses found
            </div>
          ) : (
            Object.entries(groupedResponses).map(([category, items]) => (
              <div key={category} className="p-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {category}
                </p>
                {items.map((response) => (
                  <div
                    key={response.id}
                    className={cn(
                      "group flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    )}
                    onClick={() => {
                      onSelect(response.message);
                      setIsOpen(false);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{response.title}</span>
                        {response.shortcut && (
                          <Badge variant="outline" className="text-xs h-5">
                            {response.shortcut}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {response.message}
                      </p>
                    </div>
                    {!response.is_global && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResponse(response.id, response.is_global);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Type shortcuts like /hi to auto-insert
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};