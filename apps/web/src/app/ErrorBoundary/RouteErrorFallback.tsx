import type { ErrorComponentProps } from '@tanstack/react-router';
import { ErrorFallbackView } from '@/app/ErrorBoundary/ErrorFallbackView';

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  return <ErrorFallbackView error={error} onReset={reset} />;
}
