import { useTranslation } from 'react-i18next';
import { KnowledgeDocumentStatus } from '@/features/knowledge/constants/knowledgeDocument.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';
import type { KnowledgeSourceDocumentView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { GoogleConnectionBanner } from '@/features/knowledge/view/GoogleConnectionBanner';
import { DOCUMENT_STATUS_TONES } from '@/features/knowledge/view/KnowledgeSourceDetails/KnowledgeSourceDetails.constants';
import type { KnowledgeSourceDetailsProps } from '@/features/knowledge/view/KnowledgeSourceDetails/KnowledgeSourceDetails.typedefs';
import { STATUS_TONES } from '@/features/knowledge/view/KnowledgeSourcesTable/KnowledgeSourcesTable.constants';
import { KnowledgeConnectionStatus } from '@/shared/api/generated/schema.generated';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import { Badge } from '@/shared/ui/display/Badge';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/knowledge/view/KnowledgeSourceDetails/KnowledgeSourceDetails.module.scss';

const DOCUMENT_ICON_SIZE = 15;

export function KnowledgeSourceDetails({
  detail,
  sourceFailureMessage,
  connection,
  reconnecting,
  onReconnect,
  loading,
  failed,
  retrying,
  syncing,
  canManage,
  canRetry,
  canSync,
  addedLabel,
  lastSyncedLabel,
  onReload,
  onClose,
  onSync,
  onRename,
  onRetry,
  onDelete,
}: KnowledgeSourceDetailsProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const source = detail?.source ?? null;
  const documents = detail?.documents ?? [];
  const documentCount = documents.length;
  const active =
    source !== null &&
    (source.status === KnowledgeSourceStatus.Pending ||
      source.status === KnowledgeSourceStatus.Indexing);
  const reconnectConnection: GoogleConnection | null =
    connection !== null && connection.status !== KnowledgeConnectionStatus.Active
      ? connection
      : null;
  const showSourceFailure =
    source !== null &&
    reconnectConnection === null &&
    source.status === KnowledgeSourceStatus.Error &&
    !documents.some(
      (document) =>
        document.status === KnowledgeDocumentStatus.Error &&
        document.errorCode === source.lastErrorCode,
    );

  const kindLabel = (kind: KnowledgeSourceKind): string =>
    kind === KnowledgeSourceKind.Upload ? t('sources.kind.upload') : t('sources.kind.googleDocs');

  const sourceStatusLabel = (status: KnowledgeSourceStatus): string => {
    switch (status) {
      case KnowledgeSourceStatus.Pending:
        return t('sources.status.queued');
      case KnowledgeSourceStatus.Indexing:
        return t('sources.status.indexing');
      case KnowledgeSourceStatus.Ready:
        return t('sources.status.indexed');
      case KnowledgeSourceStatus.Error:
        return t('sources.status.failed');
    }
  };

  const documentStatusLabel = (status: KnowledgeDocumentStatus): string => {
    switch (status) {
      case KnowledgeDocumentStatus.Pending:
        return t('sources.status.queued');
      case KnowledgeDocumentStatus.Indexing:
        return t('sources.status.indexing');
      case KnowledgeDocumentStatus.Indexed:
        return t('sources.status.indexed');
      case KnowledgeDocumentStatus.Error:
        return t('sources.status.failed');
      case KnowledgeDocumentStatus.Removed:
        return t('sources.status.removed');
    }
  };

  const documentSummary = (document: KnowledgeSourceDocumentView): string => {
    const summary = document.summary?.trim() ?? '';
    if (summary.length > 0) {
      return summary;
    }
    if (
      document.status === KnowledgeDocumentStatus.Pending ||
      document.status === KnowledgeDocumentStatus.Indexing
    ) {
      return t('sources.details.summaryPending');
    }
    if (document.status === KnowledgeDocumentStatus.Error) {
      return document.failureMessage ?? t('sources.details.documentFailed');
    }
    return t('sources.details.summaryEmpty');
  };

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <div className={styles.headBody}>
          <h2 className={styles.title}>{source?.title ?? t('sources.details.title')}</h2>
          {source === null ? null : (
            <div className={styles.badges}>
              <Badge>{kindLabel(source.kind)}</Badge>
              <Badge dot tone={STATUS_TONES[source.status]}>
                {sourceStatusLabel(source.status)}
              </Badge>
            </div>
          )}
        </div>
        <IconButton
          icon={IconName.X}
          size={IconButtonSize.Sm}
          variant={IconButtonVariant.Ghost}
          label={t('sources.details.close')}
          onClick={onClose}
        />
      </header>

      <div className={styles.body}>
        {loading ? <Skeleton label={t('sources.details.loading')} /> : null}

        {failed ? (
          <Callout
            tone={CalloutTone.Err}
            icon={IconName.Alert}
            action={
              <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={onReload}>
                {t('sources.details.reload')}
              </Button>
            }
          >
            {t('sources.details.loadError')}
          </Callout>
        ) : null}

        {source !== null ? (
          <>
            <section className={styles.summaryBlock}>
              <div className={styles.meta}>
                <span>{t('sources.details.documentsCount', { count: documentCount })}</span>
                <span>{t('sources.chunks', { count: source.chunkCount })}</span>
                <span>
                  {source.kind === KnowledgeSourceKind.Upload
                    ? t('sources.sync.oneTime')
                    : t('sources.sync.connected')}
                </span>
                {addedLabel === null ? null : <span>{addedLabel}</span>}
                {lastSyncedLabel === null ? null : <span>{lastSyncedLabel}</span>}
              </div>

              {canManage &&
              (onSync !== null || onRename !== null || onRetry !== null || onDelete !== null) ? (
                <div className={styles.actions}>
                  {onSync === null ? null : (
                    <Button
                      variant={ButtonVariant.Secondary}
                      size={ButtonSize.Sm}
                      icon={IconName.Refresh}
                      loading={syncing}
                      disabled={!canSync || syncing}
                      onClick={onSync}
                    >
                      {t('sources.menu.syncNow')}
                    </Button>
                  )}
                  {onRename === null ? null : (
                    <Button
                      variant={ButtonVariant.Secondary}
                      size={ButtonSize.Sm}
                      icon={IconName.Note}
                      onClick={onRename}
                    >
                      {t('sources.menu.rename')}
                    </Button>
                  )}
                  {onRetry === null ? null : (
                    <Button
                      variant={ButtonVariant.Secondary}
                      size={ButtonSize.Sm}
                      icon={IconName.Refresh}
                      loading={retrying}
                      disabled={!canRetry}
                      onClick={onRetry}
                    >
                      {t('sources.menu.retry')}
                    </Button>
                  )}
                  {onDelete === null ? null : (
                    <Button
                      variant={ButtonVariant.Danger}
                      size={ButtonSize.Sm}
                      icon={IconName.X}
                      disabled={active || retrying || syncing}
                      onClick={onDelete}
                    >
                      {t('sources.menu.delete')}
                    </Button>
                  )}
                </div>
              ) : null}

              {reconnectConnection === null ? null : (
                <GoogleConnectionBanner
                  connections={[reconnectConnection]}
                  reconnecting={reconnecting}
                  onReconnect={onReconnect}
                />
              )}

              {showSourceFailure ? (
                <Callout tone={CalloutTone.Err} icon={IconName.Alert}>
                  {sourceFailureMessage ?? t('sources.details.sourceFailed')}
                </Callout>
              ) : null}
            </section>

            <section className={styles.documentsSection}>
              <div className={styles.sectionHead}>
                <h3 className={styles.sectionTitle}>{t('sources.details.documents')}</h3>
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {t('sources.details.documentsCount', { count: documentCount })}
                </Text>
              </div>

              {documents.length === 0 ? (
                <Text kind={TextKind.Small} color={TextColor.Mute}>
                  {t('sources.details.noDocuments')}
                </Text>
              ) : (
                <ul className={styles.documents}>
                  {documents.map((document) => (
                    <li key={document.id} className={styles.document}>
                      <div className={styles.documentHead}>
                        <span className={styles.documentTitle}>
                          <Icon name={IconName.Note} size={DOCUMENT_ICON_SIZE} />
                          <span>{document.title}</span>
                        </span>
                        <Badge tone={DOCUMENT_STATUS_TONES[document.status]} dot>
                          {documentStatusLabel(document.status)}
                        </Badge>
                      </div>
                      <div className={styles.documentMeta}>
                        <span>{t('sources.chunks', { count: document.chunkCount })}</span>
                        <span>{t('sources.details.tokens', { count: document.tokenCount })}</span>
                      </div>
                      <p
                        className={
                          document.status === KnowledgeDocumentStatus.Error
                            ? styles.documentError
                            : styles.documentSummary
                        }
                      >
                        {documentSummary(document)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
