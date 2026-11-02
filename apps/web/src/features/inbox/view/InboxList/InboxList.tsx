import clsx from 'clsx';
import { InboxRowStatusKind } from '@/features/inbox/constants/inbox.constants';
import type { InboxListProps, InboxRowStatus } from '@/features/inbox/typedefs/inbox.typedefs';
import { FilterChip } from '@/shared/ui/actions/FilterChip';
import { Avatar, AvatarSize } from '@/shared/ui/display/Avatar';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { StatusDot, StatusKind } from '@/shared/ui/display/StatusDot';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import styles from '@/features/inbox/view/InboxList/InboxList.module.scss';

function RowStatus({ status }: { readonly status: InboxRowStatus }) {
  if (status.kind === InboxRowStatusKind.Waiting) {
    return <StatusDot kind={StatusKind.Warn} label={status.label} className={styles.waiting} />;
  }
  return <Badge tone={BadgeTone.Violet}>{status.label}</Badge>;
}

export function InboxList({
  title,
  tabs,
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  searchClearLabel,
  channelFilterLabel,
  agentFilterLabel,
  items,
  empty,
  onSelect,
}: InboxListProps) {
  return (
    <section className={styles.root} aria-label={title}>
      <div className={styles.head}>
        <h1 className={styles.title}>{title}</h1>
        <div role="tablist" aria-label={title} className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeTab}
              className={clsx(styles.tab, tab.id === activeTab && styles.active)}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label} <span className={styles.tabCount}>·</span>{' '}
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className={styles.filters}>
          <FilterChip
            label={channelFilterLabel}
            value={null}
            applied={false}
            clearLabel={channelFilterLabel}
            onOpen={() => undefined}
            onClear={() => undefined}
          />
          <FilterChip
            label={agentFilterLabel}
            value={null}
            applied={false}
            clearLabel={agentFilterLabel}
            onOpen={() => undefined}
            onClear={() => undefined}
          />
        </div>
        <SearchInput
          value={search}
          label={searchLabel}
          placeholder={searchPlaceholder}
          clearLabel={searchClearLabel}
          onClear={() => onSearchChange('')}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      {items.length === 0 ? (
        <div className={styles.empty}>
          <EmptyState
            icon={empty.icon}
            tone={empty.tone}
            title={empty.title}
            description={empty.description}
          />
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={clsx(styles.row, item.selected && styles.selected)}
                aria-current={item.selected ? 'true' : undefined}
                onClick={() => onSelect(item.id)}
              >
                <Avatar initials={item.initials} size={AvatarSize.Md} />
                <span className={styles.body}>
                  <span className={styles.top}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.updated}>{item.updated}</span>
                  </span>
                  <span className={styles.previewRow}>
                    <span className={styles.preview}>{item.preview}</span>
                    {item.status === null ? null : <RowStatus status={item.status} />}
                  </span>
                  <span className={styles.source}>{item.source}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
