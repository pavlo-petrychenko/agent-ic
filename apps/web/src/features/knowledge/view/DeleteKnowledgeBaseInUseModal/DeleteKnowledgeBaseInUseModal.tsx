import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { DeleteKnowledgeBaseInUseModalProps } from '@/features/knowledge/view/DeleteKnowledgeBaseInUseModal/DeleteKnowledgeBaseInUseModal.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/knowledge/view/DeleteKnowledgeBaseInUseModal/DeleteKnowledgeBaseInUseModal.module.scss';

export function DeleteKnowledgeBaseInUseModal({
  knowledgeBaseName,
  usages,
  onOpenStep,
  onClose,
}: DeleteKnowledgeBaseInUseModalProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('deleteInUse.title', { name: knowledgeBaseName })}
      description={t('deleteInUse.description', { count: usages.length })}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={onClose}>
            {t('dialog.close')}
          </Button>
          <Button variant={ButtonVariant.Danger} disabled>
            {t('delete.submit')}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <Callout tone={CalloutTone.Warn} icon={IconName.Alert}>
          {t('deleteInUse.warning', { count: usages.length })}
        </Callout>
        <ul aria-label={t('deleteInUse.usageLabel')} className={styles.rows}>
          {usages.map((usage) => (
            <li key={`${usage.versionId}:${usage.nodeId}`} className={styles.row}>
              <NodeTile kind={NodeKind.Agent} size={TileSize.Sm} aria-label={usage.nodeLabel} />
              <span className={styles.info}>
                <Text as={TextElement.Span} kind={TextKind.BodySmall} className={styles.name}>
                  {t('deleteInUse.agentVersion', {
                    agent: usage.agentName,
                    version:
                      usage.versionKind === 'live'
                        ? t('deleteInUse.versionLive', { number: usage.versionNumber })
                        : t('deleteInUse.versionDraft'),
                  })}
                </Text>
                <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
                  {usage.nodeLabel}
                </Text>
              </span>
              {usage.versionKind === 'live' ? (
                <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
                  {t('deleteInUse.published')}
                </Text>
              ) : (
                <Button
                  variant={ButtonVariant.Ghost}
                  size={ButtonSize.Sm}
                  onClick={() => onOpenStep(usage)}
                >
                  {t('deleteInUse.openStep')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
