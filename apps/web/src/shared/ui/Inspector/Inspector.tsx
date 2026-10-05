import clsx from 'clsx';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/Heading';
import { Icon, IconName } from '@/shared/ui/Icon';
import { IconButton, IconButtonSize } from '@/shared/ui/IconButton';
import { INSPECTOR_KICKER_ICON_SIZE } from '@/shared/ui/Inspector/Inspector.constants';
import type { InspectorProps } from '@/shared/ui/Inspector/Inspector.typedefs';
import { NODE_KIND_DEFAULT_ICONS } from '@/shared/ui/NodeTile/NodeTile.constants';
import { Panel, PanelSide, PanelTone } from '@/shared/ui/Panel';
import styles from '@/shared/ui/Inspector/Inspector.module.scss';

export function Inspector({
  kind,
  title,
  subtitle = null,
  closeLabel,
  onClose,
  className,
  children,
  ...rest
}: InspectorProps) {
  return (
    <Panel
      {...rest}
      ariaLabel={title}
      tone={PanelTone.Panel}
      side={PanelSide.None}
      flush
      className={clsx(styles.root, className)}
    >
      <div className={styles.head}>
        <div className={styles.headText}>
          <span className={clsx(styles.kicker, styles[kind.kind])}>
            <Icon
              name={kind.icon ?? NODE_KIND_DEFAULT_ICONS[kind.kind]}
              size={INSPECTOR_KICKER_ICON_SIZE}
            />
            {kind.label}
          </span>
          <Heading size={HeadingSize.H2} as={HeadingElement.H2}>
            {title}
          </Heading>
          {subtitle !== null && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <IconButton
          icon={IconName.X}
          size={IconButtonSize.Sm}
          label={closeLabel}
          onClick={onClose}
        />
      </div>
      <div className={styles.body}>{children}</div>
    </Panel>
  );
}
