import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminRoleState {
  isAdmin: boolean;
  loading: boolean;
  userId: string | null;
  requestedAdmin: boolean;
}

/**
 * Shared hook — checks current user's role from the `profiles` table.
 * Uses `supabase as any` to bypass stale generated types until `supabase gen types` is re-run.
 */
export function useAdminRole(): AdminRoleState {
  const [state, setState] = useState<AdminRoleState>({
    isAdmin: false,
    loading: true,
    userId: null,
    requestedAdmin: false,
  });

  useEffect(() => {
    let cancelled = false;

    const checkRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (!cancelled) setState({ isAdmin: false, loading: false, userId: null, requestedAdmin: false });
          return;
        }

        const userId = session.user.id;

        // Cast to any because `profiles` is a new table not yet in generated types
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('role, requested_admin')
          .eq('id', userId)
          .single();

        if (!cancelled) {
          const isAdmin = profile?.role === 'admin';
          const requestedAdmin = profile?.requested_admin ?? false;
          setState({ isAdmin, loading: false, userId, requestedAdmin });
        }
      } catch {
        if (!cancelled) setState({ isAdmin: false, loading: false, userId: null, requestedAdmin: false });
      }
    };

    checkRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setState(prev => ({ ...prev, loading: true }));
      checkRole();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
