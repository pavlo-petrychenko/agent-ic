import type { ErrorComponentProps } from '@tanstack/react-router';
import { ErrorFallbackView } from '@/app/components/ErrorFallbackView';

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  return <ErrorFallbackView error={error} onReset={reset} />;
}
