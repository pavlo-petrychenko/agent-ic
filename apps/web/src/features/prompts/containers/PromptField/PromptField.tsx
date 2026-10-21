import { PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptFieldProps } from '@/features/prompts/containers/PromptField/PromptField.typedefs';
import { PromptLibraryCard } from '@/features/prompts/containers/PromptLibraryCard';
import { PromptPickerDialog } from '@/features/prompts/containers/PromptPickerDialog';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function PromptField({ workspaceId, source, variables, error, onChange }: PromptFieldProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const [picking, setPicking] = useState(false);
  const [autoFillPrompt, setAutoFillPrompt] = useState<string | null>(null);
  const clearAutoFill = useCallback(() => setAutoFillPrompt(null), []);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {source !== null ? (
        <PromptLibraryCard
          workspaceId={workspaceId}
          source={source}
          variables={variables}
          autoFill={autoFillPrompt === source.promptRef}
          onAutoFilled={clearAutoFill}
          error={error}
          onChange={onChange}
        />
      ) : (
        <>
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('field.empty')}
          </Text>
          {error !== null && (
            <Text kind={TextKind.Caption} color={TextColor.Err}>
              {error}
            </Text>
          )}
          <Button
            className="self-start"
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Sm}
            icon={IconName.Compl}
            onClick={() => setPicking(true)}
          >
            {t('field.useLibrary')}
          </Button>
        </>
      )}
      {picking && (
        <PromptPickerDialog
          onPick={(promptId) => {
            setAutoFillPrompt(promptId);
            onChange({
              kind: PromptSourceKind.Library,
              promptRef: promptId,
              pin: { kind: PromptVersionKind.Latest },
              bindings: {},
            });
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}
