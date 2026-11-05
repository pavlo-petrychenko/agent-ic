import clsx from 'clsx';
import type { KeyboardEvent, SyntheticEvent } from 'react';
import { EdgeLabel } from '@/shared/ui/flow/EdgeLabel/EdgeLabel';
import {
  FLOW_PORT_CANVAS_IGNORE_CLASSES,
  FLOW_PORT_CYCLE_STEPS,
  FLOW_PORT_TERMINAL_ATTRIBUTE,
  FLOW_PORT_TERMINAL_ICON_SIZE,
  FlowPortKey,
  FlowPortState,
} from '@/shared/ui/flow/FlowPort/FlowPort.constants';
import type {
  FlowPortKeyboard,
  FlowPortProps,
  FlowPortTerminal,
} from '@/shared/ui/flow/FlowPort/FlowPort.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
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

const keepFromCanvas = (event: SyntheticEvent) => event.stopPropagation();

function TerminalChip({ terminal }: { terminal: FlowPortTerminal }) {
  return (
    <span
      {...{ [FLOW_PORT_TERMINAL_ATTRIBUTE]: '' }}
      className={clsx(styles.terminal, terminal.stacked && styles.stacked)}
    >
      <Icon
        name={terminal.icon}
        size={FLOW_PORT_TERMINAL_ICON_SIZE}
        className={styles.terminalIcon}
      />
      <span className={styles.terminalLabel} title={terminal.label}>
        {terminal.label}
      </span>
      <button
        type="button"
        aria-label={terminal.actionAriaLabel}
        className={clsx(styles.terminalAction, FLOW_PORT_CANVAS_IGNORE_CLASSES)}
        onMouseDown={keepFromCanvas}
        onPointerDown={keepFromCanvas}
        onTouchStart={keepFromCanvas}
        onDoubleClick={keepFromCanvas}
        onClick={(event) => {
          event.stopPropagation();
          terminal.onAction();
        }}
      >
        {terminal.actionLabel}
      </button>
    </span>
  );
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
  terminal = null,
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
      {terminal !== null && !connected && <TerminalChip terminal={terminal} />}
    </span>
  );
}
