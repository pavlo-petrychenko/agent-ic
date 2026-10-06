import clsx from 'clsx';
import { Callout } from '@/shared/ui/display/Callout/Callout';
import { Tag } from '@/shared/ui/display/Tag/Tag';
import { FlowNodeSize } from '@/shared/ui/flow/FlowNode/FlowNode.constants';
import type { FlowNodeProps } from '@/shared/ui/flow/FlowNode/FlowNode.typedefs';
import { NodeHeader } from '@/shared/ui/flow/NodeHeader/NodeHeader';
import { NodeOutput } from '@/shared/ui/flow/NodeOutput/NodeOutput';
import styles from '@/shared/ui/flow/FlowNode/FlowNode.module.scss';

export function FlowNode({
  kind,
  overline,
  name,
  icon = null,
  meta = null,
  chips = [],
  output = null,
  callout = null,
  size = FlowNodeSize.Full,
  selected = false,
  faded = false,
  disabled = false,
  invalidLabel = null,
  inPort = null,
  outPorts = null,
  className,
  ...rest
}: FlowNodeProps) {
  const full = size === FlowNodeSize.Full;

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      aria-label={name}
      aria-current={selected ? 'true' : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      {...rest}
      className={clsx(
        styles.root,
        styles[size],
        selected && styles.selected,
        faded && styles.faded,
        disabled && styles.disabled,
        invalidLabel !== null && styles.invalid,
        className,
      )}
    >
      <NodeHeader
        kind={kind}
        overline={overline}
        name={name}
        icon={icon}
        invalidLabel={invalidLabel}
      />
      {full && meta !== null && <p className={styles.meta}>{meta}</p>}
      {full && chips.length > 0 && (
        <span className={styles.chips}>
          {chips.map((chip) => (
            <Tag key={chip.id} kind={chip.kind}>
              {chip.label}
            </Tag>
          ))}
        </span>
      )}
      {full && output !== null && <NodeOutput text={output} />}
      {full && callout !== null && <Callout tone={callout.tone}>{callout.text}</Callout>}
      {inPort !== null && <span className={styles.inPort}>{inPort}</span>}
      {outPorts !== null && <span className={styles.outPorts}>{outPorts}</span>}
    </div>
  );
}
