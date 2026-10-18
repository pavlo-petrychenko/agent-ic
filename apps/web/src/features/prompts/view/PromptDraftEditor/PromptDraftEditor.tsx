import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptDraftEditorProps } from '@/features/prompts/view/PromptDraftEditor/PromptDraftEditor.typedefs';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { PromptEditor } from '@/shared/ui/inputs/PromptEditor';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function PromptDraftEditor({
  draftNumber,
  baseVersionNumber,
  text,
  variables,
  onChange,
}: PromptDraftEditorProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge tone={BadgeTone.Warn} dot>
            {baseVersionNumber === null
              ? t('draft.badge', { number: draftNumber })
              : t('draft.editing', { number: draftNumber })}
          </Badge>
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {baseVersionNumber === null
              ? t('draft.neverSaved')
              : t('draft.basedOn', { base: baseVersionNumber })}
          </Text>
        </div>
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('draft.insertVariable')}
        </Text>
      </div>
      <PromptEditor
        value={text}
        onChange={onChange}
        variables={variables}
        label={t('view.body')}
        menuLabel={t('view.variables')}
        placeholder={t('draft.placeholder')}
        fill
      />
    </div>
  );
}
