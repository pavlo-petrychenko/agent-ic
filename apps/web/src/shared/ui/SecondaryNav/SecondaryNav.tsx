import clsx from 'clsx';
import { useId } from 'react';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/Heading';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/IconButton';
import { ListItem, ListItemTitleStyle } from '@/shared/ui/ListItem';
import { NavSectionLabel } from '@/shared/ui/NavSectionLabel';
import { SECONDARY_NAV_GROUP_ID_SEPARATOR } from '@/shared/ui/SecondaryNav/SecondaryNav.constants';
import type { SecondaryNavProps } from '@/shared/ui/SecondaryNav/SecondaryNav.typedefs';
import styles from '@/shared/ui/SecondaryNav/SecondaryNav.module.scss';

export function SecondaryNav({
  title,
  ariaLabel,
  action,
  groups,
  headingAs = HeadingElement.H1,
  className,
}: SecondaryNavProps) {
  const baseId = useId();

  return (
    <section aria-label={ariaLabel} className={clsx(styles.root, className)}>
      <header className={styles.header}>
        <Heading size={HeadingSize.H1} as={headingAs} nowrap>
          {title}
        </Heading>
        {action !== null && (
          <IconButton
            icon={IconName.Plus}
            label={action.label}
            variant={IconButtonVariant.Secondary}
            size={IconButtonSize.Sm}
            onClick={action.onClick}
          />
        )}
      </header>
      {groups.map((group) => {
        const labelId = `${baseId}${SECONDARY_NAV_GROUP_ID_SEPARATOR}${group.id}`;

        return (
          <div key={group.id} className={styles.group}>
            <NavSectionLabel label={group.label} id={labelId} action={group.action} />
            <ul aria-labelledby={labelId} className={styles.list}>
              {group.items.map((item) => (
                <li key={item.id}>
                  <ListItem
                    to={item.to}
                    title={item.title}
                    subtitle={item.subtitle}
                    icon={item.tile.icon}
                    tone={item.tile.tone}
                    selected={item.selected}
                    titleStyle={item.monoTitle ? ListItemTitleStyle.Mono : ListItemTitleStyle.Sans}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
