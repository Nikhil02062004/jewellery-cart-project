import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationToggle = () => {
  const { isSupported, permission, requestPermission } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const isEnabled = permission === 'granted';

  return (
    <Button
      variant={isEnabled ? 'default' : 'outline'}
      size="sm"
      onClick={requestPermission}
      disabled={permission === 'denied'}
      className="gap-2"
    >
      {isEnabled ? (
        <>
          <Bell className="h-4 w-4" />
          Push Enabled
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          {permission === 'denied' ? 'Push Blocked' : 'Enable Push'}
        </>
      )}
    </Button>
  );
};
