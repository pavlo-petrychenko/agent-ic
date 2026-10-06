import clsx from 'clsx';
import { ChatBubbleView } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import { TYPING_DOT_COUNT } from '@/shared/ui/chat/TypingIndicator/TypingIndicator.constants';
import type { TypingIndicatorProps } from '@/shared/ui/chat/TypingIndicator/TypingIndicator.typedefs';
import { useTypingExpiry } from '@/shared/ui/chat/TypingIndicator/useTypingExpiry';
import styles from '@/shared/ui/chat/TypingIndicator/TypingIndicator.module.scss';

const DOTS = Array.from({ length: TYPING_DOT_COUNT }, (_, index) => index);

export function TypingIndicator({
  label,
  view = ChatBubbleView.Thread,
  className,
  ...rest
}: TypingIndicatorProps) {
  const expired = useTypingExpiry();

  if (expired) {
    return null;
  }

  return (
    <output {...rest} className={clsx(styles.root, styles[view], className)}>
      <span aria-hidden="true" className={styles.bubble}>
        {DOTS.map((dot) => (
          <span key={dot} className={styles.dot} />
        ))}
      </span>
      <span className={styles.caption}>{label}</span>
    </output>
  );
}
