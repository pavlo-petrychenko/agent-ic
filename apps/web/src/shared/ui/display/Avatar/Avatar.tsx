import clsx from 'clsx';
import { useState } from 'react';
import { AvatarSize, AvatarTone } from '@/shared/ui/display/Avatar/Avatar.constants';
import type { AvatarProps } from '@/shared/ui/display/Avatar/Avatar.typedefs';
import { StatusDot } from '@/shared/ui/display/StatusDot/StatusDot';
import styles from '@/shared/ui/display/Avatar/Avatar.module.scss';

export function Avatar({
  initials,
  size = AvatarSize.Md,
  tone = AvatarTone.Neutral,
  src = null,
  name = null,
  status = null,
  className,
  ...rest
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const named = name !== null;
  const showImage = src !== null && src !== failedSrc;
  const imageReady = showImage && src === loadedSrc;

  return (
    <span
      {...rest}
      role={named ? 'img' : undefined}
      aria-label={named ? name : undefined}
      aria-hidden={named ? undefined : true}
      className={clsx(
        styles.root,
        styles[size],
        styles[tone],
        imageReady && styles.withImage,
        className,
      )}
    >
      {imageReady ? null : initials}
      {showImage ? (
        <img
          src={src}
          alt=""
          className={clsx(styles.image, !imageReady && styles.loading)}
          onLoad={() => {
            setLoadedSrc(src);
          }}
          onError={() => {
            setFailedSrc(src);
          }}
        />
      ) : null}
      {status === null ? null : (
        <span className={styles.status}>
          <StatusDot kind={status} />
        </span>
      )}
    </span>
  );
}
