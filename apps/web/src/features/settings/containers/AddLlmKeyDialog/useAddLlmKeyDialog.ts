import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAddLlmKey } from '@/features/settings/communication/hooks/useAddLlmKey';
import { useCheckLlmKey } from '@/features/settings/communication/hooks/useCheckLlmKey';
import {
  LLM_KEY_CHECK_DEBOUNCE_MS,
  LlmKeyCheckStatus,
} from '@/features/settings/constants/llmKey.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type {
  UseAddLlmKeyDialogOptions,
  UseAddLlmKeyDialogResult,
} from '@/features/settings/containers/AddLlmKeyDialog/AddLlmKeyDialog.typedefs';
import {
  isLlmKeyDraftComplete,
  llmKeyCheckInput,
  resolveLlmKeyCheck,
} from '@/features/settings/logic/helpers/llmKey.helpers';
import type {
  LlmKeyCheckOutcome,
  LlmKeyCheckState,
} from '@/features/settings/typedefs/llmKey.typedefs';
import { LlmKeyVendor } from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useAddLlmKeyDialog({
  vendor,
  onOpenChange,
}: UseAddLlmKeyDialogOptions): UseAddLlmKeyDialogResult {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const checkLlmKey = useCheckLlmKey();
  const addLlmKey = useAddLlmKey();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const [selected, setSelected] = useState<LlmKeyVendor>(vendor);
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [fallbackToPlatform, setFallbackToPlatform] = useState(false);
  const [outcome, setOutcome] = useState<LlmKeyCheckOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInput = useMemo(
    () => llmKeyCheckInput({ vendor: selected, apiKey, baseUrl }),
    [selected, apiKey, baseUrl],
  );
  const checkId = checkInput === null ? null : JSON.stringify(checkInput);

  useEffect(() => {
    if (checkInput === null || checkId === null) {
      return undefined;
    }
    let cancelled = false;
    const finish = (state: LlmKeyCheckState) => {
      if (!cancelled) {
        setOutcome({ checkId, state });
      }
    };
    const timer = window.setTimeout(() => {
      checkLlmKey(checkInput)
        .then((models) => finish({ status: LlmKeyCheckStatus.Ok, models }))
        .catch((caught: unknown) =>
          finish({ status: LlmKeyCheckStatus.Failed, message: errorMessage(toAppError(caught)) }),
        );
    }, LLM_KEY_CHECK_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [checkInput, checkId, checkLlmKey, errorMessage]);

  const check = resolveLlmKeyCheck(checkId, outcome);

  const draft = { vendor: selected, name, baseUrl, apiKey, fallbackToPlatform };
  const isCustom = selected === LlmKeyVendor.Custom;
  const canSave = check.status === LlmKeyCheckStatus.Ok && isLlmKeyDraftComplete(draft) && !busy;

  const close = () => {
    setError(null);
    onOpenChange(false);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await addLlmKey({
        vendor: selected,
        apiKey: apiKey.trim(),
        name: isCustom ? name.trim() : null,
        baseUrl: isCustom ? baseUrl.trim() : null,
        fallbackToPlatform,
      });
      showToast({
        message: t('llmKeys.saved', {
          provider: isCustom ? name.trim() : t(`llmKeys.vendors.${selected}`),
        }),
        tone: ToastTone.Ok,
      });
      close();
    } catch (caught) {
      setError(errorMessage(toAppError(caught)));
    } finally {
      setBusy(false);
    }
  };

  return {
    draft,
    check,
    busy,
    error,
    canSave,
    setVendor: setSelected,
    setApiKey,
    setName,
    setBaseUrl,
    setFallbackToPlatform,
    save,
    close,
  };
}
