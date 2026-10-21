import { PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptFieldProps } from '@/features/prompts/containers/PromptField/PromptField.typedefs';
import { PromptLibraryCard } from '@/features/prompts/containers/PromptLibraryCard';
import { PromptPickerDialog } from '@/features/prompts/containers/PromptPickerDialog';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PromptEditor } from '@/shared/ui/inputs/PromptEditor';

export function PromptField({
  workspaceId,
  source,
  variables,
  label,
  menuLabel,
  placeholder,
  error,
  onChange,
}: PromptFieldProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const [picking, setPicking] = useState(false);
  const inlineText = source !== null && source.kind === PromptSourceKind.Inline ? source.text : '';

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {source !== null && source.kind === PromptSourceKind.Library ? (
        <PromptLibraryCard
          workspaceId={workspaceId}
          source={source}
          error={error}
          onChange={onChange}
        />
      ) : (
        <>
          <PromptEditor
            value={inlineText}
            variables={variables}
            label={label}
            menuLabel={menuLabel}
            placeholder={placeholder}
            error={error}
            onChange={(text) => onChange({ kind: PromptSourceKind.Inline, text })}
          />
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
            onChange({
              kind: PromptSourceKind.Library,
              promptRef: promptId,
              pin: { kind: PromptVersionKind.Latest },
            });
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}
