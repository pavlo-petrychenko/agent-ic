import clsx from 'clsx';
import { Toolbar } from 'radix-ui';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import {
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_PERCENT_FORMAT,
} from '@/shared/ui/flow/ZoomControl/ZoomControl.constants';
import type { ZoomControlProps } from '@/shared/ui/flow/ZoomControl/ZoomControl.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/flow/ZoomControl/ZoomControl.module.scss';

export function ZoomControl({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  labels,
  min = ZOOM_MIN,
  max = ZOOM_MAX,
  locale = null,
  className,
}: ZoomControlProps) {
  const percent = new Intl.NumberFormat(locale ?? undefined, ZOOM_PERCENT_FORMAT).format(zoom);

  return (
    <Toolbar.Root aria-label={labels.toolbar} className={clsx(styles.root, className)}>
      <Toolbar.Button asChild>
        <IconButton
          icon={IconName.Minus}
          label={labels.zoomOut}
          size={IconButtonSize.Sm}
          disabled={zoom <= min}
          className={styles.button}
          onClick={onZoomOut}
        />
      </Toolbar.Button>
      <output aria-live="polite" className={styles.percent}>
        {percent}
      </output>
      <Toolbar.Button asChild>
        <IconButton
          icon={IconName.Plus}
          label={labels.zoomIn}
          size={IconButtonSize.Sm}
          disabled={zoom >= max}
          className={styles.button}
          onClick={onZoomIn}
        />
      </Toolbar.Button>
      <Toolbar.Separator className={styles.divider} />
      <Toolbar.Button className={styles.fit} onClick={onFit}>
        {labels.fit}
      </Toolbar.Button>
    </Toolbar.Root>
  );
}
