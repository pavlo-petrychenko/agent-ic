import clsx from 'clsx';
import type { KeyboardEvent } from 'react';
import { EdgeLabel } from '@/shared/ui/flow/EdgeLabel/EdgeLabel';
import {
  FLOW_PORT_CYCLE_STEPS,
  FlowPortKey,
  FlowPortState,
} from '@/shared/ui/flow/FlowPort/FlowPort.constants';
import type { FlowPortKeyboard, FlowPortProps } from '@/shared/ui/flow/FlowPort/FlowPort.typedefs';
import styles from '@/shared/ui/flow/FlowPort/FlowPort.module.scss';

function handleConnectingKey(event: KeyboardEvent<HTMLButtonElement>, keyboard: FlowPortKeyboard) {
  const step = FLOW_PORT_CYCLE_STEPS[event.key];
  if (step !== undefined) {
    event.preventDefault();
    keyboard.onCycle(step);
    return;
  }
  if (event.key === FlowPortKey.Enter) {
    event.preventDefault();
    keyboard.onConfirm();
    return;
  }
  if (event.key === FlowPortKey.Escape) {
    event.preventDefault();
    keyboard.onCancel();
  }
}

function handleIdleKey(event: KeyboardEvent<HTMLButtonElement>, keyboard: FlowPortKeyboard) {
  if (event.key === FlowPortKey.Enter || event.key === FlowPortKey.Space) {
    event.preventDefault();
    keyboard.onStart();
  }
}

export function FlowPort({
  direction,
  state = FlowPortState.Hidden,
  connected = false,
  ariaLabel = null,
  label = null,
  labelActive = false,
  onLabelClick = null,
  keyboard = null,
  className,
}: FlowPortProps) {
  const dotClasses = clsx(styles.dot, styles[state], connected && styles.connected);
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (keyboard === null) {
      return;
    }
    if (state === FlowPortState.Source) {
      handleConnectingKey(event, keyboard);
      return;
    }
    handleIdleKey(event, keyboard);
  };

  return (
    <span
      data-port={direction}
      data-state={state}
      className={clsx(styles.root, styles[direction], className)}
    >
      {keyboard !== null && ariaLabel !== null ? (
        <button
          type="button"
          aria-label={ariaLabel}
          aria-pressed={state === FlowPortState.Source}
          className={clsx(dotClasses, styles.interactive)}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span aria-hidden="true" className={dotClasses} />
      )}
      {label !== null && (
        <EdgeLabel
          text={label}
          active={labelActive}
          onClick={onLabelClick}
          className={styles.label}
        />
      )}
    </span>
  );
}
