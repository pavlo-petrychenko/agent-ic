import { useTranslation } from 'react-i18next';
import { AddSourceType } from '@/features/knowledge/constants/googleConnection.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KNOWLEDGE_UPLOAD_MAX_MEGABYTES,
  KnowledgeFileStatus,
} from '@/features/knowledge/constants/knowledgeUpload.constants';
import { STATUS_TONES } from '@/features/knowledge/view/AddSourceModal/AddSourceModal.constants';
import type { AddSourceModalProps } from '@/features/knowledge/view/AddSourceModal/AddSourceModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge } from '@/shared/ui/display/Badge';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { FileRow, FileRowList } from '@/shared/ui/display/FileRow';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { DropZone } from '@/shared/ui/inputs/DropZone';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import styles from '@/features/knowledge/view/AddSourceModal/AddSourceModal.module.scss';

const UPLOAD_ICON_SIZE = 15;
const SOURCE_CHECK_ICON_SIZE = 12;
const SOURCE_CHECK_STROKE_WIDTH = 2.2;

export function AddSourceModal({
  knowledgeBaseName,
  sourceType,
  files,
  readyCount,
  uploadingCount,
  uploadedCount,
  failedCount,
  skippedCount,
  uploading,
  googleContent,
  onSourceTypeChange,
  onFiles,
  onRemoveFile,
  onSubmit,
  onClose,
}: AddSourceModalProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const isUpload = sourceType === AddSourceType.Upload;
  const actionCount = readyCount + failedCount;
  const summary =
    files.length === 0
      ? t('add.noFiles')
      : [
          readyCount > 0 ? t('add.ready', { count: readyCount }) : null,
          uploadingCount > 0 ? t('add.uploading', { count: uploadingCount }) : null,
          uploadedCount > 0 ? t('add.uploaded', { count: uploadedCount }) : null,
          failedCount > 0 ? t('add.failed', { count: failedCount }) : null,
          skippedCount > 0 ? t('add.skipped', { count: skippedCount }) : null,
        ]
          .filter((part) => part !== null)
          .join(' · ');

  const statusLabel = (status: KnowledgeFileStatus): string => {
    switch (status) {
      case KnowledgeFileStatus.Ready:
        return t('add.statusReady');
      case KnowledgeFileStatus.Uploading:
        return t('add.statusUploading');
      case KnowledgeFileStatus.Uploaded:
        return t('add.statusUploaded');
      case KnowledgeFileStatus.Failed:
        return t('add.statusFailed');
      case KnowledgeFileStatus.Skipped:
        return t('add.statusSkipped');
    }
  };

  const submitLabel =
    actionCount === 0
      ? t('add.submitEmpty')
      : failedCount > 0 && readyCount === 0
        ? t('add.retry', { count: actionCount })
        : t('add.submit', { count: actionCount });

  return (
    <Dialog
      open
      busy={uploading}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('add.title', { name: knowledgeBaseName })}
      description={t('add.description')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Xl}
      flush
      footerLeft={isUpload ? <span className={styles.summary}>{summary}</span> : null}
      footerRight={
        isUpload ? (
          <>
            <Button variant={ButtonVariant.Secondary} disabled={uploading} onClick={onClose}>
              {t('dialog.cancel')}
            </Button>
            <Button loading={uploading} disabled={actionCount === 0} onClick={onSubmit}>
              {submitLabel}
            </Button>
          </>
        ) : (
          <Button variant={ButtonVariant.Secondary} onClick={onClose}>
            {t('dialog.close')}
          </Button>
        )
      }
    >
      <div className={styles.layout}>
        <aside className={styles.rail} aria-label={t('add.sourceTypeLabel')}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>{t('add.uploadGroup')}</span>
            <button
              type="button"
              className={isUpload ? styles.typeCardSelected : styles.typeCard}
              disabled={uploading}
              onClick={() => onSourceTypeChange(AddSourceType.Upload)}
            >
              <span className={styles.typeIcon}>
                <Icon name={IconName.Upload} size={UPLOAD_ICON_SIZE} />
              </span>
              <span className={styles.typeText}>
                <span className={styles.typeTitle}>{t('add.uploadTitle')}</span>
                <span className={styles.typeDescription}>{t('add.uploadDescription')}</span>
              </span>
              {isUpload ? (
                <span className={styles.selectedMark}>
                  <Icon
                    name={IconName.Check}
                    size={SOURCE_CHECK_ICON_SIZE}
                    strokeWidth={SOURCE_CHECK_STROKE_WIDTH}
                  />
                </span>
              ) : null}
            </button>
          </div>
          <div className={styles.group}>
            <span className={styles.groupLabel}>{t('add.connectGroup')}</span>
            <button
              type="button"
              className={isUpload ? styles.typeCard : styles.typeCardSelected}
              disabled={uploading}
              onClick={() => onSourceTypeChange(AddSourceType.GoogleDocs)}
            >
              <span className={styles.typeIcon}>
                <Icon name={IconName.Note} size={UPLOAD_ICON_SIZE} />
              </span>
              <span className={styles.typeText}>
                <span className={styles.typeTitle}>{t('add.googleDocsTitle')}</span>
                <span className={styles.typeDescription}>{t('add.googleDocsDescription')}</span>
              </span>
              {isUpload ? null : (
                <span className={styles.selectedMark}>
                  <Icon
                    name={IconName.Check}
                    size={SOURCE_CHECK_ICON_SIZE}
                    strokeWidth={SOURCE_CHECK_STROKE_WIDTH}
                  />
                </span>
              )}
            </button>
          </div>
        </aside>
        <div className={styles.content}>
          {isUpload ? (
            <>
              <DropZone
                title={t('add.dropTitle')}
                dragTitle={(count) => t('add.dropDrag', { count })}
                browseLabel={t('add.browse')}
                hint={t('add.hint', { max: KNOWLEDGE_UPLOAD_MAX_MEGABYTES })}
                disabled={uploading}
                onFiles={onFiles}
                formatResult={(count) => t('add.filesSelected', { count })}
              />
              {files.length === 0 ? null : (
                <div className={styles.files}>
                  <span className={styles.filesTitle}>{t('add.selectedFiles')}</span>
                  <FileRowList aria-label={t('add.selectedFiles')} className={styles.fileList}>
                    {files.map((file) => (
                      <FileRow
                        key={file.id}
                        icon={
                          <Icon
                            name={IconName.Note}
                            size={UPLOAD_ICON_SIZE}
                            className={styles.fileIcon}
                          />
                        }
                        name={file.name}
                        subtitle={file.subtitle}
                        status={
                          <Badge tone={STATUS_TONES[file.status]} dot>
                            {statusLabel(file.status)}
                          </Badge>
                        }
                        disabled={
                          uploading ||
                          file.status === KnowledgeFileStatus.Uploading ||
                          file.status === KnowledgeFileStatus.Uploaded
                        }
                        removeLabel={t('add.remove')}
                        onRemove={() => onRemoveFile(file.id)}
                      />
                    ))}
                  </FileRowList>
                </div>
              )}
              <Callout tone={CalloutTone.Neutral}>{t('add.info')}</Callout>
            </>
          ) : (
            googleContent
          )}
        </div>
      </div>
    </Dialog>
  );
}
