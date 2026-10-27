import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { TelegramConnectFormProps } from '@/features/channels/view/TelegramConnectForm/TelegramConnectForm.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Card, CardGap, CardPad } from '@/shared/ui/display/Card';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Select } from '@/shared/ui/inputs/Select';

export function TelegramConnectForm({
  token,
  tokenError,
  error,
  busy,
  agentId,
  agentOptions,
  onTokenChange,
  onAgentChange,
  onSubmit,
  onCancel,
}: TelegramConnectFormProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);

  return (
    <Card title={t('telegram.form.cardTitle')} pad={CardPad.Lg} gap={CardGap.Xl}>
      <Field label={t('telegram.form.tokenLabel')} error={tokenError}>
        {(control) => (
          <Input
            {...control}
            value={token}
            mono
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => onTokenChange(event.target.value)}
          />
        )}
      </Field>
      <Field label={t('telegram.form.agentLabel')} hint={t('telegram.form.agentHint')}>
        {(control) => (
          <Select
            {...control}
            value={agentId}
            options={agentOptions}
            onChange={(event) => onAgentChange(event.target.value)}
          />
        )}
      </Field>
      {error !== null && <Callout tone={CalloutTone.Err}>{error}</Callout>}
      <div className="flex gap-2">
        <Button loading={busy} disabled={busy} onClick={onSubmit}>
          {t('telegram.form.connect')}
        </Button>
        <Button variant={ButtonVariant.Secondary} disabled={busy} onClick={onCancel}>
          {t('telegram.form.cancel')}
        </Button>
      </div>
    </Card>
  );
}
