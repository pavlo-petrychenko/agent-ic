import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  API_ENDPOINT_MOCK,
  API_SECRET_KEY_MOCK,
} from '@/features/channels/constants/apiChannel.constants';
import { ApiChannelCreateDialogs } from '@/features/channels/containers/ApiChannelCreateDialogs';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('ApiChannelCreateDialogs', () => {
  it('creates an API channel and then shows the secret key', async () => {
    const onClose = vi.fn<() => void>();
    renderWithProviders(<ApiChannelCreateDialogs onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'New API channel' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('In the response')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Create channel' }));

    expect(screen.getByRole('dialog', { name: 'Your secret key' })).toBeInTheDocument();
    expect(screen.getByText(API_SECRET_KEY_MOCK)).toBeInTheDocument();
    expect(screen.getByText(API_ENDPOINT_MOCK)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'I’ve copied it' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancels the new API channel dialog', async () => {
    const onClose = vi.fn<() => void>();
    renderWithProviders(<ApiChannelCreateDialogs onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
