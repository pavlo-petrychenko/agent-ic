import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KNOWLEDGE_UPLOAD_MAX_MEGABYTES,
  KnowledgeFileStatus,
} from '@/features/knowledge/constants/knowledgeUpload.constants';
import type { AddSourceModalProps } from '@/features/knowledge/view/AddSourceModal/AddSourceModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
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
  files,
  readyCount,
  skippedCount,
  onFiles,
  onRemoveFile,
  onSubmit,
  onClose,
}: AddSourceModalProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const summary =
    files.length === 0
      ? t('add.noFiles')
      : [
          readyCount > 0 ? t('add.ready', { count: readyCount }) : null,
          skippedCount > 0 ? t('add.skipped', { count: skippedCount }) : null,
        ]
          .filter((part) => part !== null)
          .join(' · ');

  return (
    <Dialog
      open
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
      footerLeft={<span className={styles.summary}>{summary}</span>}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
          <Button disabled={readyCount === 0} onClick={onSubmit}>
            {readyCount === 0 ? t('add.submitEmpty') : t('add.submit', { count: readyCount })}
          </Button>
        </>
      }
    >
      <div className={styles.layout}>
        <aside className={styles.rail} aria-label={t('add.sourceTypeLabel')}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>{t('add.uploadGroup')}</span>
            <div className={styles.typeCardSelected}>
              <span className={styles.typeIcon}>
                <Icon name={IconName.Upload} size={UPLOAD_ICON_SIZE} />
              </span>
              <span className={styles.typeText}>
                <span className={styles.typeTitle}>{t('add.uploadTitle')}</span>
                <span className={styles.typeDescription}>{t('add.uploadDescription')}</span>
              </span>
              <span className={styles.selectedMark}>
                <Icon
                  name={IconName.Check}
                  size={SOURCE_CHECK_ICON_SIZE}
                  strokeWidth={SOURCE_CHECK_STROKE_WIDTH}
                />
              </span>
            </div>
          </div>
          <div className={styles.group}>
            <div className={styles.groupHeading}>
              <span className={styles.groupLabel}>{t('add.connectGroup')}</span>
              <Badge tone={BadgeTone.Outline}>{t('add.soon')}</Badge>
            </div>
            <button type="button" className={styles.typeCard} disabled>
              <span className={styles.typeIcon}>
                <Icon name={IconName.Note} size={UPLOAD_ICON_SIZE} />
              </span>
              <span className={styles.typeText}>
                <span className={styles.typeTitle}>{t('add.googleDocsTitle')}</span>
                <span className={styles.typeDescription}>{t('add.googleDocsDescription')}</span>
              </span>
            </button>
            <button type="button" className={styles.typeCard} disabled>
              <span className={styles.typeIcon}>
                <Icon name={IconName.Note} size={UPLOAD_ICON_SIZE} />
              </span>
              <span className={styles.typeText}>
                <span className={styles.typeTitle}>{t('add.clickUpTitle')}</span>
                <span className={styles.typeDescription}>{t('add.clickUpDescription')}</span>
              </span>
            </button>
          </div>
        </aside>
        <div className={styles.content}>
          <DropZone
            title={t('add.dropTitle')}
            dragTitle={(count) => t('add.dropDrag', { count })}
            browseLabel={t('add.browse')}
            hint={t('add.hint', { max: KNOWLEDGE_UPLOAD_MAX_MEGABYTES })}
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
                      <Badge
                        tone={
                          file.status === KnowledgeFileStatus.Ready ? BadgeTone.Ok : BadgeTone.Err
                        }
                        dot
                      >
                        {file.status === KnowledgeFileStatus.Ready
                          ? t('add.statusReady')
                          : t('add.statusSkipped')}
                      </Badge>
                    }
                    removeLabel={t('add.remove')}
                    onRemove={() => onRemoveFile(file.id)}
                  />
                ))}
              </FileRowList>
            </div>
          )}
          <Callout tone={CalloutTone.Neutral}>{t('add.info')}</Callout>
        </div>
      </div>
    </Dialog>
  );
}
