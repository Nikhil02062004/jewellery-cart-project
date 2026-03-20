import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bot, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
interface AutoResponse {
  id: string;
  trigger_keywords: string[];
  response_message: string;
  category: string | null;
  is_active: boolean;
  priority: number;
}
export const AutoResponsesManager = () => {
  const [responses, setResponses] = useState<AutoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    keywords: "",
    message: "",
    category: "",
    priority: 0
  });
  useEffect(() => {
    fetchResponses();
  }, []);
  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_auto_responses")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error("Error fetching auto-responses:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    if (!formData.keywords.trim() || !formData.message.trim()) {
      toast.error("Please fill in keywords and message");
      return;
    }
    const keywords = formData.keywords.split(",").map(k => k.trim().toLowerCase()).filter(k => k);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("chat_auto_responses")
          .update({
            trigger_keywords: keywords,
            response_message: formData.message,
            category: formData.category || null,
            priority: formData.priority,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Auto-response updated");
      } else {
        const { error } = await supabase
          .from("chat_auto_responses")
          .insert({
            trigger_keywords: keywords,
            response_message: formData.message,
            category: formData.category || null,
            priority: formData.priority,
            is_active: true
          });
        if (error) throw error;
        toast.success("Auto-response created");
      }
      resetForm();
      fetchResponses();
    } catch (error) {
      toast.error("Failed to save auto-response");
    }
  };
  const resetForm = () => {
    setFormData({ keywords: "", message: "", category: "", priority: 0 });
    setEditingId(null);
    setIsDialogOpen(false);
  };
  const editResponse = (response: AutoResponse) => {
    setFormData({
      keywords: response.trigger_keywords.join(", "),
      message: response.response_message,
      category: response.category || "",
      priority: response.priority
    });
    setEditingId(response.id);
    setIsDialogOpen(true);
  };
  const toggleResponse = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("chat_auto_responses")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
      setResponses(prev => prev.map(r => r.id === id ? { ...r, is_active: isActive } : r));
    } catch (error) {
      toast.error("Failed to update status");
    }
  };
  const deleteResponse = async (id: string) => {
    try {
      const { error } = await supabase.from("chat_auto_responses").delete().eq("id", id);
      if (error) throw error;
      setResponses(prev => prev.filter(r => r.id !== id));
      toast.success("Auto-response deleted");
    } catch (error) {
      toast.error("Failed to delete auto-response");
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Auto-Responses for No Agent Available
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                Add Response
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Auto-Response</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Trigger Keywords (comma-separated)</Label>
                  <Input
                    placeholder="order, tracking, shipment"
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    If customer message contains any of these keywords, this response will trigger
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Response Message</Label>
                  <Textarea
                    placeholder="Enter the automated response message..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      placeholder="e.g., orders, shipping"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button onClick={handleSubmit}>
                    <Save className="h-4 w-4 mr-1" />
                    {editingId ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No auto-responses configured</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map(response => (
                  <TableRow key={response.id}>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {response.trigger_keywords.slice(0, 3).map((kw, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{kw}</Badge>
                        ))}
                        {response.trigger_keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{response.trigger_keywords.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={response.response_message}>
                      {response.response_message.slice(0, 80)}...
                    </TableCell>
                    <TableCell>
                      {response.category && <Badge variant="outline">{response.category}</Badge>}
                    </TableCell>
                    <TableCell className="text-center">{response.priority}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={response.is_active}
                        onCheckedChange={(checked) => toggleResponse(response.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editResponse(response)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteResponse(response.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};