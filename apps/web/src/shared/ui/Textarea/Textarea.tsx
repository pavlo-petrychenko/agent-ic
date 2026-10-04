import clsx from 'clsx';
import type { TextareaProps } from '@/shared/ui/Textarea/Textarea.typedefs';
import styles from '@/shared/ui/Textarea/Textarea.module.scss';

export function Textarea({ invalid = false, mono = false, className, ...rest }: TextareaProps) {
  return (
    <textarea
      {...rest}
      aria-invalid={invalid}
      className={clsx(styles.root, mono && styles.mono, invalid && styles.invalid, className)}
    />
  );
}
