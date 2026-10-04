import { Locale, ErrorCode } from '@agent-ic/contracts';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@/app/ErrorBoundary/ErrorBoundary';
import { AppError } from '@/shared/api/AppError';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const TRACE_ID = 'trace-123';

function Broken() {
  const [fixed, setFixed] = useState(false);
  if (!fixed) {
    throw new AppError('boom', { code: ErrorCode.Internal, traceId: TRACE_ID });
  }
  return (
    <button type="button" onClick={() => setFixed(true)}>
      Recovered
    </button>
  );
}

describe('ErrorBoundary', () => {
  it('replaces a crashed screen with a message that carries the trace id', () => {
    vi.spyOn(globalThis.console, 'error').mockImplementation(() => undefined);
    renderWithProviders(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(`Reference: ${TRACE_ID}`);
  });

  it('writes the message in the active language', () => {
    vi.spyOn(globalThis.console, 'error').mockImplementation(() => undefined);
    renderWithProviders(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
      { locale: Locale.Uk },
    );

    expect(screen.getByRole('heading', { name: 'Щось пішло не так' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(`Довідковий код: ${TRACE_ID}`);
  });

  it('offers a way to try again', async () => {
    vi.spyOn(globalThis.console, 'error').mockImplementation(() => undefined);
    renderWithProviders(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
  });
});
