import type { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { ErrorFallbackView } from './ErrorFallbackView';

interface ErrorBoundaryProps {
  children: ReactNode;
}

function BoundaryFallback({ error, resetErrorBoundary }: FallbackProps) {
  return <ErrorFallbackView error={error} onReset={resetErrorBoundary} />;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return <ReactErrorBoundary FallbackComponent={BoundaryFallback}>{children}</ReactErrorBoundary>;
}
