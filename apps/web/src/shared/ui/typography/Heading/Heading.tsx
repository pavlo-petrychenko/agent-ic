import clsx from 'clsx';
import { createElement } from 'react';
import {
  HEADING_DEFAULT_ELEMENT,
  HeadingSize,
} from '@/shared/ui/typography/Heading/Heading.constants';
import type { HeadingProps } from '@/shared/ui/typography/Heading/Heading.typedefs';
import styles from '@/shared/ui/typography/Heading/Heading.module.scss';

export function Heading({
  size = HeadingSize.H2,
  as = null,
  nowrap = false,
  className,
  children,
  ...rest
}: HeadingProps) {
  return createElement(
    as ?? HEADING_DEFAULT_ELEMENT[size],
    { ...rest, className: clsx(styles.root, styles[size], nowrap && styles.nowrap, className) },
    children,
  );
}
