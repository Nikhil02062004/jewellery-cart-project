import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
interface Agent {
  user_id: string;
  display_name: string;
  is_available: boolean;
}
interface Schedule {
  id: string;
  agent_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return [`${hour}:00`, `${hour}:30`];
}).flat();
export const AgentScheduling = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00"
  });
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const [agentsRes, schedulesRes] = await Promise.all([
        supabase.from("support_agents").select("user_id, display_name, is_available"),
        supabase.from("agent_schedules").select("*")
      ]);
      if (agentsRes.data) setAgents(agentsRes.data);
      if (schedulesRes.data) setSchedules(schedulesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  const addSchedule = async () => {
    if (!selectedAgent) {
      toast.error("Please select an agent");
      return;
    }
    try {
      const { error } = await supabase.from("agent_schedules").insert({
        agent_id: selectedAgent,
        day_of_week: newSchedule.day_of_week,
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
        is_active: true
      });
      if (error) throw error;
      toast.success("Schedule added successfully");
      fetchData();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Schedule already exists for this day");
      } else {
        toast.error("Failed to add schedule");
      }
    }
  };
  const toggleSchedule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("agent_schedules")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: isActive } : s));
    } catch (error) {
      toast.error("Failed to update schedule");
    }
  };
  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase.from("agent_schedules").delete().eq("id", id);
      if (error) throw error;
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast.success("Schedule deleted");
    } catch (error) {
      toast.error("Failed to delete schedule");
    }
  };
  const getAgentName = (agentId: string) => {
    return agents.find(a => a.user_id === agentId)?.display_name || "Unknown";
  };
  const isAgentOnSchedule = (agentId: string) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    return schedules.some(s => 
      s.agent_id === agentId && 
      s.day_of_week === currentDay && 
      s.is_active &&
      s.start_time <= currentTime && 
      s.end_time >= currentTime
    );
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
      {/* Add Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Add Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Agent</label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.user_id} value={agent.user_id}>
                      {agent.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Day</label>
              <Select 
                value={newSchedule.day_of_week.toString()} 
                onValueChange={(v) => setNewSchedule(prev => ({ ...prev, day_of_week: parseInt(v) }))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Start</label>
              <Select 
                value={newSchedule.start_time} 
                onValueChange={(v) => setNewSchedule(prev => ({ ...prev, start_time: v }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">End</label>
              <Select 
                value={newSchedule.end_time} 
                onValueChange={(v) => setNewSchedule(prev => ({ ...prev, end_time: v }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addSchedule}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Agent Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {agents.map(agent => (
              <div key={agent.user_id} className="flex items-center gap-2 p-2 border rounded-lg">
                <span className="text-sm font-medium">{agent.display_name}</span>
                {isAgentOnSchedule(agent.user_id) ? (
                  <Badge className="bg-green-100 text-green-800">On Schedule</Badge>
                ) : (
                  <Badge variant="secondary">Off Schedule</Badge>
                )}
                {agent.is_available && (
                  <Badge className="bg-blue-100 text-blue-800">Available</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No schedules configured</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(schedule => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{getAgentName(schedule.agent_id)}</TableCell>
                    <TableCell>{DAYS[schedule.day_of_week]}</TableCell>
                    <TableCell>{schedule.start_time}</TableCell>
                    <TableCell>{schedule.end_time}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={schedule.is_active}
                        onCheckedChange={(checked) => toggleSchedule(schedule.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSchedule(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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