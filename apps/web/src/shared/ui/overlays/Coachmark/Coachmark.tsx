import clsx from 'clsx';
import { useEffect, useId, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { IconName } from '@/shared/ui/foundations/Icon';
import {
  COACHMARK_CENTERED,
  COACHMARK_ESCAPE_KEY,
  COACHMARK_SPOTLIGHT_PADDING,
  CoachmarkPlacement,
} from '@/shared/ui/overlays/Coachmark/Coachmark.constants';
import type {
  CoachmarkProps,
  CoachmarkRect,
} from '@/shared/ui/overlays/Coachmark/Coachmark.typedefs';
import { useCoachmarkPosition } from '@/shared/ui/overlays/Coachmark/useCoachmarkPosition';
import { useTargetRect } from '@/shared/ui/overlays/Coachmark/useTargetRect';
import styles from '@/shared/ui/overlays/Coachmark/Coachmark.module.scss';

const padRect = ({ top, left, width, height }: CoachmarkRect): CoachmarkRect => ({
  top: top - COACHMARK_SPOTLIGHT_PADDING,
  left: left - COACHMARK_SPOTLIGHT_PADDING,
  width: width + 2 * COACHMARK_SPOTLIGHT_PADDING,
  height: height + 2 * COACHMARK_SPOTLIGHT_PADDING,
});

export function Coachmark({
  open,
  target,
  title,
  children,
  progress = null,
  formatProgress,
  placement = CoachmarkPlacement.Bottom,
  primaryAction,
  secondaryAction = null,
  skipStepAction = null,
  onDismiss,
  dismissLabel,
  closeLabel,
}: CoachmarkProps) {
  const titleId = useId();
  const bodyId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const onDismissRef = useRef(onDismiss);
  const focusedTitleRef = useRef<string | null>(null);

  const rect = useTargetRect(target, open);
  const spotlight = useMemo(() => (rect === null ? null : padRect(rect)), [rect]);
  const position = useCoachmarkPosition(cardRef, spotlight, placement, open);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === COACHMARK_ESCAPE_KEY && !event.defaultPrevented) {
        onDismissRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open && focusedTitleRef.current !== title) {
      focusedTitleRef.current = title;
      primaryRef.current?.focus({ preventScroll: true });
    }
  }, [open, title]);

  if (!open) {
    return null;
  }

  const resolvedPlacement = position?.placement ?? COACHMARK_CENTERED;

  return createPortal(
    <>
      {spotlight === null ? (
        <div className={styles.backdrop} data-coachmark-backdrop="" aria-hidden="true" />
      ) : (
        <div
          className={styles.spotlight}
          data-coachmark-spotlight=""
          aria-hidden="true"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}
      <div
        ref={cardRef}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        data-placement={resolvedPlacement}
        className={clsx(styles.card, position === null && styles.pending)}
        style={position === null ? undefined : { top: position.top, left: position.left }}
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            {progress === null ? null : (
              <span className={styles.progress}>{formatProgress(progress)}</span>
            )}
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          </div>
          <IconButton
            icon={IconName.X}
            label={closeLabel}
            size={IconButtonSize.Sm}
            onClick={onDismiss}
          />
        </header>
        <div id={bodyId} className={styles.body}>
          {children}
        </div>
        <footer className={styles.footer}>
          <div className={styles.skips}>
            <Button variant={ButtonVariant.Ghost} size={ButtonSize.Sm} onClick={onDismiss}>
              {dismissLabel}
            </Button>
            {skipStepAction === null ? null : (
              <Button
                variant={ButtonVariant.Ghost}
                size={ButtonSize.Sm}
                onClick={skipStepAction.onClick}
              >
                {skipStepAction.label}
              </Button>
            )}
          </div>
          <div className={styles.actions}>
            {secondaryAction === null ? null : (
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Sm}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
            <Button
              ref={primaryRef}
              variant={ButtonVariant.Primary}
              size={ButtonSize.Sm}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          </div>
        </footer>
      </div>
    </>,
    document.body,
  );
}
