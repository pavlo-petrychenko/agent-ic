import { useCallback, useMemo, useState } from 'react';
import { defaultPromptTestModelId } from '@/features/prompts/communication/helpers/promptTestModel.helpers';
import { useTestPrompt } from '@/features/prompts/communication/hooks/useTestPrompt';
import { useTestPromptModels } from '@/features/prompts/communication/hooks/useTestPromptModels';
import {
  formatPromptTestDuration,
  formatPromptTestOutput,
} from '@/features/prompts/logic/helpers/promptTestOutput.helpers';
import {
  buildPromptTestSampleFields,
  toPromptTestVariables,
} from '@/features/prompts/logic/helpers/promptTestSample.helpers';
import {
  readPromptTestSamples,
  storePromptTestSamples,
} from '@/features/prompts/storage/helpers/promptTestSampleStorage.helpers';
import type {
  PromptTestResultView,
  PromptTestSampleField,
  UsePromptTestOptions,
  UsePromptTestResult,
} from '@/features/prompts/typedefs/promptTest.typedefs';
import { useLocale } from '@/shared/i18n/hooks/useLocale';

export function usePromptTest(options: UsePromptTestOptions): UsePromptTestResult {
  const { promptId, text, versionNumber, variablePaths } = options;
  const { locale } = useLocale();
  const [testing, setTesting] = useState(false);
  const upstream = useTestPrompt();
  const modelOptions = useTestPromptModels(!testing);
  const [samples, setSamples] = useState<Readonly<Record<string, string>>>(() =>
    readPromptTestSamples(promptId),
  );
  const [customerMessage, setCustomerMessage] = useState('');
  const [model, setModel] = useState<string | null>(null);
  const [today] = useState(() => new Date());
  const [loadedPromptId, setLoadedPromptId] = useState(promptId);
  if (loadedPromptId !== promptId) {
    setLoadedPromptId(promptId);
    setTesting(false);
    setSamples(readPromptTestSamples(promptId));
    setCustomerMessage('');
    setModel(null);
  }

  const effectiveModel =
    model === null || !modelOptions.models.some((choice) => choice.id === model)
      ? defaultPromptTestModelId(modelOptions.models)
      : model;

  const changeVariable = useCallback(
    (path: string, value: string) => {
      setSamples((current) => {
        const next = { ...current, [path]: value };
        storePromptTestSamples(promptId, next);
        return next;
      });
    },
    [promptId],
  );

  const variables = useMemo<readonly PromptTestSampleField[]>(
    () => buildPromptTestSampleFields(variablePaths, samples, locale, today),
    [variablePaths, samples, locale, today],
  );

  const run = useCallback(() => {
    const modelId = effectiveModel;
    const message = customerMessage.trim();
    if (modelId === null || message === '') {
      return;
    }
    upstream.run({
      promptId,
      text,
      versionNumber,
      variables: toPromptTestVariables(variablePaths, samples, locale, today),
      customerMessage: message,
      model: modelId,
    });
  }, [
    effectiveModel,
    upstream,
    promptId,
    text,
    versionNumber,
    variablePaths,
    samples,
    locale,
    today,
    customerMessage,
  ]);

  const result = useMemo<PromptTestResultView | null>(() => {
    const data = upstream.data;
    if (data === null) {
      return null;
    }
    return {
      outputJson: formatPromptTestOutput(data.output),
      model: data.model,
      durationLabel: formatPromptTestDuration(data.durationMs, locale),
      tokensCount: data.usage.inputTokens + data.usage.outputTokens,
    };
  }, [upstream.data, locale]);

  return {
    testing,
    toggleTesting: useCallback(() => setTesting((open) => !open), []),
    closeTesting: useCallback(() => setTesting(false), []),
    variables,
    changeVariable,
    customerMessage,
    changeCustomerMessage: setCustomerMessage,
    models: modelOptions.models,
    modelsLoading: modelOptions.loading,
    model: effectiveModel,
    changeModel: setModel,
    running: upstream.running,
    result,
    failed: upstream.failed,
    canRun: effectiveModel !== null && customerMessage.trim() !== '',
    run,
  };
}
