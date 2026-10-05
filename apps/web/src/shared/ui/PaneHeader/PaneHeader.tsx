import clsx from 'clsx';
import { Avatar, AvatarSize, AvatarTone } from '@/shared/ui/Avatar';
import { PaneHeaderHeight } from '@/shared/ui/PaneHeader/PaneHeader.constants';
import type { PaneHeaderProps } from '@/shared/ui/PaneHeader/PaneHeader.typedefs';
import styles from '@/shared/ui/PaneHeader/PaneHeader.module.scss';

export function PaneHeader({
  title,
  subtitle = null,
  avatar = null,
  actions = null,
  height = PaneHeaderHeight.Panel,
  className,
}: PaneHeaderProps) {
  const showAvatar = avatar !== null && height === PaneHeaderHeight.Chat;

  return (
    <header className={clsx(styles.root, styles[height], className)}>
      <div className={styles.identity}>
        {showAvatar && <Avatar {...avatar} size={AvatarSize.Md} tone={AvatarTone.Neutral} />}
        <div className={styles.text}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle !== null && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions !== null && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
