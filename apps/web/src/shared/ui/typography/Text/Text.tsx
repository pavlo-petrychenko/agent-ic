import clsx from 'clsx';
import { TextElement, TextKind } from '@/shared/ui/typography/Text/Text.constants';
import type { TextProps } from '@/shared/ui/typography/Text/Text.typedefs';
import styles from '@/shared/ui/typography/Text/Text.module.scss';

export function Text({
  kind = TextKind.Body,
  color = null,
  as = TextElement.Paragraph,
  tabularNums = false,
  className,
  children,
  ...rest
}: TextProps) {
  const Tag = as;

  return (
    <Tag
      {...rest}
      className={clsx(
        styles.root,
        styles[kind],
        color !== null && styles[color],
        tabularNums && styles.tabular,
        className,
      )}
    >
      {children}
    </Tag>
  );
}
