import { MAX_LABEL_LENGTH } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  InputType,
  IssuePathSegment,
  LIST_VALUE_JOINER,
  MOVE_DOWN,
  MOVE_UP,
  ValueInput,
} from '@/features/flow-builder/constants/inspector.constants';
import { NameFieldKey } from '@/features/flow-builder/constants/nameField.constants';
import { InlineEditField } from '@/features/flow-builder/view/InlineEditField';
import type {
  RouteCardProps,
  ValueDraft,
} from '@/features/flow-builder/view/RouterInspector/RouteCard/RouteCard.typedefs';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Input } from '@/shared/ui/inputs/Input';
import { Select, SelectSize } from '@/shared/ui/inputs/Select';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/flow-builder/view/RouterInspector/RouteCard/RouteCard.module.scss';

export function RouteCard({
  index,
  total,
  route,
  fieldOptions,
  ruleError,
  conditionError,
  onRename,
  onMove,
  onRemove,
  onConditionChange,
}: RouteCardProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const errorId = useId();
  const [drafts, setDrafts] = useState<ReadonlyMap<number, ValueDraft>>(new Map());
  const commitDraft = (position: number, text: string) => {
    const draft = drafts.get(position);
    if (draft !== undefined && draft.base === text) {
      onConditionChange(position, { text: draft.value });
    }
    setDrafts((current) => new Map([...current].filter(([key]) => key !== position)));
  };
  const { rule } = route;
  const name = rule.label === '' ? t('inspector.router.route', { number: index + 1 }) : rule.label;
  const message = (issue: FlowIssue) => t(`issue.${issue.code}`, { ...issue.params, rule: name });
  const routeError = ruleError(IssuePathSegment.Conditions) ?? ruleError(IssuePathSegment.Id);

  return (
    <section aria-label={name} className={styles.root}>
      <div className="flex items-center justify-between gap-2">
        <span className={styles.caption}>
          <InlineEditField
            value={rule.label === '' ? null : rule.label}
            placeholder={name}
            editLabel={t('inspector.router.rename')}
            inputLabel={t('inspector.router.nameLabel')}
            maxLength={MAX_LABEL_LENGTH}
            required={false}
            current={false}
            inheritFont
            onCommit={onRename}
          />
        </span>
        <span className={styles.caption}>
          {route.targets.length === 0
            ? t('inspector.router.notConnected')
            : t('inspector.router.target', {
                name: route.targets.map((target) => target.label).join(LIST_VALUE_JOINER),
              })}
        </span>
      </div>
      {route.conditions.map(({ condition, operators, input, values, text }, position) => {
        const at = (segment: IssuePathSegment) => conditionError(position, segment);
        const issue =
          at(IssuePathSegment.Variable) ??
          at(IssuePathSegment.Operator) ??
          at(IssuePathSegment.Value);
        const draft = drafts.get(position);
        const describedBy = issue === null ? undefined : `${errorId}-${position}`;
        const fieldChoices = fieldOptions.includes(condition.variable)
          ? fieldOptions
          : [condition.variable, ...fieldOptions];
        return (
          <div key={position} className="flex flex-col gap-1.5">
            <Select
              size={SelectSize.Sm}
              aria-label={t('inspector.router.field')}
              aria-describedby={describedBy}
              invalid={at(IssuePathSegment.Variable) !== null}
              value={condition.variable}
              options={fieldChoices.map((path) => ({ value: path, label: path }))}
              onChange={(event) => onConditionChange(position, { variable: event.target.value })}
            />
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-1.5">
              <Select
                size={SelectSize.Sm}
                aria-label={t('inspector.router.operator')}
                aria-describedby={describedBy}
                invalid={at(IssuePathSegment.Operator) !== null}
                value={condition.operator}
                options={operators.map((operator) => ({
                  value: operator,
                  label: t(`inspector.operator.${operator}`),
                }))}
                onChange={(event) => {
                  const operator = operators.find((option) => option === event.target.value);
                  if (operator !== undefined) {
                    onConditionChange(position, { operator });
                  }
                }}
              />
              {input === ValueInput.Choice && values !== null && (
                <Select
                  size={SelectSize.Sm}
                  aria-label={t('inspector.router.value')}
                  aria-describedby={describedBy}
                  invalid={at(IssuePathSegment.Value) !== null}
                  value={text}
                  options={(values.includes(text) ? values : [text, ...values]).map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={(event) => onConditionChange(position, { text: event.target.value })}
                />
              )}
              {input !== ValueInput.Choice && input !== ValueInput.None && (
                <Input
                  mono
                  type={input === ValueInput.Number ? InputType.Number : InputType.Text}
                  aria-label={t('inspector.router.value')}
                  aria-describedby={describedBy}
                  placeholder={
                    input === ValueInput.List ? t('inspector.router.listHint') : undefined
                  }
                  invalid={at(IssuePathSegment.Value) !== null}
                  value={draft !== undefined && draft.base === text ? draft.value : text}
                  onChange={(event) =>
                    setDrafts((current) =>
                      new Map(current).set(position, { base: text, value: event.target.value }),
                    )
                  }
                  onBlur={() => commitDraft(position, text)}
                  onKeyDown={(event) => {
                    if (event.key === NameFieldKey.Commit) {
                      commitDraft(position, text);
                    }
                  }}
                />
              )}
            </div>
            {issue !== null && (
              <Text id={describedBy} kind={TextKind.Caption} color={TextColor.Err}>
                {message(issue)}
              </Text>
            )}
          </div>
        );
      })}
      {routeError !== null && (
        <Text kind={TextKind.Caption} color={TextColor.Err} role="alert">
          {message(routeError)}
        </Text>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="ml-auto flex items-center gap-1">
          <IconButton
            icon={IconName.ArrowUp}
            size={IconButtonSize.Xs}
            label={t('inspector.router.moveUp', { name })}
            disabled={index === 0}
            onClick={() => onMove(MOVE_UP)}
          />
          <IconButton
            icon={IconName.ArrowDown}
            size={IconButtonSize.Xs}
            label={t('inspector.router.moveDown', { name })}
            disabled={index === total - 1}
            onClick={() => onMove(MOVE_DOWN)}
          />
          <IconButton
            icon={IconName.X}
            size={IconButtonSize.Xs}
            label={t('inspector.router.remove', { name })}
            onClick={onRemove}
          />
        </div>
      </div>
    </section>
  );
}
