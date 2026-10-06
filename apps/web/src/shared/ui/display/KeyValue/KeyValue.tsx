import clsx from 'clsx';
import type { CSSProperties } from 'react';
import {
  KEY_VALUE_COLUMNS_AFTER_LABEL,
  KeyValueLayout,
} from '@/shared/ui/display/KeyValue/KeyValue.constants';
import type { KeyValueProps } from '@/shared/ui/display/KeyValue/KeyValue.typedefs';
import styles from '@/shared/ui/display/KeyValue/KeyValue.module.scss';

function rowStyle(layout: KeyValueLayout, labelWidth: number | null): CSSProperties | undefined {
  const after = KEY_VALUE_COLUMNS_AFTER_LABEL[layout];
  if (labelWidth === null || after === null) {
    return undefined;
  }
  return { gridTemplateColumns: `${labelWidth}px ${after}` };
}

export function KeyValue({
  items,
  layout = KeyValueLayout.Kv,
  labelWidth = null,
  className,
}: KeyValueProps) {
  const style = rowStyle(layout, labelWidth);

  return (
    <dl className={clsx(styles.root, styles[layout], className)}>
      {items.map((item) => {
        const trailing = item.trailing ?? null;

        return (
          <div key={item.label} className={styles.row} style={style}>
            <dt className={styles.label}>{item.label}</dt>
            <dd className={clsx(styles.value, item.mono === true && styles.mono)}>{item.value}</dd>
            {trailing !== null && <dd className={styles.trailing}>{trailing}</dd>}
          </div>
        );
      })}
    </dl>
  );
}
