import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface RealtimeMilestoneAlertsProps {
  userId: string;
}

interface MilestonePayload {
  id: string;
  reel_id: string;
  user_id: string;
  milestone_type: string;
  milestone_value: number;
  reached_at: string;
  is_read: boolean;
}

export const RealtimeMilestoneAlerts = ({ userId }: RealtimeMilestoneAlertsProps) => {
  const preferencesRef = useRef<Record<string, boolean> | null>(null);
  const { permission, sendNotification } = usePushNotifications();

  useEffect(() => {
    // Fetch user's notification preferences
    const fetchPreferences = async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        // Extract only boolean preference fields
        preferencesRef.current = {
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
        };
      }
    };

    fetchPreferences();
  }, [userId]);

  useEffect(() => {
    const formatMilestoneValue = (value: number): string => {
      if (value >= 100000) return `${value / 1000}K`;
      if (value >= 1000) return `${value / 1000}K`;
      return value.toString();
    };

    // Subscribe to new milestones for this user
    const channel = supabase
      .channel('realtime-milestones')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reel_milestones',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const milestone = payload.new as MilestonePayload;
          
          // Check if user wants this notification
          const prefKey = `${milestone.milestone_type}_${milestone.milestone_value}`;
          if (preferencesRef.current && preferencesRef.current[prefKey] === false) {
            return; // User disabled this notification type
          }

          // Fetch reel details for the notification
          const { data: reel } = await supabase
            .from('reels')
            .select('caption')
            .eq('id', milestone.reel_id)
            .single();

          const reelName = reel?.caption || 'Your reel';
          const formattedValue = formatMilestoneValue(milestone.milestone_value);
          const icon = milestone.milestone_type === 'views' ? '👁️' : '❤️';
          const truncatedName = reelName.substring(0, 30) + (reelName.length > 30 ? '...' : '');

          // Send email notification via edge function
          supabase.functions.invoke('send-milestone-email', {
            body: {
              user_id: userId,
              reel_id: milestone.reel_id,
              milestone_type: milestone.milestone_type,
              milestone_value: milestone.milestone_value,
              reel_caption: reel?.caption
            }
          }).catch(err => console.error('Failed to send milestone email:', err));

          // Show in-app toast if page is visible
          if (document.visibilityState === 'visible') {
            toast.success(
              `${icon} Milestone Reached!`,
              {
                description: `"${truncatedName}" hit ${formattedValue} ${milestone.milestone_type}!`,
                duration: 5000,
                icon: <Trophy className="w-5 h-5 text-yellow-500" />,
              }
            );
          }

          // Send browser push notification for background alerts
          if (permission === 'granted') {
            sendNotification(`${icon} Milestone Reached!`, {
              body: `"${truncatedName}" hit ${formattedValue} ${milestone.milestone_type}!`,
              tag: `milestone-${milestone.id}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, permission, sendNotification]);

  // This component doesn't render anything visible
  return null;
};