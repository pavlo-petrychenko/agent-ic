import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DraftBadge } from '@/features/flow-builder/view/DraftBadge/DraftBadge';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('DraftBadge', () => {
  it('says the draft has no changes since the live version', () => {
    renderWithProviders(<DraftBadge baseVersion={1} liveVersion={1} unchanged />);

    expect(screen.getByText('Draft · no changes since v1')).toBeInTheDocument();
  });

  it('says the draft was edited from its base version', () => {
    renderWithProviders(<DraftBadge baseVersion={1} liveVersion={1} unchanged={false} />);

    expect(screen.getByText('Draft · edited from v1')).toBeInTheDocument();
  });

  it('says the draft was never published', () => {
    renderWithProviders(<DraftBadge baseVersion={null} liveVersion={null} unchanged={false} />);

    expect(screen.getByText('Draft · never published')).toBeInTheDocument();
  });
});
