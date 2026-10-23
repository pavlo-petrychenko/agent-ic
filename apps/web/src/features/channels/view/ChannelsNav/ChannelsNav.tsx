import type { ChannelsNavProps } from '@/features/channels/view/ChannelsNav/ChannelsNav.typedefs';
import { Divider } from '@/shared/ui/layout/Divider';
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
          <NavSectionLabel
            key={group.id}
            label={group.label}
            action={{ label: group.action.label, onClick: group.action.onClick }}
          />
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
