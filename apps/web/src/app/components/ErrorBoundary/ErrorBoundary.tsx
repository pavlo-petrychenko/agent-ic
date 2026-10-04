import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import type { ErrorBoundaryProps } from '@/app/components/ErrorBoundary/ErrorBoundary.typedefs';
import { ErrorFallbackView } from '@/app/components/ErrorFallbackView';

function BoundaryFallback({ error, resetErrorBoundary }: FallbackProps) {
  return <ErrorFallbackView error={error} onReset={resetErrorBoundary} />;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return <ReactErrorBoundary FallbackComponent={BoundaryFallback}>{children}</ReactErrorBoundary>;
}
