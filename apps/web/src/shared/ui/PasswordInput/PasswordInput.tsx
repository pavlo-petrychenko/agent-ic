import clsx from 'clsx';
import { useState } from 'react';

import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { PasswordInputType } from './PasswordInput.constants';
import styles from './PasswordInput.module.scss';
import type { PasswordInputProps } from './PasswordInput.typedefs';

export function PasswordInput({ showLabel, hideLabel, className, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={clsx(styles.root, className)}>
      <Input
        {...rest}
        type={visible ? PasswordInputType.Visible : PasswordInputType.Hidden}
        className={styles.input}
      />
      <Button
        variant={ButtonVariant.Ghost}
        size={ButtonSize.Sm}
        aria-pressed={visible}
        className={styles.toggle}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? hideLabel : showLabel}
      </Button>
    </div>
  );
}
