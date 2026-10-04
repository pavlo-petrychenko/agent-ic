import { Dialog as DialogPrimitive } from 'radix-ui';

import { DIALOG_CLOSE_GLYPH } from './Dialog.constants';
import styles from './Dialog.module.scss';
import type { DialogProps } from './Dialog.typedefs';

export function Dialog({
  open,
  onOpenChange,
  title,
  description = null,
  closeLabel,
  footer = null,
  children = null,
}: DialogProps) {
  const describedByOverride = description === null ? { 'aria-describedby': undefined } : {};

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay} />
        <DialogPrimitive.Content className={styles.content} {...describedByOverride}>
          <header className={styles.header}>
            <DialogPrimitive.Title className={styles.title}>{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label={closeLabel} className={styles.close}>
              {DIALOG_CLOSE_GLYPH}
            </DialogPrimitive.Close>
          </header>
          {description === null ? null : (
            <DialogPrimitive.Description className={styles.description}>
              {description}
            </DialogPrimitive.Description>
          )}
          {children}
          {footer === null ? null : <footer className={styles.footer}>{footer}</footer>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
