import clsx from 'clsx';
import { useState } from 'react';
import { AvatarSize, AvatarTone } from '@/shared/ui/Avatar/Avatar.constants';
import type { AvatarProps } from '@/shared/ui/Avatar/Avatar.typedefs';
import styles from '@/shared/ui/Avatar/Avatar.module.scss';

export function Avatar({
  initials,
  size = AvatarSize.Md,
  tone = AvatarTone.Neutral,
  src = null,
  name = null,
  className,
  ...rest
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const named = name !== null;
  const showImage = src !== null && src !== failedSrc;

  return (
    <span
      {...rest}
      role={named ? 'img' : undefined}
      aria-label={named ? name : undefined}
      aria-hidden={named ? undefined : true}
      className={clsx(styles.root, styles[size], styles[tone], className)}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          className={styles.image}
          onError={() => {
            setFailedSrc(src);
          }}
        />
      ) : (
        initials
      )}
    </span>
  );
}
