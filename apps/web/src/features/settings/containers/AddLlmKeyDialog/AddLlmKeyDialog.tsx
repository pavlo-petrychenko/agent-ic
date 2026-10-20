import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { AddLlmKeyDialogProps } from '@/features/settings/containers/AddLlmKeyDialog/AddLlmKeyDialog.typedefs';
import {
  applyLlmKeyEdit,
  llmVendorFromValue,
  maskLlmKeyInput,
} from '@/features/settings/logic/helpers/llmKey.helpers';
import type { ModelVendor } from '@/shared/api/generated/schema.generated';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Select } from '@/shared/ui/inputs/Select';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function AddLlmKeyDialog({
  vendor,
  providers,
  open,
  onOpenChange,
  onSubmit,
}: AddLlmKeyDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();

  const [selected, setSelected] = useState<ModelVendor>(vendor);
  const [key, setKey] = useState('');

  const hasKey = key.trim() !== '';
  const modelCount = providers.find((provider) => provider.vendor === selected)?.modelCount ?? 0;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setKey('');
    }
    onOpenChange(nextOpen);
  };

  const confirm = () => {
    onSubmit(selected, key.trim());
    handleOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('llmKeys.dialog.title', { provider: t(`llmKeys.vendors.${selected}`) })}
      description={t('llmKeys.dialog.description')}
      closeLabel={tCommon('ui.close')}
      footerLeft={
        hasKey ? (
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('llmKeys.dialog.checked')}
          </Text>
        ) : null
      }
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={() => handleOpenChange(false)}>
            {t('llmKeys.dialog.cancel')}
          </Button>
          <Button disabled={!hasKey} onClick={confirm}>
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
              value={selected}
              options={providers.map((provider) => ({
                value: provider.vendor,
                label: t(`llmKeys.vendors.${provider.vendor}`),
              }))}
              onChange={(event) => {
                const next = llmVendorFromValue(event.target.value);
                if (next !== null) {
                  setSelected(next);
                }
              }}
            />
          )}
        </Field>
        <Field label={t('llmKeys.dialog.keyLabel')} hint={t('llmKeys.dialog.keyHint')}>
          {(control) => (
            <Input
              {...control}
              type="text"
              value={maskLlmKeyInput(key)}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setKey(applyLlmKeyEdit(key, event.target.value))}
            />
          )}
        </Field>
        {hasKey && (
          <Callout tone={CalloutTone.Ok} icon={IconName.Check}>
            {t('llmKeys.dialog.works', { count: modelCount })}
          </Callout>
        )}
        <Text kind={TextKind.BodySmall} color={TextColor.Mute}>
          {t('llmKeys.dialog.afterSave')}
        </Text>
      </div>
    </Dialog>
  );
}
