import clsx from 'clsx';
import type { DisplayTitleProps } from '@/shared/ui/DisplayTitle/DisplayTitle.typedefs';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/Text';
import styles from '@/shared/ui/DisplayTitle/DisplayTitle.module.scss';

export function DisplayTitle({ title, subtitle = null, className }: DisplayTitleProps) {
  return (
    <div className={clsx(styles.root, className)}>
      <Heading size={HeadingSize.Display} as={HeadingElement.H1}>
        {title}
      </Heading>
      {subtitle !== null && (
        <Text kind={TextKind.Lead} color={TextColor.Mute} className={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </div>
  );
}
