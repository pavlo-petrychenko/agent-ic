import { useCallback, useEffect, useState } from 'react';
import { browserNotificationPermission } from '@/features/inbox/communication/helpers/browserNotification.helpers';
import { BROWSER_NOTIFICATION_PERMISSION_EVENT } from '@/features/inbox/constants/browserNotification.constants';
import type { BrowserNotificationPermission } from '@/features/inbox/typedefs/browserNotification.typedefs';

export interface UseBrowserNotificationPermissionResult {
  readonly permission: BrowserNotificationPermission;
  readonly request: () => Promise<void>;
}

export function useBrowserNotificationPermission(): UseBrowserNotificationPermissionResult {
  const [permission, setPermission] = useState<BrowserNotificationPermission>(
    browserNotificationPermission,
  );

  useEffect(() => {
    const update = () => setPermission(browserNotificationPermission());
    window.addEventListener('focus', update);
    window.addEventListener(BROWSER_NOTIFICATION_PERMISSION_EVENT, update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.removeEventListener('focus', update);
      window.removeEventListener(BROWSER_NOTIFICATION_PERMISSION_EVENT, update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  const request = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    window.dispatchEvent(new Event(BROWSER_NOTIFICATION_PERMISSION_EVENT));
  }, []);

  return { permission, request };
}
