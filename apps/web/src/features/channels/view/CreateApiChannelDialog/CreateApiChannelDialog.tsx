import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { ApiReplyMode } from '@/features/channels/typedefs/apiChannel.typedefs';
import type { CreateApiChannelDialogProps } from '@/features/channels/view/CreateApiChannelDialog/CreateApiChannelDialog.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { SegmentedControl } from '@/shared/ui/actions/SegmentedControl';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Select } from '@/shared/ui/inputs/Select';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';

export function CreateApiChannelDialog({
  name,
  agentId,
  agentOptions,
  replyMode,
  webhook,
  onOpenChange,
  onNameChange,
  onAgentChange,
  onReplyModeChange,
  onWebhookChange,
  onCancel,
  onCreate,
}: CreateApiChannelDialogProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={t('api.create.title')}
      description={t('api.create.description')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={onCancel}>
            {t('api.create.cancel')}
          </Button>
          <Button onClick={onCreate}>{t('api.create.submit')}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label={t('api.create.name')}>
          {(control) => (
            <Input
              {...control}
              value={name}
              placeholder={t('api.create.namePlaceholder')}
              onChange={(event) => onNameChange(event.target.value)}
            />
          )}
        </Field>
        <Field label={t('api.create.agent')}>
          {(control) => (
            <Select
              {...control}
              value={agentId}
              options={agentOptions}
              onChange={(event) => onAgentChange(event.target.value)}
            />
          )}
        </Field>
        <div className="flex flex-col gap-1.5">
          <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
            {t('api.create.replyLabel')}
          </Text>
          <SegmentedControl
            value={replyMode}
            ariaLabel={t('api.create.replyLabel')}
            options={[
              { value: ApiReplyMode.Response, label: t('api.create.replyResponse') },
              { value: ApiReplyMode.Webhook, label: t('api.create.replyWebhook') },
            ]}
            onValueChange={onReplyModeChange}
          />
        </div>
        <Field label={t('api.create.webhook')} hint={t('api.create.webhookHint')}>
          {(control) => (
            <Input
              {...control}
              value={webhook}
              mono
              placeholder={t('api.create.webhookPlaceholder')}
              onChange={(event) => onWebhookChange(event.target.value)}
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}
