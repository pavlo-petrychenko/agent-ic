import clsx from 'clsx';
import { Toast } from 'radix-ui';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import {
  TOAST_DURATION_MS,
  TOAST_ICON_SIZE,
  TOAST_MAX_VISIBLE,
  TOAST_PERSISTENT_DURATION_MS,
  TOAST_SWIPE_DIRECTION,
  TOAST_TONE_ICONS,
  TOAST_TONE_ROLES,
  TOAST_WITH_ACTION_DURATION_MS,
  ToastTone,
} from '@/shared/ui/overlays/Toast/Toast.constants';
import { ToastContext } from '@/shared/ui/overlays/Toast/toast.context';
import type {
  ToastAction,
  ToastItem,
  ToastOptions,
  ToastProviderProps,
} from '@/shared/ui/overlays/Toast/Toast.typedefs';
import styles from '@/shared/ui/overlays/Toast/Toast.module.scss';

function resolveDuration(
  tone: ToastTone,
  action: ToastAction | null,
  durationMs: number | null,
): number {
  if (durationMs !== null) {
    return durationMs;
  }
  if (tone === ToastTone.Err) {
    return TOAST_PERSISTENT_DURATION_MS;
  }
  return action === null ? TOAST_DURATION_MS : TOAST_WITH_ACTION_DURATION_MS;
}

export function ToastProvider({ closeLabel, children }: ToastProviderProps) {
  const [items, setItems] = useState<readonly ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback(
    ({ message, tone = ToastTone.Info, action = null, durationMs = null }: ToastOptions) => {
      nextId.current += 1;
      const item: ToastItem = {
        id: nextId.current,
        message,
        tone,
        action,
        durationMs: resolveDuration(tone, action, durationMs),
      };
      setItems((current) => [item, ...current].slice(0, TOAST_MAX_VISIBLE));
    },
    [],
  );

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <Toast.Provider duration={TOAST_DURATION_MS} swipeDirection={TOAST_SWIPE_DIRECTION}>
      <ToastContext value={value}>{children}</ToastContext>
      {items.map((item) => (
        <Toast.Root
          key={item.id}
          type={item.tone === ToastTone.Err ? 'foreground' : 'background'}
          role={TOAST_TONE_ROLES[item.tone]}
          duration={item.durationMs}
          className={clsx(styles.root, styles[item.tone])}
          onOpenChange={(open) => {
            if (!open) {
              dismiss(item.id);
            }
          }}
        >
          <Icon name={TOAST_TONE_ICONS[item.tone]} size={TOAST_ICON_SIZE} className={styles.icon} />
          <Toast.Description className={styles.message}>{item.message}</Toast.Description>
          {item.action === null ? null : (
            <Toast.Action altText={item.action.label} asChild>
              <Button variant={ButtonVariant.Ghost} onClick={item.action.onClick}>
                {item.action.label}
              </Button>
            </Toast.Action>
          )}
          <Toast.Close asChild>
            <IconButton icon={IconName.X} label={closeLabel} size={IconButtonSize.Sm} />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className={styles.viewport} />
    </Toast.Provider>
  );
}
