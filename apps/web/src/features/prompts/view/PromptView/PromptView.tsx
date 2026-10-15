import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptViewProps } from '@/features/prompts/view/PromptView/PromptView.typedefs';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { PromptEditor } from '@/shared/ui/inputs/PromptEditor';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function PromptView({ versionNumber, text, savedLabel, variables }: PromptViewProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {versionNumber !== null && (
            <Badge tone={BadgeTone.Ok} dot>
              {t('view.version', { number: versionNumber })}
            </Badge>
          )}
          {savedLabel !== null && (
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {savedLabel}
            </Text>
          )}
        </div>
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('view.readOnly')}
        </Text>
      </div>
      <PromptEditor
        value={text}
        variables={variables}
        label={t('view.body')}
        menuLabel={t('view.variables')}
        placeholder={t('view.noText')}
        readOnly
        fill
      />
    </div>
  );
}
