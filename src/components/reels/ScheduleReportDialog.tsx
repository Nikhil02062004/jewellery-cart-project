import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Calendar } from "lucide-react";

interface ScheduleReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

type Frequency = "daily" | "weekly" | "monthly";

export function ScheduleReportDialog({
  open,
  onOpenChange,
  userEmail,
}: ScheduleReportDialogProps) {
  const [email, setEmail] = useState(userEmail);
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [isLoading, setIsLoading] = useState(false);

  const handleSchedule = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("schedule-analytics-report", {
        body: { email, frequency },
      });

      if (error) throw error;

      toast.success(`Analytics report scheduled! You'll receive ${frequency} reports at ${email}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling report:", error);
      toast.error("Failed to schedule report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Analytics Report
          </DialogTitle>
          <DialogDescription>
            Receive periodic email reports with your reel analytics summary.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Report Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {frequency === "daily" && "Report sent every day at 9:00 AM"}
              {frequency === "weekly" && "Report sent every Monday at 9:00 AM"}
              {frequency === "monthly" && "Report sent on the 1st of each month"}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Schedule Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
