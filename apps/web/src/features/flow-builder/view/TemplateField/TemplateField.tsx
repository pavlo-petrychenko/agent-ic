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
  error,
  placeholder,
  onChange,
  onCommit,
}: TemplateFieldProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

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
          error={error}
          onChange={(next) => next !== value && onChange(next)}
        />
      </div>
      {hint !== null && (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {hint}
        </Text>
      )}
    </>
  );
}
