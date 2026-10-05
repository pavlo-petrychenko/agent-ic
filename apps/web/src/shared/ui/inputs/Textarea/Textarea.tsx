import clsx from 'clsx';
import type { TextareaProps } from '@/shared/ui/inputs/Textarea/Textarea.typedefs';
import styles from '@/shared/ui/inputs/Textarea/Textarea.module.scss';

export function Textarea({ invalid = false, mono = false, className, ...rest }: TextareaProps) {
  return (
    <textarea
      {...rest}
      aria-invalid={invalid}
      className={clsx(styles.root, mono && styles.mono, invalid && styles.invalid, className)}
    />
  );
}
