import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import type { SaveStatusProps } from '@/features/flow-builder/view/SaveStatus/SaveStatus.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function SaveStatus({ saveState, onRetry }: SaveStatusProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

  return (
    <output className="flex items-center gap-2">
      {saveState === SaveState.Idle && (
        <Text kind={TextKind.Small} color={TextColor.Mute}>
          {t('autosave.saved')}
        </Text>
      )}
      {(saveState === SaveState.Pending || saveState === SaveState.Saving) && (
        <Text kind={TextKind.Small} color={TextColor.Mute}>
          {t('autosave.saving')}
        </Text>
      )}
      {saveState === SaveState.Conflict && (
        <Text kind={TextKind.Small} color={TextColor.Err}>
          {t('autosave.notSaved')}
        </Text>
      )}
      {saveState === SaveState.Error && (
        <>
          <Text kind={TextKind.Small} color={TextColor.Err}>
            {t('autosave.failed')}
          </Text>
          <Button variant={ButtonVariant.Ghost} size={ButtonSize.Sm} onClick={onRetry}>
            {t('autosave.retry')}
          </Button>
        </>
      )}
    </output>
  );
}
