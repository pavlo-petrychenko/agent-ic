import { useId } from 'react';
import {
  ERROR_ID_SUFFIX,
  HINT_ID_SUFFIX,
  REQUIRED_MARKER,
} from '@/shared/ui/inputs/Field/Field.constants';
import type { FieldProps } from '@/shared/ui/inputs/Field/Field.typedefs';
import styles from '@/shared/ui/inputs/Field/Field.module.scss';

export function Field({
  label,
  hint = null,
  error = null,
  required = false,
  requiredLabel = null,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}${HINT_ID_SUFFIX}`;
  const errorId = `${id}${ERROR_ID_SUFFIX}`;
  const describedById = error === null ? (hint === null ? null : hintId) : errorId;

  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <>
            {' '}
            <span aria-hidden="true" className={styles.required}>
              {REQUIRED_MARKER}
            </span>
            {requiredLabel !== null && (
              <span className={styles.visuallyHidden}>{requiredLabel}</span>
            )}
          </>
        )}
      </label>
      {children({
        id,
        'aria-describedby': describedById ?? undefined,
        invalid: error !== null,
        required,
      })}
      {error === null ? null : (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {error === null && hint !== null && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
