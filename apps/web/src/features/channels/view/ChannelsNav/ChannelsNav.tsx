import type { ChannelsNavProps } from '@/features/channels/view/ChannelsNav/ChannelsNav.typedefs';
import { Divider } from '@/shared/ui/layout/Divider';
import { ListItem } from '@/shared/ui/navigation/ListItem';
import { NavSectionLabel } from '@/shared/ui/navigation/NavSectionLabel';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/channels/view/ChannelsNav/ChannelsNav.module.scss';

export function ChannelsNav({ title, ariaLabel, groups, emptyLabel }: ChannelsNavProps) {
  return (
    <nav aria-label={ariaLabel} className={styles.root}>
      <header className={styles.header}>
        <Heading size={HeadingSize.H1} as={HeadingElement.Paragraph}>
          {title}
        </Heading>
      </header>
      <div className={styles.groups}>
        {groups.map((group) => (
          <div key={group.id} className={styles.group}>
            <NavSectionLabel
              label={group.label}
              action={{ label: group.action.label, onClick: group.action.onClick }}
            />
            {group.items.length > 0 && (
              <ul className={styles.list}>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <ListItem
                      to={item.to}
                      params={item.params}
                      activeOptions={{ exact: true }}
                      title={item.title}
                      subtitle={item.subtitle}
                      icon={item.icon}
                      selected={item.selected}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      {emptyLabel !== null && (
        <div className={styles.empty}>
          <Divider />
          <Text kind={TextKind.Small} color={TextColor.Mute}>
            {emptyLabel}
          </Text>
        </div>
      )}
    </nav>
  );
}
