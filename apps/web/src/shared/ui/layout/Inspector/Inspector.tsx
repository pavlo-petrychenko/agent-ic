import clsx from 'clsx';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { NODE_KIND_DEFAULT_ICONS } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { INSPECTOR_KICKER_ICON_SIZE } from '@/shared/ui/layout/Inspector/Inspector.constants';
import type { InspectorProps } from '@/shared/ui/layout/Inspector/Inspector.typedefs';
import { Panel, PanelSide, PanelTone } from '@/shared/ui/layout/Panel';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import styles from '@/shared/ui/layout/Inspector/Inspector.module.scss';

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
