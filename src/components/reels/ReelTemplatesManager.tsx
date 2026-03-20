import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  caption: string | null;
  product_id: string | null;
  created_at: string;
}

interface ReelTemplatesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onUseTemplate?: (template: Template) => void;
}

export function ReelTemplatesManager({
  open,
  onOpenChange,
  userId,
  onUseTemplate,
}: ReelTemplatesManagerProps) {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    caption: "",
    product_id: "",
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["reel-templates", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reel_templates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Template[];
    },
    enabled: open && !!userId,
  });

  const { data: products } = useQuery({
    queryKey: ["products-for-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    try {
      const { error } = await supabase.from("reel_templates").insert({
        user_id: userId,
        name: newTemplate.name.trim(),
        caption: newTemplate.caption.trim() || null,
        product_id: newTemplate.product_id || null,
      });

      if (error) throw error;

      toast.success("Template created successfully");
      setNewTemplate({ name: "", caption: "", product_id: "" });
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ["reel-templates", userId] });
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from("reel_templates")
        .update({
          name: editingTemplate.name,
          caption: editingTemplate.caption,
          product_id: editingTemplate.product_id,
        })
        .eq("id", editingTemplate.id);

      if (error) throw error;

      toast.success("Template updated successfully");
      setEditingTemplate(null);
      queryClient.invalidateQueries({ queryKey: ["reel-templates", userId] });
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("reel_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast.success("Template deleted");
      queryClient.invalidateQueries({ queryKey: ["reel-templates", userId] });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const getProductName = (productId: string | null) => {
    if (!productId || !products) return null;
    const product = products.find((p) => p.id === productId);
    return product?.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reel Templates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Template */}
          {isCreating ? (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    placeholder="e.g., Product Showcase"
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Default Caption</Label>
                  <Textarea
                    placeholder="Caption template..."
                    value={newTemplate.caption}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, caption: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Default Product</Label>
                  <Select
                    value={newTemplate.product_id}
                    onValueChange={(value) =>
                      setNewTemplate({ ...newTemplate, product_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No product</SelectItem>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateTemplate} className="gap-1">
                    <Save className="h-4 w-4" />
                    Save Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setNewTemplate({ name: "", caption: "", product_id: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4" />
              Create New Template
            </Button>
          )}

          {/* Templates List */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : templates && templates.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-2">
                {templates.map((template) =>
                  editingTemplate?.id === template.id ? (
                    <Card key={template.id}>
                      <CardContent className="pt-4 space-y-3">
                        <div>
                          <Label>Template Name</Label>
                          <Input
                            value={editingTemplate.name}
                            onChange={(e) =>
                              setEditingTemplate({
                                ...editingTemplate,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Default Caption</Label>
                          <Textarea
                            value={editingTemplate.caption || ""}
                            onChange={(e) =>
                              setEditingTemplate({
                                ...editingTemplate,
                                caption: e.target.value,
                              })
                            }
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Default Product</Label>
                          <Select
                            value={editingTemplate.product_id || ""}
                            onValueChange={(value) =>
                              setEditingTemplate({
                                ...editingTemplate,
                                product_id: value || null,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No product</SelectItem>
                              {products?.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateTemplate}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTemplate(null)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card
                      key={template.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{template.name}</h4>
                            {template.caption && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {template.caption}
                              </p>
                            )}
                            {template.product_id && (
                              <p className="text-xs text-primary mt-1">
                                Product: {getProductName(template.product_id)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {onUseTemplate && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  onUseTemplate(template);
                                  onOpenChange(false);
                                }}
                              >
                                Use
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingTemplate(template)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No templates yet</p>
              <p className="text-xs mt-1">
                Create templates to quickly reuse captions and settings
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
