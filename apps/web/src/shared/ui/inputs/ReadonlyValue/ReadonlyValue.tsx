import clsx from 'clsx';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import { IconName } from '@/shared/ui/foundations/Icon';
import type { ReadonlyValueProps } from '@/shared/ui/inputs/ReadonlyValue/ReadonlyValue.typedefs';
import { useReadonlyValueCopy } from '@/shared/ui/inputs/ReadonlyValue/useReadonlyValueCopy';
import styles from '@/shared/ui/inputs/ReadonlyValue/ReadonlyValue.module.scss';

export function ReadonlyValue({
  mono = false,
  copyText = null,
  copyLabel = null,
  className,
  children,
  ...rest
}: ReadonlyValueProps) {
  const { copied, copy } = useReadonlyValueCopy(copyText);
  const copyable = copyText !== null && copyLabel !== null;

  return (
    <div
      {...rest}
      className={clsx(styles.root, mono && styles.mono, copyable && styles.copyable, className)}
    >
      <span className={styles.value}>{children}</span>
      {copyable && (
        <IconButton
          icon={copied ? IconName.Check : IconName.Copy}
          label={copyLabel}
          variant={IconButtonVariant.Ghost}
          size={IconButtonSize.Xs}
          className={styles.copy}
          onClick={copy}
        />
      )}
    </div>
  );
}
