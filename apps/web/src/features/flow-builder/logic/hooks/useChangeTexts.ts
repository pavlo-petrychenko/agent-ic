import type { FlowDocument } from '@agent-ic/flow';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { CHANGE_SIGN } from '@/features/flow-builder/constants/publish.constants';
import { toChangeLines } from '@/features/flow-builder/logic/helpers/publish.helpers';
import type { ChangeText, PublishDiff } from '@/features/flow-builder/typedefs/publish.typedefs';

export function useChangeTexts(
  diff: PublishDiff | null,
  document: FlowDocument,
): readonly ChangeText[] {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
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
              before: line.before,
              after: line.after,
            }),
          })),
    [diff, document, t],
  );
}
