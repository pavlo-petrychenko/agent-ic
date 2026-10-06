import clsx from 'clsx';
import { useState } from 'react';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Panel, PanelSide, PanelTone } from '@/shared/ui/layout/Panel';
import type { WizardFrameProps } from '@/shared/ui/layout/WizardFrame/WizardFrame.typedefs';
import { Stepper } from '@/shared/ui/navigation/Stepper';
import { Drawer } from '@/shared/ui/overlays/Drawer';
import { isCompactBreakpoint } from '@/shared/viewport/helpers/viewport.helpers';
import { useBreakpoint } from '@/shared/viewport/hooks/useBreakpoint';
import styles from '@/shared/ui/layout/WizardFrame/WizardFrame.module.scss';

export function WizardFrame({
  title,
  subtitle = null,
  steps,
  current,
  stepperLabel,
  stepCompletedLabel,
  exitLabel,
  onExit,
  side = null,
  previewLabel,
  footerLeft = null,
  footerRight = null,
  className,
  children,
  ...rest
}: WizardFrameProps) {
  const compact = isCompactBreakpoint(useBreakpoint());
  const [previewOpen, setPreviewOpen] = useState(false);
  const hasSide = side !== null;
  const docked = hasSide && !compact;
  const drawerAvailable = hasSide && compact;

  return (
    <div {...rest} className={clsx(styles.root, className)}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle !== null && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <Stepper
          steps={steps}
          current={current}
          ariaLabel={stepperLabel}
          completedLabel={stepCompletedLabel}
        />
        <div className={styles.headerActions}>
          {drawerAvailable && (
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Sm}
              onClick={() => setPreviewOpen(true)}
            >
              {previewLabel}
            </Button>
          )}
          <Button variant={ButtonVariant.Secondary} icon={IconName.X} onClick={onExit}>
            {exitLabel}
          </Button>
        </div>
      </header>
      <div className={clsx(styles.body, docked && styles.split)}>
        <main className={styles.content}>{children}</main>
        {docked && (
          <Panel
            ariaLabel={previewLabel}
            tone={PanelTone.Panel}
            side={PanelSide.Left}
            flush
            className={styles.side}
          >
            <div className={styles.sideBody}>{side}</div>
          </Panel>
        )}
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>{footerLeft}</div>
        <div className={styles.footerRight}>{footerRight}</div>
      </footer>
      {drawerAvailable && (
        <Drawer
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          ariaLabel={previewLabel}
          className={styles.drawer}
        >
          <div className={styles.sideBody}>{side}</div>
        </Drawer>
      )}
    </div>
  );
}
