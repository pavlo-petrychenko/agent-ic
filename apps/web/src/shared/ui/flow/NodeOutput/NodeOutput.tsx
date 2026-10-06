import clsx from 'clsx';
import { NODE_OUTPUT_ARROW } from '@/shared/ui/flow/NodeOutput/NodeOutput.constants';
import type { NodeOutputProps } from '@/shared/ui/flow/NodeOutput/NodeOutput.typedefs';
import styles from '@/shared/ui/flow/NodeOutput/NodeOutput.module.scss';

export function NodeOutput({ text, className }: NodeOutputProps) {
  return (
    <span className={clsx(styles.root, className)}>
      <span aria-hidden="true">{NODE_OUTPUT_ARROW}</span>
      <span className={styles.text}>{text}</span>
    </span>
  );
}
