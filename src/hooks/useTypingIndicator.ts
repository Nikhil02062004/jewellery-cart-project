import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseTypingIndicatorProps {
  conversationId: string | null;
  userId: string | null;
  userType: 'customer' | 'agent';
}

export const useTypingIndicator = ({ conversationId, userId, userType }: UseTypingIndicatorProps) => {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [otherTypingName, setOtherTypingName] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indicatorIdRef = useRef<string | null>(null);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const data = payload.new as {
            user_type: string;
            is_typing: boolean;
            user_id: string;
          };
          
          // Only show typing indicator from the other party
          if (data.user_type !== userType) {
            setIsOtherTyping(data.is_typing);
            setOtherTypingName(data.user_type === 'agent' ? 'Agent' : 'Customer');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userType]);

  // Update typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!conversationId) return;

    try {
      if (indicatorIdRef.current) {
        // Update existing record
        await supabase
          .from('chat_typing_indicators')
          .update({ is_typing: isTyping, updated_at: new Date().toISOString() })
          .eq('id', indicatorIdRef.current);
      } else if (isTyping) {
        // Create new record
        const { data } = await supabase
          .from('chat_typing_indicators')
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            user_type: userType,
            is_typing: true
          })
          .select()
          .single();
        
        if (data) {
          indicatorIdRef.current = data.id;
        }
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [conversationId, userId, userType]);

  // Handle input change with debouncing
  const handleTypingChange = useCallback(() => {
    setTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [setTyping]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  }, [setTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (indicatorIdRef.current) {
        supabase
          .from('chat_typing_indicators')
          .delete()
          .eq('id', indicatorIdRef.current)
          .then(() => {});
      }
    };
  }, []);

  return {
    isOtherTyping,
    otherTypingName,
    handleTypingChange,
    stopTyping
  };
};
