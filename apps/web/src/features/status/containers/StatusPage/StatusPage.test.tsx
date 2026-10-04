import { Locale } from '@agent-ic/contracts';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildServerStatusFailureMock,
  buildServerStatusMock,
} from '@/features/status/communication/serverStatus.mocks';
import { StatusPage } from '@/features/status/containers/StatusPage/StatusPage';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('StatusPage', () => {
  it('shows the backend version and uptime in English', async () => {
    renderWithProviders(<StatusPage />, {
      mocks: [buildServerStatusMock('0.0.0-dev', 93_784)],
    });

    expect(await screen.findByText('0.0.0-dev')).toBeInTheDocument();
    expect(screen.getByText('Backend version')).toBeInTheDocument();
    expect(screen.getByText('1 day 2 hours')).toBeInTheDocument();
  });

  it('shows the backend version and uptime in Ukrainian', async () => {
    renderWithProviders(<StatusPage />, {
      locale: Locale.Uk,
      mocks: [buildServerStatusMock('0.0.0-dev', 2 * 86_400 + 5 * 3_600)],
    });

    expect(await screen.findByText('0.0.0-dev')).toBeInTheDocument();
    expect(screen.getByText('Версія бекенду')).toBeInTheDocument();
    expect(screen.getByText('2 дні 5 годин')).toBeInTheDocument();
  });

  it('explains an unreachable backend and offers a retry', async () => {
    renderWithProviders(<StatusPage />, {
      mocks: [buildServerStatusFailureMock(new Error('offline'))],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The server cannot be reached. Check your connection.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
