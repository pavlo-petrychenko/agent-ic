import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  PROMPT_DIFF_BLANK_LINE,
  PROMPT_DIFF_SIGN,
  PromptDiffSegmentKind,
} from '@/features/prompts/constants/promptCompare.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { PROMPT_VERSION_META_SEPARATOR } from '@/features/prompts/constants/promptVersion.constants';
import type {
  PromptCompareProps,
  PromptCompareVersion,
} from '@/features/prompts/view/PromptCompare/PromptCompare.typedefs';
import { Card, CardElement, CardGap, CardPad } from '@/shared/ui/display/Card';
import { VariableChip } from '@/shared/ui/inputs/VariableChip';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/view/PromptCompare/PromptCompare.module.scss';

export function PromptCompare({ from, to, rows, removed, added }: PromptCompareProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  const versionMeta = (version: PromptCompareVersion): string =>
    [t('versions.number', { number: version.number }), version.date, version.author]
      .filter((part) => part !== null && part !== '')
      .join(PROMPT_VERSION_META_SEPARATOR);

  const versionCard = (version: PromptCompareVersion) => (
    <Card key={version.number} as={CardElement.Div} pad={CardPad.Sm} gap={CardGap.Xs}>
      <Text kind={TextKind.BodySmall} color={TextColor.Ink}>
        {versionMeta(version)}
      </Text>
      {version.note !== null && (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {version.note}
        </Text>
      )}
    </Card>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Text kind={TextKind.Caption} color={TextColor.Mute}>
        {t('compare.summary', { removed, added })}
      </Text>
      <Card flush className={styles.diff}>
        <ul className={styles.rows}>
          {rows.map((row, rowIndex) => (
            <li key={`${row.kind}-${rowIndex}`} className={clsx(styles.row, styles[row.kind])}>
              <span aria-hidden="true" className={styles.sign}>
                {PROMPT_DIFF_SIGN[row.kind]}
              </span>
              <span className={styles.text}>
                {row.segments.length === 0
                  ? PROMPT_DIFF_BLANK_LINE
                  : row.segments.map((segment, segmentIndex) =>
                      segment.kind === PromptDiffSegmentKind.Variable ? (
                        <VariableChip key={segmentIndex} path={segment.path} />
                      ) : (
                        <span key={segmentIndex}>{segment.text}</span>
                      ),
                    )}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <div className={styles.meta}>
        {versionCard(from)}
        {versionCard(to)}
      </div>
    </div>
  );
}
