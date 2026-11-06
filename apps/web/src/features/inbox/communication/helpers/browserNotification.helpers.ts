import type {
  BrowserNotificationContent,
  BrowserNotificationPermission,
} from '@/features/inbox/typedefs/browserNotification.typedefs';

export const browserNotificationPermission = (): BrowserNotificationPermission =>
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;

export const showBrowserNotification = (content: BrowserNotificationContent): void => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  const notification = new Notification(content.title, {
    body: content.body,
    tag: content.tag,
  });
  notification.onclick = () => {
    window.focus();
    content.onClick();
    notification.close();
  };
};
