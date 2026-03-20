import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
type Priority = 'low' | 'normal' | 'high' | 'urgent' | 'vip';
interface ChatPriorityBadgeProps {
  priority: Priority;
  isVip?: boolean;
  editable?: boolean;
  onChange?: (priority: Priority) => void;
  className?: string;
}
const priorityConfig: Record<Priority, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  vip: {
    label: 'VIP',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    icon: <Crown className="h-3 w-3" />
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    icon: <AlertTriangle className="h-3 w-3" />
  },
  high: {
    label: 'High',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    icon: <ArrowUp className="h-3 w-3" />
  },
  normal: {
    label: 'Normal',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    icon: <Minus className="h-3 w-3" />
  },
  low: {
    label: 'Low',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700',
    icon: <ArrowDown className="h-3 w-3" />
  }
};
export const ChatPriorityBadge = ({ 
  priority, 
  isVip,
  editable = false, 
  onChange,
  className 
}: ChatPriorityBadgeProps) => {
  const displayPriority = isVip ? 'vip' : priority;
  const config = priorityConfig[displayPriority];
  if (editable && onChange) {
    return (
      <Select value={priority} onValueChange={(value) => onChange(value as Priority)}>
        <SelectTrigger className={cn("h-7 w-24 text-xs", className)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background border">
          {Object.entries(priorityConfig).map(([key, value]) => (
            <SelectItem key={key} value={key} className="text-xs">
              <div className="flex items-center gap-1.5">
                {value.icon}
                {value.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs flex items-center gap-1 border",
        config.color,
        config.bgColor,
        className
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
};