import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ToolCallList } from '@/features/testing/view/ToolCallList/ToolCallList';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const SEARCH = {
  id: '0',
  name: 'search_menu',
  failed: false,
  duration: '120',
  input: '{\n  "query": "vegan"\n}',
  inputTruncated: false,
  output: '{\n  "found": true\n}',
  outputTruncated: true,
  error: null,
};

const BROKEN = {
  ...SEARCH,
  id: '1',
  name: 'search_faq',
  failed: true,
  duration: null,
  output: null,
  outputTruncated: false,
  error: 'The search is not available',
};

describe('ToolCallList', () => {
  it('lists each call with its status and duration, collapsed', () => {
    renderWithProviders(<ToolCallList calls={[SEARCH, BROKEN]} />);

    expect(screen.getByText('search_menu')).toBeVisible();
    expect(screen.getByText('120 ms')).toBeVisible();
    expect(screen.getByText('OK')).toBeVisible();
    expect(screen.getByText('Error')).toBeVisible();
    for (const label of screen.getAllByText('Arguments')) {
      expect(label).not.toBeVisible();
    }
  });

  it('opens a call to show its arguments, result and a shortened note', async () => {
    renderWithProviders(<ToolCallList calls={[SEARCH]} />);

    await userEvent.click(screen.getByText('search_menu'));

    expect(screen.getByText('Arguments')).toBeVisible();
    expect(screen.getByText(/"query": "vegan"/)).toBeVisible();
    expect(screen.getByText(/"found": true/)).toBeVisible();
    expect(screen.getByText('Shortened: only the start is stored.')).toBeVisible();
  });

  it('shows the error of a failed call instead of a result', async () => {
    renderWithProviders(<ToolCallList calls={[BROKEN]} />);

    await userEvent.click(screen.getByText('search_faq'));

    expect(screen.getByText('The search is not available')).toBeVisible();
    expect(screen.queryByText('Result')).not.toBeInTheDocument();
  });
});
