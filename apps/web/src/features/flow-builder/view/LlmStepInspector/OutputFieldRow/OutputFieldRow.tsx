import { OUTPUT_FIELD_NAME_PATTERN, OutputFieldType } from '@agent-ic/flow';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  LIST_VALUE_JOINER,
  LIST_VALUE_SEPARATOR,
} from '@/features/flow-builder/constants/inspector.constants';
import { NameFieldKey } from '@/features/flow-builder/constants/nameField.constants';
import type { OutputFieldRowProps } from '@/features/flow-builder/view/LlmStepInspector/OutputFieldRow/OutputFieldRow.typedefs';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Input } from '@/shared/ui/inputs/Input';
import { Select, SelectSize } from '@/shared/ui/inputs/Select';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function OutputFieldRow({
  field,
  issue,
  canRemove,
  onChange,
  onRemove,
}: OutputFieldRowProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const errorId = useId();
  const values = field.type === OutputFieldType.Enum ? field.values.join(LIST_VALUE_JOINER) : '';
  const [name, setName] = useState(field.name);
  const [valuesText, setValuesText] = useState(values);
  const nameValid = OUTPUT_FIELD_NAME_PATTERN.test(name);
  const message = nameValid
    ? issue === null
      ? null
      : t(`issue.${issue.code}`, { ...issue.params })
    : t('inspector.llm.fieldNameHint');

  const commitName = () => {
    if (nameValid && name !== field.name) {
      onChange({ name });
    }
  };
  const commitValues = () => {
    const next = valuesText
      .split(LIST_VALUE_SEPARATOR)
      .map((value) => value.trim())
      .filter((value) => value !== '');
    if (next.length > 0) {
      onChange({ values: next });
    } else {
      setValuesText(values);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto] items-center gap-1.5">
        <Input
          mono
          aria-label={t('inspector.llm.fieldName')}
          aria-describedby={message === null ? undefined : errorId}
          invalid={message !== null}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => event.key === NameFieldKey.Commit && commitName()}
        />
        <Select
          size={SelectSize.Sm}
          aria-label={t('inspector.llm.fieldType', { name: field.name })}
          value={field.type}
          options={Object.values(OutputFieldType).map((type) => ({
            value: type,
            label: t(`inspector.type.${type}`),
          }))}
          onChange={(event) => {
            const type = Object.values(OutputFieldType).find(
              (option) => option === event.target.value,
            );
            if (type !== undefined) {
              onChange({ type });
            }
          }}
        />
        <IconButton
          icon={IconName.X}
          size={IconButtonSize.Xs}
          label={t('inspector.llm.removeField', { name: field.name })}
          disabled={!canRemove}
          onClick={onRemove}
        />
      </div>
      {field.type === OutputFieldType.Enum && (
        <Input
          aria-label={t('inspector.llm.fieldValues', { name: field.name })}
          placeholder={t('inspector.router.listHint')}
          value={valuesText}
          onChange={(event) => setValuesText(event.target.value)}
          onBlur={commitValues}
          onKeyDown={(event) => event.key === NameFieldKey.Commit && commitValues()}
        />
      )}
      {message !== null && (
        <Text id={errorId} kind={TextKind.Caption} color={TextColor.Err}>
          {message}
        </Text>
      )}
    </div>
  );
}
