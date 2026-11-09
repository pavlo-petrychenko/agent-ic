import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBuilderVersions } from '@/features/flow-builder/communication/hooks/useBuilderVersions';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  VERSION_META_SEPARATOR,
  VERSIONS_DRAWER_WIDTH,
  VersionAction,
} from '@/features/flow-builder/constants/versions.constants';
import { VersionActionDialog } from '@/features/flow-builder/containers/VersionActionDialog';
import type { VersionsDrawerProps } from '@/features/flow-builder/containers/VersionsDrawer/VersionsDrawer.typedefs';
import { formatTimeAgo } from '@/features/flow-builder/logic/helpers/publish.helpers';
import type {
  BuilderVersion,
  VersionActionTarget,
  VersionListItem,
} from '@/features/flow-builder/typedefs/versions.typedefs';
import { VersionList } from '@/features/flow-builder/view/VersionList';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Drawer } from '@/shared/ui/overlays/Drawer';
import styles from '@/features/flow-builder/containers/VersionsDrawer/VersionsDrawer.module.scss';

export function VersionsDrawer({
  agentId,
  open,
  liveNumber,
  nextNumber,
  changeCount,
  canRollback,
  canRestore,
  onCompare,
  onChanged,
  onClose,
}: VersionsDrawerProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { locale } = useLocale();
  const { versions, loading, failed, retry } = useBuilderVersions(agentId, open);
  const [target, setTarget] = useState<VersionActionTarget | null>(null);
  const [now] = useState(Date.now);

  const metaOf = (version: BuilderVersion): string =>
    [
      version.authorName,
      version.publishedAt === null ? null : formatTimeAgo(version.publishedAt, now, locale),
    ]
      .filter((part) => part !== null)
      .join(VERSION_META_SEPARATOR);
  const items: VersionListItem[] = (versions ?? []).map((version) => ({
    id: version.id,
    number: version.number,
    live: version.live,
    note: version.note,
    meta: metaOf(version),
  }));
  const pick = (action: VersionAction) => (id: string) => {
    const version = versions?.find((candidate) => candidate.id === id);
    if (version !== undefined) {
      setTarget({ action, version });
    }
  };

  const body = () => {
    if (failed) {
      return (
        <EmptyState
          icon={IconName.Alert}
          tone={EmptyStateTone.Err}
          title={t('versions.loadError')}
          actions={
            <Button variant={ButtonVariant.Secondary} onClick={retry}>
              {t('retry')}
            </Button>
          }
        />
      );
    }
    if (loading || versions === null) {
      return <Skeleton label={t('versions.loading')} />;
    }
    if (versions.length === 0) {
      return (
        <EmptyState
          icon={IconName.Hour}
          title={t('versions.empty.title')}
          description={t('versions.empty.description')}
        />
      );
    }
    return (
      <VersionList
        items={items}
        canRollback={canRollback}
        canRestore={canRestore}
        onRollback={pick(VersionAction.Rollback)}
        onRestore={pick(VersionAction.Restore)}
      />
    );
  };

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            onClose();
          }
        }}
        ariaLabel={t('versions.title')}
        width={VERSIONS_DRAWER_WIDTH}
      >
        <div className={styles.root}>
          <header className={styles.head}>
            <h2 className={styles.title}>{t('versions.title')}</h2>
            <Button variant={ButtonVariant.Ghost} size={ButtonSize.Sm} onClick={onCompare}>
              {t('versions.compare')}
            </Button>
            <IconButton
              icon={IconName.X}
              size={IconButtonSize.Sm}
              variant={IconButtonVariant.Ghost}
              label={t('versions.close')}
              onClick={onClose}
            />
          </header>
          <div className={styles.body}>{body()}</div>
        </div>
      </Drawer>
      {target !== null && (
        <VersionActionDialog
          action={target.action}
          version={target.version}
          liveNumber={liveNumber}
          nextNumber={nextNumber}
          changeCount={changeCount}
          onDone={(action, number) => {
            setTarget(null);
            retry();
            onChanged(action, number);
          }}
          onClose={() => setTarget(null)}
        />
      )}
    </>
  );
}
