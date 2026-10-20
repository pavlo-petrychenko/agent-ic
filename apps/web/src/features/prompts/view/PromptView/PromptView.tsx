import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptViewProps } from '@/features/prompts/view/PromptView/PromptView.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { PromptEditor } from '@/shared/ui/inputs/PromptEditor';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function PromptView({
  versionNumber,
  text,
  savedLabel,
  variables,
  normalizeVariable,
  olderThanVersionNumber,
  onBackToLatest,
}: PromptViewProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const older = olderThanVersionNumber !== null && onBackToLatest !== null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {versionNumber !== null && (
            <Badge tone={older ? BadgeTone.Neutral : BadgeTone.Ok} dot>
              {older
                ? t('versions.number', { number: versionNumber })
                : t('view.version', { number: versionNumber })}
            </Badge>
          )}
          {savedLabel !== null && (
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {savedLabel}
            </Text>
          )}
        </div>
        {older ? (
          <Button
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Sm}
            onClick={onBackToLatest ?? undefined}
          >
            {t('view.backToLatest', { number: olderThanVersionNumber })}
          </Button>
        ) : (
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('view.readOnly')}
          </Text>
        )}
      </div>
      {older && (
        <Callout tone={CalloutTone.Info}>
          {t('view.olderNotice', { number: olderThanVersionNumber })}
        </Callout>
      )}
      <PromptEditor
        value={text}
        variables={variables}
        label={t('view.body')}
        menuLabel={t('view.variables')}
        normalizeVariable={normalizeVariable}
        placeholder={t('view.noText')}
        readOnly
        fill
      />
    </div>
  );
}
