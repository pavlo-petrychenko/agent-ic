import clsx from 'clsx';
import { CODE_BLOCK_WRAP_BY_DEFAULT, CodeTone } from '@/shared/ui/CodeBlock/CodeBlock.constants';
import type { CodeBlockProps } from '@/shared/ui/CodeBlock/CodeBlock.typedefs';
import { useCodeCopy } from '@/shared/ui/CodeBlock/useCodeCopy';
import { IconName } from '@/shared/ui/Icon';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/IconButton';
import styles from '@/shared/ui/CodeBlock/CodeBlock.module.scss';

export function CodeBlock({
  code,
  tone = CodeTone.Light,
  wrap = null,
  language = null,
  copyLabel = null,
  className,
  ...rest
}: CodeBlockProps) {
  const { copied, copy } = useCodeCopy(code);
  const wrapped = wrap ?? CODE_BLOCK_WRAP_BY_DEFAULT[tone];
  const copyable = copyLabel !== null;

  return (
    <div {...rest} className={clsx(styles.root, styles[tone], className)}>
      <pre
        className={clsx(
          styles.pre,
          wrapped ? styles.wrapped : styles.scrolling,
          copyable && styles.withCopy,
        )}
        tabIndex={wrapped ? undefined : 0}
      >
        <code data-language={language ?? undefined}>{code}</code>
      </pre>
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
