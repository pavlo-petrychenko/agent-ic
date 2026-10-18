import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { DeletePromptInUseModalProps } from '@/features/prompts/view/DeletePromptInUseModal/DeletePromptInUseModal.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/view/DeletePromptInUseModal/DeletePromptInUseModal.module.scss';

export function DeletePromptInUseModal({
  promptName,
  stepsCount,
  versionCount,
  usages,
  onOpenStep,
  onClose,
}: DeletePromptInUseModalProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const usagesLabel = t('details.usage.versions', { count: usages.length });
  const subtitle =
    versionCount === null
      ? t('deletePrompt.usedIn', { usages: usagesLabel })
      : t('deletePrompt.inUseSubtitle', {
          versions: t('deletePrompt.versions', { count: versionCount }),
          usages: usagesLabel,
        });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('deletePrompt.inUseTitle', { name: promptName })}
      description={subtitle}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={onClose}>
            {t('dialog.close')}
          </Button>
          <Button variant={ButtonVariant.Danger} disabled>
            {t('deletePrompt.submit')}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <Callout tone={CalloutTone.Warn} icon={IconName.Alert}>
          {t('deletePrompt.inUseWarning', { name: promptName, count: stepsCount })}
        </Callout>
        <ul aria-label={t('details.usage.title')} className={styles.rows}>
          {usages.map((usage) => (
            <li key={`${usage.versionId}:${usage.nodeId}`} className={styles.row}>
              <NodeTile kind={NodeKind.Agent} size={TileSize.Sm} aria-label={usage.nodeLabel} />
              <span className={styles.info}>
                <Text as={TextElement.Span} kind={TextKind.BodySmall} className={styles.name}>
                  {t('details.usage.agentVersion', {
                    agent: usage.agentName,
                    version: usage.live
                      ? t('details.usage.versionLive', { number: usage.versionNumber })
                      : t('details.usage.versionDraft'),
                  })}
                </Text>
                <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
                  {usage.nodeLabel}
                </Text>
              </span>
              {usage.live ? (
                <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
                  {t('deletePrompt.published')}
                </Text>
              ) : (
                <Button
                  variant={ButtonVariant.Ghost}
                  size={ButtonSize.Sm}
                  onClick={() => onOpenStep(usage)}
                >
                  {t('deletePrompt.openStep')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
