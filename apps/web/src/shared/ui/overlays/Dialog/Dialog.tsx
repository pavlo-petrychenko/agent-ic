import clsx from 'clsx';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { IconButton } from '@/shared/ui/actions/IconButton';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { IconName } from '@/shared/ui/foundations/Icon';
import { DIALOG_ERROR_ICON, DialogSize } from '@/shared/ui/overlays/Dialog/Dialog.constants';
import type { DialogProps } from '@/shared/ui/overlays/Dialog/Dialog.typedefs';
import styles from '@/shared/ui/overlays/Dialog/Dialog.module.scss';

function preventDismiss(event: Event) {
  event.preventDefault();
}

export function Dialog({
  open,
  onOpenChange,
  busy = false,
  error = null,
  title,
  description = null,
  closeLabel,
  size = DialogSize.Md,
  footerLeft = null,
  footerRight = null,
  children = null,
}: DialogProps) {
  const describedByOverride = description === null ? { 'aria-describedby': undefined } : {};
  const hasFooter = footerLeft !== null || footerRight !== null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay} />
        <DialogPrimitive.Content
          className={clsx(styles.content, styles[size])}
          aria-busy={busy || undefined}
          onEscapeKeyDown={busy ? preventDismiss : undefined}
          onPointerDownOutside={busy ? preventDismiss : undefined}
          {...describedByOverride}
        >
          <header className={styles.header}>
            <div className={styles.heading}>
              <DialogPrimitive.Title className={styles.title}>{title}</DialogPrimitive.Title>
              {description === null ? null : (
                <DialogPrimitive.Description className={styles.description}>
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <IconButton icon={IconName.X} label={closeLabel} disabled={busy} />
            </DialogPrimitive.Close>
          </header>
          <div className={styles.body}>
            {error === null ? null : (
              <Callout tone={CalloutTone.Err} icon={DIALOG_ERROR_ICON} className={styles.error}>
                {error}
              </Callout>
            )}
            {children}
          </div>
          {hasFooter ? (
            <footer className={styles.footer}>
              <div className={styles.footerLeft}>{footerLeft}</div>
              <div className={styles.footerRight}>{footerRight}</div>
            </footer>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
