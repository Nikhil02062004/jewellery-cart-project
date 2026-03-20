import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Eye, Heart, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferencesProps {
  userId: string;
}

interface Preferences {
  views_100: boolean;
  views_500: boolean;
  views_1000: boolean;
  views_5000: boolean;
  views_10000: boolean;
  views_50000: boolean;
  views_100000: boolean;
  likes_50: boolean;
  likes_100: boolean;
  likes_500: boolean;
  likes_1000: boolean;
  likes_5000: boolean;
  likes_10000: boolean;
  email_notifications: boolean;
}

const defaultPreferences: Preferences = {
  views_100: true,
  views_500: true,
  views_1000: true,
  views_5000: true,
  views_10000: true,
  views_50000: true,
  views_100000: true,
  likes_50: true,
  likes_100: true,
  likes_500: true,
  likes_1000: true,
  likes_5000: true,
  likes_10000: true,
  email_notifications: true,
};

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPreferences();
    }
  }, [open, userId]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          views_100: data.views_100,
          views_500: data.views_500,
          views_1000: data.views_1000,
          views_5000: data.views_5000,
          views_10000: data.views_10000,
          views_50000: data.views_50000,
          views_100000: data.views_100000,
          likes_50: data.likes_50,
          likes_100: data.likes_100,
          likes_500: data.likes_500,
          likes_1000: data.likes_1000,
          likes_5000: data.likes_5000,
          likes_10000: data.likes_10000,
          email_notifications: data.email_notifications,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: userId,
          ...preferences,
        });

      if (error) throw error;

      toast.success("Notification preferences saved!");
      setOpen(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof Preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllViews = (enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      views_100: enabled,
      views_500: enabled,
      views_1000: enabled,
      views_5000: enabled,
      views_10000: enabled,
      views_50000: enabled,
      views_100000: enabled,
    }));
  };

  const toggleAllLikes = (enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      likes_50: enabled,
      likes_100: enabled,
      likes_500: enabled,
      likes_1000: enabled,
      likes_5000: enabled,
      likes_10000: enabled,
    }));
  };

  const viewMilestones = [
    { key: "views_100" as const, label: "100 views" },
    { key: "views_500" as const, label: "500 views" },
    { key: "views_1000" as const, label: "1,000 views" },
    { key: "views_5000" as const, label: "5,000 views" },
    { key: "views_10000" as const, label: "10,000 views" },
    { key: "views_50000" as const, label: "50,000 views" },
    { key: "views_100000" as const, label: "100,000 views" },
  ];

  const likeMilestones = [
    { key: "likes_50" as const, label: "50 likes" },
    { key: "likes_100" as const, label: "100 likes" },
    { key: "likes_500" as const, label: "500 likes" },
    { key: "likes_1000" as const, label: "1,000 likes" },
    { key: "likes_5000" as const, label: "5,000 likes" },
    { key: "likes_10000" as const, label: "10,000 likes" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Preferences
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_notifications">
                    Receive email for milestones
                  </Label>
                  <Switch
                    id="email_notifications"
                    checked={preferences.email_notifications}
                    onCheckedChange={() => togglePreference("email_notifications")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* View Milestones */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    View Milestones
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleAllViews(!viewMilestones.every((m) => preferences[m.key]))
                    }
                  >
                    {viewMilestones.every((m) => preferences[m.key])
                      ? "Disable all"
                      : "Enable all"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {viewMilestones.map((milestone) => (
                  <div
                    key={milestone.key}
                    className="flex items-center justify-between"
                  >
                    <Label htmlFor={milestone.key}>{milestone.label}</Label>
                    <Switch
                      id={milestone.key}
                      checked={preferences[milestone.key]}
                      onCheckedChange={() => togglePreference(milestone.key)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Like Milestones */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Like Milestones
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleAllLikes(!likeMilestones.every((m) => preferences[m.key]))
                    }
                  >
                    {likeMilestones.every((m) => preferences[m.key])
                      ? "Disable all"
                      : "Enable all"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {likeMilestones.map((milestone) => (
                  <div
                    key={milestone.key}
                    className="flex items-center justify-between"
                  >
                    <Label htmlFor={milestone.key}>{milestone.label}</Label>
                    <Switch
                      id={milestone.key}
                      checked={preferences[milestone.key]}
                      onCheckedChange={() => togglePreference(milestone.key)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Separator />

            <Button onClick={savePreferences} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}