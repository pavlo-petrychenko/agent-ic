import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PromptVariables } from '@/features/prompts/view/PromptVariables';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('PromptVariables', () => {
  it('shows every path as a chip', () => {
    renderWithProviders(<PromptVariables paths={['user.name', 'channel', 'today']} />);

    expect(screen.getByRole('list', { name: 'Variables in this prompt' })).toBeInTheDocument();
    expect(screen.getByText('{{user.name}}')).toBeInTheDocument();
    expect(screen.getByText('{{channel}}')).toBeInTheDocument();
    expect(screen.getByText('{{today}}')).toBeInTheDocument();
  });

  it('says when there are no variables', () => {
    renderWithProviders(<PromptVariables paths={[]} />);

    expect(screen.getByText('No variables in this prompt yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Variables in this prompt' })).toBeNull();
  });
});
