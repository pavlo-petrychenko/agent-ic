import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PublishButton } from '@/features/flow-builder/view/PublishButton/PublishButton';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('PublishButton', () => {
  it('publishes when nothing blocks it', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    renderWithProviders(
      <PublishButton label="Publish v4" blockedReason={null} onClick={onClick} />,
    );

    await user.click(screen.getByRole('button', { name: 'Publish v4' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and explains why when there is a blocking reason', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    renderWithProviders(
      <PublishButton label="Publish v4" blockedReason="No changes to publish" onClick={onClick} />,
    );

    expect(screen.getByRole('button', { name: 'Publish v4' })).toBeDisabled();
    await user.tab();

    expect(await screen.findByRole('tooltip')).toHaveTextContent('No changes to publish');
    expect(onClick).not.toHaveBeenCalled();
  });
});
