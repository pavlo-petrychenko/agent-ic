import { LLM_KEY_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import {
  LLM_SELECTABLE_VENDORS,
  LlmKeyCheckStatus,
} from '@/features/settings/constants/llmKey.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { AddLlmKeyDialogProps } from '@/features/settings/containers/AddLlmKeyDialog/AddLlmKeyDialog.typedefs';
import { useAddLlmKeyDialog } from '@/features/settings/containers/AddLlmKeyDialog/useAddLlmKeyDialog';
import {
  applyLlmKeyEdit,
  llmVendorFromValue,
  maskLlmKeyInput,
} from '@/features/settings/logic/helpers/llmKey.helpers';
import { LlmKeyVendor } from '@/shared/api/generated/schema.generated';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Select } from '@/shared/ui/inputs/Select';
import { Switch } from '@/shared/ui/inputs/Switch';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function AddLlmKeyDialog({ vendor, open, onOpenChange }: AddLlmKeyDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const dialog = useAddLlmKeyDialog({ vendor, onOpenChange });
  const { draft, check, busy } = dialog;
  const isCustom = draft.vendor === LlmKeyVendor.Custom;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    dialog.close();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={
        isCustom
          ? t('llmKeys.dialog.customTitle')
          : t('llmKeys.dialog.title', { provider: t(`llmKeys.vendors.${draft.vendor}`) })
      }
      description={t(isCustom ? 'llmKeys.dialog.customDescription' : 'llmKeys.dialog.description')}
      closeLabel={tCommon('ui.close')}
      busy={busy}
      error={dialog.error}
      footerLeft={
        check.status === LlmKeyCheckStatus.Ok ? (
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('llmKeys.dialog.checked')}
          </Text>
        ) : null
      }
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={busy} onClick={dialog.close}>
            {t('llmKeys.dialog.cancel')}
          </Button>
          <Button disabled={!dialog.canSave} loading={busy} onClick={() => void dialog.save()}>
            {t('llmKeys.dialog.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t('llmKeys.dialog.providerLabel')}>
          {(control) => (
            <Select
              {...control}
              value={draft.vendor}
              options={LLM_SELECTABLE_VENDORS.map((option) => ({
                value: option,
                label: t(`llmKeys.vendors.${option}`),
              }))}
              onChange={(event) => {
                const next = llmVendorFromValue(event.target.value);
                if (next !== null) {
                  dialog.setVendor(next);
                }
              }}
            />
          )}
        </Field>
        {isCustom && (
          <>
            <Field label={t('llmKeys.custom.nameLabel')}>
              {(control) => (
                <Input
                  {...control}
                  type="text"
                  value={draft.name}
                  maxLength={LLM_KEY_NAME_MAX_LENGTH}
                  autoComplete="off"
                  onChange={(event) => dialog.setName(event.target.value)}
                />
              )}
            </Field>
            <Field label={t('llmKeys.custom.baseUrlLabel')} hint={t('llmKeys.custom.baseUrlHint')}>
              {(control) => (
                <Input
                  {...control}
                  type="url"
                  value={draft.baseUrl}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => dialog.setBaseUrl(event.target.value)}
                />
              )}
            </Field>
          </>
        )}
        <Field label={t('llmKeys.dialog.keyLabel')} hint={t('llmKeys.dialog.keyHint')}>
          {(control) => (
            <Input
              {...control}
              type="text"
              value={maskLlmKeyInput(draft.apiKey)}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) =>
                dialog.setApiKey(applyLlmKeyEdit(draft.apiKey, event.target.value))
              }
            />
          )}
        </Field>
        {check.status === LlmKeyCheckStatus.Checking && (
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('llmKeys.dialog.checking')}
          </Text>
        )}
        {check.status === LlmKeyCheckStatus.Ok && (
          <Callout tone={CalloutTone.Ok} icon={IconName.Check}>
            {t('llmKeys.dialog.works', { count: check.models.length })}
          </Callout>
        )}
        {check.status === LlmKeyCheckStatus.Failed && (
          <Callout tone={CalloutTone.Err}>{check.message}</Callout>
        )}
        <Switch
          checked={draft.fallbackToPlatform}
          onCheckedChange={dialog.setFallbackToPlatform}
          label={t('llmKeys.fallbackHint')}
        />
        <Text kind={TextKind.BodySmall} color={TextColor.Mute}>
          {t('llmKeys.dialog.afterSave')}
        </Text>
      </div>
    </Dialog>
  );
}
