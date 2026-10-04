import clsx from 'clsx';
import { useId } from 'react';
import {
  OPTION_CARD_DESCRIPTION_SUFFIX,
  OPTION_CARD_TITLE_SUFFIX,
} from '@/shared/ui/OptionCard/OptionCard.constants';
import type { OptionCardProps } from '@/shared/ui/OptionCard/OptionCard.typedefs';
import styles from '@/shared/ui/OptionCard/OptionCard.module.scss';

export function OptionCard({
  name,
  value,
  checked,
  onSelect,
  title,
  description = null,
  children = null,
}: OptionCardProps) {
  const id = useId();
  const titleId = `${id}${OPTION_CARD_TITLE_SUFFIX}`;
  const descriptionId = `${id}${OPTION_CARD_DESCRIPTION_SUFFIX}`;

  return (
    <div className={clsx(styles.root, checked && styles.checked)}>
      <label className={styles.choice} htmlFor={id}>
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onSelect(value)}
          aria-labelledby={titleId}
          aria-describedby={description === null ? undefined : descriptionId}
          className={styles.control}
        />
        <span className={styles.text}>
          <span id={titleId} className={styles.title}>
            {title}
          </span>
          {description !== null && (
            <span id={descriptionId} className={styles.description}>
              {description}
            </span>
          )}
        </span>
      </label>
      {children !== null && <div className={styles.body}>{children}</div>}
    </div>
  );
}
