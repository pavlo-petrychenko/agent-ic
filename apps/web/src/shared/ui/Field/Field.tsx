import { useId } from 'react';

import { DESCRIBED_BY_SEPARATOR, ERROR_ID_SUFFIX, HINT_ID_SUFFIX } from './Field.constants';
import styles from './Field.module.scss';
import type { FieldProps } from './Field.typedefs';

export function Field({ label, hint = null, error = null, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}${HINT_ID_SUFFIX}`;
  const errorId = `${id}${ERROR_ID_SUFFIX}`;
  const describedBy = [error === null ? null : errorId, hint === null ? null : hintId]
    .filter((value) => value !== null)
    .join(DESCRIBED_BY_SEPARATOR);

  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children({
        id,
        'aria-describedby': describedBy.length > 0 ? describedBy : undefined,
        invalid: error !== null,
      })}
      {error === null ? null : (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {hint === null ? null : (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
