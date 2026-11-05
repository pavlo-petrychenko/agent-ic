import type { FlowDocument } from '@agent-ic/flow';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  CHANGE_SIGN,
  DAY_MINUTES,
  HOUR_MINUTES,
} from '@/features/flow-builder/constants/publish.constants';
import { toChangeLines } from '@/features/flow-builder/logic/helpers/publish.helpers';
import type { ChangeText, PublishDiff } from '@/features/flow-builder/typedefs/publish.typedefs';

export function useChangeTexts(
  diff: PublishDiff | null,
  document: FlowDocument,
): readonly ChangeText[] {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const duration = useCallback(
    (minutes: number | null | undefined): string | null =>
      minutes === null || minutes === undefined
        ? null
        : minutes % DAY_MINUTES === 0
          ? t('publish.duration.days', { count: minutes / DAY_MINUTES })
          : t('publish.duration.hours', { count: minutes / HOUR_MINUTES }),
    [t],
  );
  return useMemo(
    () =>
      diff === null
        ? []
        : toChangeLines(diff, document).map((line) => ({
            id: line.id,
            sign: CHANGE_SIGN[line.kind],
            signLabel: t(`publish.sign.${CHANGE_SIGN[line.kind]}`),
            text: t(`publish.change.${line.sentence}`, {
              step: line.step,
              field:
                line.field === null
                  ? ''
                  : t(`publish.field.${line.field}`, { defaultValue: t('publish.field.other') }),
              variable: line.variable ?? '',
              before: duration(line.beforeMinutes) ?? line.before,
              after: duration(line.afterMinutes) ?? line.after,
            }),
          })),
    [diff, document, duration, t],
  );
}
