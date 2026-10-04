import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Locale } from '@/shared/i18n/i18n.constants';
import { renderWithProviders } from '@/shared/testing/renderWithProviders';

import { ServerStatus } from './ServerStatus';
import type { ServerStatusProps } from './ServerStatus.typedefs';

const baseProps: ServerStatusProps = {
  version: null,
  uptimeLabel: null,
  loading: false,
  errorMessage: null,
  onRetry: vi.fn<() => void>(),
};

describe('ServerStatus', () => {
  it('shows the version and uptime when they are known', () => {
    renderWithProviders(<ServerStatus {...baseProps} version="1.4.2" uptimeLabel="3 hours" />);

    expect(screen.getByText('Backend version')).toBeInTheDocument();
    expect(screen.getByText('1.4.2')).toBeInTheDocument();
    expect(screen.getByText('3 hours')).toBeInTheDocument();
  });

  it('says it is checking while the first answer is pending', () => {
    renderWithProviders(<ServerStatus {...baseProps} loading />);

    expect(screen.getByRole('status')).toHaveTextContent('Checking the backend...');
  });

  it('offers a retry next to the error message', async () => {
    const onRetry = vi.fn<() => void>();
    renderWithProviders(
      <ServerStatus
        {...baseProps}
        errorMessage="The server cannot be reached."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('The server cannot be reached.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('labels the rows in Ukrainian', () => {
    renderWithProviders(<ServerStatus {...baseProps} version="1.4.2" uptimeLabel="3 години" />, {
      locale: Locale.Uk,
    });

    expect(screen.getByText('Версія бекенду')).toBeInTheDocument();
    expect(screen.getByText('Час роботи')).toBeInTheDocument();
  });
});
