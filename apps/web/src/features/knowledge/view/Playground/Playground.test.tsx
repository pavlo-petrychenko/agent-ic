import { Locale } from '@agent-ic/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import type { PlaygroundResultView } from '@/features/knowledge/typedefs/knowledgeSearch.typedefs';
import { Playground } from '@/features/knowledge/view/Playground/Playground';
import type { PlaygroundProps } from '@/features/knowledge/view/Playground/Playground.typedefs';
import { createI18n } from '@/shared/i18n/clients/i18n.client';

const RESULT: PlaygroundResultView = {
  key: 'kdc_document-Refunds-0',
  sourceTitle: 'Policies',
  scoreLabel: '1.00',
  scorePercent: 100,
  text: 'Refunds are processed within five days.',
  isLong: false,
};

const props = (overrides: Partial<PlaygroundProps> = {}): PlaygroundProps => ({
  query: 'refund',
  canSearch: true,
  loading: false,
  searched: false,
  results: [],
  errorMessage: null,
  onQueryChange: vi.fn<(query: string) => void>(),
  onSearch: vi.fn<() => void>(),
  onRetry: vi.fn<() => void>(),
  onClear: vi.fn<() => void>(),
  ...overrides,
});

const renderPlayground = (overrides: Partial<PlaygroundProps> = {}) =>
  render(
    <I18nextProvider i18n={createI18n(Locale.En)}>
      <Playground {...props(overrides)} />
    </I18nextProvider>,
  );

describe('Playground', () => {
  it('renders a ranked result with its source, path and score', () => {
    renderPlayground({ searched: true, results: [RESULT] });

    expect(screen.getByText('Retrieval playground')).toBeInTheDocument();
    expect(screen.getByText('Top 3 results')).toBeInTheDocument();
    expect(screen.getByText('Policies')).toBeInTheDocument();
    expect(screen.getByText('1.00')).toBeInTheDocument();
    expect(screen.getByText(RESULT.text)).toBeInTheDocument();
  });

  it('expands a long section on request', async () => {
    const text = 'Long refund rules. '.repeat(30);
    renderPlayground({ searched: true, results: [{ ...RESULT, text, isLong: true }] });

    await userEvent.click(screen.getByRole('button', { name: 'Show full section' }));

    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('shows the empty state after a search without matches', () => {
    renderPlayground({ searched: true, results: [] });

    expect(
      screen.getByText('No matching sections. Try different wording or add a source.'),
    ).toBeInTheDocument();
  });

  it('hands the query to the caller', async () => {
    const onSearch = vi.fn<() => void>();
    renderPlayground({ onSearch });

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('shows a failed search with a retry action', async () => {
    const onRetry = vi.fn<() => void>();
    renderPlayground({ errorMessage: 'Search failed.', onRetry });

    expect(screen.getByText('Search failed.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
