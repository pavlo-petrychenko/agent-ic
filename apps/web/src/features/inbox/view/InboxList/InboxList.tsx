import clsx from 'clsx';
import { InboxRowStatusKind } from '@/features/inbox/constants/inbox.constants';
import type {
  InboxListProps,
  RowStatusProps,
} from '@/features/inbox/view/InboxList/InboxList.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { FilterPicker } from '@/shared/ui/data/FilterBar/FilterPicker';
import { Avatar, AvatarSize } from '@/shared/ui/display/Avatar';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { StatusDot, StatusKind } from '@/shared/ui/display/StatusDot';
import { IconName } from '@/shared/ui/foundations/Icon';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import { ConversationRowsSkeleton } from '@/shared/ui/runs/ConversationRow';
import styles from '@/features/inbox/view/InboxList/InboxList.module.scss';

function RowStatus({ status }: RowStatusProps) {
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
  channelFilter,
  agentFilter,
  items,
  empty,
  loading,
  loadingLabel,
  loadError,
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
          <FilterPicker {...channelFilter} />
          <FilterPicker {...agentFilter} />
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
      {items.length === 0 && loadError !== null ? (
        <div className={styles.empty}>
          <EmptyState
            icon={IconName.Alert}
            tone={EmptyStateTone.Err}
            title={loadError.title}
            actions={
              <Button variant={ButtonVariant.Secondary} onClick={loadError.onRetry}>
                {loadError.retryLabel}
              </Button>
            }
          />
        </div>
      ) : items.length === 0 && loading ? (
        <ConversationRowsSkeleton label={loadingLabel} />
      ) : items.length === 0 ? (
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
