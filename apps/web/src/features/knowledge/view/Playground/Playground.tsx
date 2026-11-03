import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KNOWLEDGE_SEARCH_KIND_LABEL_KEY,
  KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH,
  KNOWLEDGE_SEARCH_TOP_K_OPTIONS,
} from '@/features/knowledge/constants/knowledgeSearch.constants';
import type { PlaygroundProps } from '@/features/knowledge/view/Playground/Playground.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Card, CardGap, CardPad } from '@/shared/ui/display/Card';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import { Select, SelectSize } from '@/shared/ui/inputs/Select';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/knowledge/view/Playground/Playground.module.scss';

export function Playground({
  query,
  topK,
  canSearch,
  loading,
  searched,
  results,
  errorMessage,
  onQueryChange,
  onTopKChange,
  onSearch,
  onRetry,
  onClear,
}: PlaygroundProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card
      aria-label={t('playground.title')}
      pad={CardPad.Md}
      gap={CardGap.Sm}
      className={styles.panel}
    >
      <div className={styles.header}>
        <Text kind={TextKind.BodySmall} as={TextElement.Span} className={styles.title}>
          {t('playground.title')}
        </Text>
        <div className={styles.topKControl}>
          <Select
            size={SelectSize.Sm}
            aria-label={t('playground.topKLabel')}
            value={String(topK)}
            options={KNOWLEDGE_SEARCH_TOP_K_OPTIONS.map((count) => ({
              value: String(count),
              label: t('playground.topKOption', { count }),
            }))}
            onChange={(event) => onTopKChange(Number(event.target.value))}
          />
        </div>
      </div>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <SearchInput
          value={query}
          label={t('playground.queryLabel')}
          clearLabel={t('playground.clear')}
          placeholder={t('playground.placeholder')}
          maxLength={KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH}
          loading={loading}
          onChange={(event) => onQueryChange(event.target.value)}
          onClear={onClear}
        />
        <Button type="submit" size={ButtonSize.Sm} disabled={!canSearch} loading={loading}>
          {t('playground.search')}
        </Button>
      </form>
      {errorMessage === null ? null : (
        <Callout
          tone={CalloutTone.Err}
          action={
            <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={onRetry}>
              {t('retry')}
            </Button>
          }
        >
          {errorMessage}
        </Callout>
      )}
      {errorMessage === null && searched && !loading && results.length === 0 ? (
        <div className={styles.empty}>{t('playground.empty')}</div>
      ) : null}
      {errorMessage === null && results.length > 0 ? (
        <ol className={styles.results} aria-busy={loading}>
          {results.map((result) => (
            <li key={result.key} className={styles.result}>
              <div className={styles.resultHeader}>
                <span className={styles.source}>
                  {result.sourceTitle}
                  <span className={styles.kind}>
                    {' · '}
                    {t(KNOWLEDGE_SEARCH_KIND_LABEL_KEY[result.sourceKind])}
                  </span>
                </span>
                <span className={styles.score} title={t('playground.scoreTitle')}>
                  {result.scoreLabel}
                </span>
              </div>
              <span className={styles.bar} aria-hidden="true">
                <span className={styles.barFill} style={{ width: `${result.scorePercent}%` }} />
              </span>
              <p className={clsx(styles.text, expanded !== result.key && styles.clamped)}>
                {result.text}
              </p>
              {result.isLong ? (
                <button
                  type="button"
                  className={styles.toggle}
                  onClick={() => setExpanded(expanded === result.key ? null : result.key)}
                >
                  {expanded === result.key ? t('playground.showLess') : t('playground.showMore')}
                </button>
              ) : null}
              <span className={styles.location}>{result.location}</span>
            </li>
          ))}
        </ol>
      ) : null}
      <Text kind={TextKind.Small} color={TextColor.Mute} className={styles.note}>
        {t('playground.note')}
      </Text>
    </Card>
  );
}
