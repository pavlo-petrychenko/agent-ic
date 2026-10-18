import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  PROMPT_COMPARE_ARROW_SIZE,
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
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Card, CardElement, CardGap, CardPad } from '@/shared/ui/display/Card';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { SelectButton } from '@/shared/ui/inputs/SelectButton';
import { VariableChip } from '@/shared/ui/inputs/VariableChip';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/view/PromptCompare/PromptCompare.module.scss';

export function PromptCompare({
  fromId,
  toId,
  options,
  from,
  to,
  diff,
  failed,
  onSelectFrom,
  onSelectTo,
  onRetry,
}: PromptCompareProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  const versionLabel = (versionId: string): string => {
    const option = options.find((entry) => entry.id === versionId);
    return option === undefined ? '' : t('versions.number', { number: option.number });
  };

  const optionItems = options.map((option) => ({
    id: option.id,
    label: t('versions.number', { number: option.number }),
  }));

  const versionMeta = (version: PromptCompareVersion): string =>
    [t('versions.number', { number: version.number }), version.date, version.author]
      .filter((part) => part !== null && part !== '')
      .join(PROMPT_VERSION_META_SEPARATOR);

  const versionCard = (version: PromptCompareVersion) => (
    <Card key={version.id} as={CardElement.Div} pad={CardPad.Sm} gap={CardGap.Xs}>
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

  const diffBody = () => {
    if (failed) {
      return (
        <Callout
          tone={CalloutTone.Err}
          action={
            <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={onRetry}>
              {t('retry')}
            </Button>
          }
        >
          {t('compare.loadError')}
        </Callout>
      );
    }
    if (diff === null) {
      return <Skeleton label={t('compare.loading')} />;
    }
    return (
      <Card flush className={styles.diff}>
        <ul className={styles.rows}>
          {diff.rows.map((row, rowIndex) => (
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
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className={styles.controls}>
        <span className={styles.picker}>
          <SelectButton
            value={versionLabel(fromId)}
            menuLabel={t('compare.from')}
            aria-label={t('compare.fromValue', { number: versionLabel(fromId) })}
            options={optionItems}
            selectedId={fromId}
            onSelect={onSelectFrom}
          />
        </span>
        <span className={styles.arrow}>
          <Icon name={IconName.ChevronRight} size={PROMPT_COMPARE_ARROW_SIZE} />
        </span>
        <span className={styles.picker}>
          <SelectButton
            value={versionLabel(toId)}
            menuLabel={t('compare.to')}
            aria-label={t('compare.toValue', { number: versionLabel(toId) })}
            options={optionItems}
            selectedId={toId}
            onSelect={onSelectTo}
          />
        </span>
        {diff !== null && (
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('compare.summary', { removed: diff.removed, added: diff.added })}
          </Text>
        )}
      </div>
      {diffBody()}
      {diff !== null && from !== null && to !== null && (
        <div className={styles.meta}>
          {versionCard(from)}
          {versionCard(to)}
        </div>
      )}
    </div>
  );
}
