import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      
      // Register service worker
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setIsSubscribed(true);
        toast.success('Push notifications enabled!');
        return true;
      } else if (result === 'denied') {
        toast.error('Push notifications were denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable push notifications');
      return false;
    }
    
    return false;
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    // If page is visible, don't send push notification (toast will show instead)
    if (document.visibilityState === 'visible') return;

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [permission]);

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    sendNotification,
  };
};
