import { FlowIssueSeverity } from '@agent-ic/flow';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import type { TemplateFieldProps } from '@/features/flow-builder/view/TemplateField/TemplateField.typedefs';
import { PromptEditor } from '@/shared/ui/inputs/PromptEditor';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function TemplateField({
  label,
  value,
  variables,
  hint,
  issue,
  placeholder,
  onChange,
  onCommit,
}: TemplateFieldProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const message = issue === null ? null : t(`issue.${issue.code}`, { ...issue.params });
  const blocking = issue?.severity === FlowIssueSeverity.Error;

  useEffect(() => onCommit, [onCommit]);

  return (
    <>
      <div className="contents" onBlur={onCommit}>
        <PromptEditor
          value={value}
          variables={variables}
          label={label}
          menuLabel={t('inspector.llm.variables')}
          placeholder={placeholder}
          error={blocking ? message : null}
          onChange={(next) => next !== value && onChange(next)}
        />
      </div>
      {!blocking && message !== null && (
        <Text kind={TextKind.Small} color={TextColor.Warn}>
          {message}
        </Text>
      )}
      {hint !== null && (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {hint}
        </Text>
      )}
    </>
  );
}
