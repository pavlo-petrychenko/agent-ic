import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showBrowserNotification } from '@/features/inbox/communication/helpers/browserNotification.helpers';

class FakeNotification {
  static permission: NotificationPermission = 'granted';
  static requestPermission = vi.fn<() => Promise<NotificationPermission>>();
  static instances: FakeNotification[] = [];
  readonly close = vi.fn<() => void>();
  onclick: (() => void) | null = null;

  constructor(
    readonly title: string,
    readonly options?: NotificationOptions,
  ) {
    FakeNotification.instances.push(this);
  }
}

describe('showBrowserNotification', () => {
  beforeEach(() => {
    FakeNotification.instances = [];
    FakeNotification.permission = 'granted';
    vi.stubGlobal('Notification', FakeNotification);
    vi.spyOn(window, 'focus').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows a notification and opens the conversation on click', () => {
    const onClick = vi.fn<() => void>();

    showBrowserNotification({
      title: 'Marta S. needs a person',
      body: 'Customer asks to be called back.',
      tag: 'notification-1',
      onClick,
    });

    const [notification] = FakeNotification.instances;
    expect(notification?.title).toBe('Marta S. needs a person');
    expect(notification?.options).toEqual({
      body: 'Customer asks to be called back.',
      tag: 'notification-1',
    });
    notification?.onclick?.();
    expect(window.focus).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();
    expect(notification?.close).toHaveBeenCalled();
  });

  it('does nothing without permission', () => {
    FakeNotification.permission = 'denied';

    showBrowserNotification({
      title: 'Marta S. needs a person',
      body: 'Customer asks to be called back.',
      tag: 'notification-1',
      onClick: vi.fn<() => void>(),
    });

    expect(FakeNotification.instances).toEqual([]);
  });

  it('does nothing when the browser has no Notification API', () => {
    vi.stubGlobal('Notification', undefined);

    expect(() =>
      showBrowserNotification({
        title: 'Marta S. needs a person',
        body: 'Customer asks to be called back.',
        tag: 'notification-1',
        onClick: vi.fn<() => void>(),
      }),
    ).not.toThrow();
  });
});
