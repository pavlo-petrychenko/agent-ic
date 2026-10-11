import { MessageContentKind, QuickRepliesKind } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { LIST_VALUE_SEPARATOR } from '@/features/flow-builder/constants/inspector.constants';
import {
  BUTTON_SOURCES,
  MESSAGE_CONTENT_KINDS,
} from '@/features/flow-builder/constants/sendMessage.constants';
import type { SendMessageInspectorProps } from '@/features/flow-builder/view/SendMessageInspector/SendMessageInspector.typedefs';
import { TemplateField } from '@/features/flow-builder/view/TemplateField';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { SegmentedControl } from '@/shared/ui/actions/SegmentedControl';
import { ChatBubble, ChatBubbleFrom } from '@/shared/ui/chat/ChatBubble';
import { QuickReplies } from '@/shared/ui/chat/QuickReplies';
import { Callout } from '@/shared/ui/display/Callout';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Input } from '@/shared/ui/inputs/Input';
import { Select } from '@/shared/ui/inputs/Select';
import { Switch } from '@/shared/ui/inputs/Switch';
import { InspectorSection } from '@/shared/ui/layout/Inspector';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/flow-builder/view/SendMessageInspector/SendMessageInspector.module.scss';

export function SendMessageInspector({
  config,
  variables,
  lists,
  contentIssue,
  buttonsIssue,
  onChange,
  onTextChange,
  onCommit,
  onContentKindChange,
  onButtonsKindChange,
  onButtonChange,
}: SendMessageInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const message = (issue: FlowIssue | null) =>
    issue === null ? null : t(`issue.${issue.code}`, { ...issue.params });
  const { content, quickReplies } = config;
  const listSelect = (
    label: string,
    value: string,
    issue: FlowIssue | null,
    pick: (variable: string) => void,
  ) => (
    <Select
      aria-label={label}
      value={value}
      options={[
        ...(lists.includes(value)
          ? []
          : [
              { value, label: value === '' ? t('inspector.send.pickList') : value, disabled: true },
            ]),
        ...lists.map((path) => ({ value: path, label: path })),
      ]}
      error={message(issue)}
      onChange={(event) => pick(event.target.value)}
    />
  );
  const preview =
    content.kind === MessageContentKind.List
      ? t('inspector.send.previewList', { variable: content.variable })
      : content.text;

  return (
    <>
      <InspectorSection title={t('inspector.send.messages')}>
        <SegmentedControl
          ariaLabel={t('inspector.send.messages')}
          value={content.kind}
          options={MESSAGE_CONTENT_KINDS.map((kind) => ({
            value: kind,
            label: t(`inspector.send.content.${kind}`),
          }))}
          onValueChange={onContentKindChange}
        />
        {content.kind === MessageContentKind.List ? (
          <>
            {listSelect(t('inspector.send.list'), content.variable, contentIssue, (variable) =>
              onChange({ content: { kind: MessageContentKind.List, variable } }),
            )}
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {t('inspector.send.listHint')}
            </Text>
          </>
        ) : (
          <TemplateField
            label={t('inspector.send.text')}
            value={content.text}
            variables={variables}
            hint={null}
            error={message(contentIssue)}
            placeholder={t('inspector.send.textPlaceholder')}
            onChange={onTextChange}
            onCommit={onCommit}
          />
        )}
      </InspectorSection>
      <InspectorSection title={t('inspector.send.between')}>
        <Switch
          label={t('inspector.send.typing')}
          checked={config.typing}
          onCheckedChange={(typing) => onChange({ typing })}
        />
        <Switch
          label={t('inspector.send.waitForDelivery')}
          checked={config.waitForDelivery}
          onCheckedChange={(waitForDelivery) => onChange({ waitForDelivery })}
        />
      </InspectorSection>
      <InspectorSection title={t('inspector.send.buttons')}>
        {quickReplies.kind === QuickRepliesKind.None ? (
          <Callout icon={IconName.Info}>{t('inspector.send.noButtons')}</Callout>
        ) : (
          <Select
            aria-label={t('inspector.send.buttonSource')}
            value={quickReplies.kind}
            options={BUTTON_SOURCES.map((kind) => ({
              value: kind,
              label: t(`inspector.send.source.${kind}`),
            }))}
            onChange={(event) =>
              onButtonsKindChange(
                BUTTON_SOURCES.find((kind) => kind === event.target.value) ?? quickReplies.kind,
              )
            }
          />
        )}
        {quickReplies.kind === QuickRepliesKind.Static &&
          quickReplies.buttons.map((button, index) => (
            <div
              key={[index, button].join(LIST_VALUE_SEPARATOR)}
              className="flex items-center gap-1.5"
            >
              <Input
                aria-label={t('inspector.send.button', { number: index + 1 })}
                defaultValue={button}
                onBlur={(event) => {
                  const label = event.target.value.trim();
                  if (label === '') {
                    event.target.value = button;
                  } else if (label !== button) {
                    onButtonChange(index, label);
                  }
                }}
              />
              <IconButton
                icon={IconName.X}
                size={IconButtonSize.Xs}
                label={t('inspector.send.removeButton', { name: button })}
                disabled={quickReplies.buttons.length === 1}
                onClick={() => onButtonChange(index, null)}
              />
            </div>
          ))}
        {quickReplies.kind === QuickRepliesKind.Variable &&
          listSelect(
            t('inspector.send.buttonList'),
            quickReplies.variable,
            buttonsIssue,
            (variable) => onChange({ quickReplies: { kind: QuickRepliesKind.Variable, variable } }),
          )}
        {quickReplies.kind !== QuickRepliesKind.Variable && (
          <Button
            className="self-start"
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Sm}
            icon={IconName.Plus}
            onClick={() =>
              quickReplies.kind === QuickRepliesKind.Static
                ? onButtonChange(quickReplies.buttons.length, t('inspector.send.newButton'))
                : onButtonsKindChange(QuickRepliesKind.Static)
            }
          >
            {t(`inspector.send.add.${quickReplies.kind}`)}
          </Button>
        )}
      </InspectorSection>
      <InspectorSection title={t('inspector.send.preview')}>
        <div className={styles.preview}>
          <ChatBubble from={ChatBubbleFrom.Agent} author={null} time={null}>
            {preview === '' ? t('inspector.send.previewEmpty') : preview}
          </ChatBubble>
          {quickReplies.kind === QuickRepliesKind.Static && (
            <QuickReplies
              label={t('inspector.send.buttons')}
              options={quickReplies.buttons}
              chosen={null}
              disabled
              onChoose={() => undefined}
            />
          )}
        </div>
      </InspectorSection>
    </>
  );
}
