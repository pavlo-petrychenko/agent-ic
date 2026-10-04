import clsx from 'clsx';
import { Toast } from 'radix-ui';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  TOAST_CLOSE_GLYPH,
  TOAST_DURATION_MS,
  TOAST_SWIPE_DIRECTION,
  ToastTone,
} from './Toast.constants';
import styles from './Toast.module.scss';
import type { ToastItem, ToastOptions, ToastProviderProps } from './Toast.typedefs';
import { ToastContext } from './toastContext';

export function ToastProvider({ closeLabel, children }: ToastProviderProps) {
  const [items, setItems] = useState<readonly ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback(
    ({ title, description = null, tone = ToastTone.Neutral }: ToastOptions) => {
      nextId.current += 1;
      const item: ToastItem = { id: nextId.current, title, description, tone };
      setItems((current) => [...current, item]);
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
          className={clsx(styles.root, styles[item.tone])}
          onOpenChange={(open) => {
            if (!open) {
              dismiss(item.id);
            }
          }}
        >
          <div className={styles.content}>
            <Toast.Title className={styles.title}>{item.title}</Toast.Title>
            {item.description === null ? null : (
              <Toast.Description className={styles.description}>
                {item.description}
              </Toast.Description>
            )}
          </div>
          <Toast.Close aria-label={closeLabel} className={styles.close}>
            {TOAST_CLOSE_GLYPH}
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className={styles.viewport} />
    </Toast.Provider>
  );
}
