import { createFileRoute } from '@tanstack/react-router';
import { ConfirmEmailPage, tokenSearchSchema } from '@/features/auth';

export const Route = createFileRoute('/auth/confirm-email')({
  validateSearch: tokenSearchSchema,
  component: ConfirmEmailRoute,
});

function ConfirmEmailRoute() {
  const { token } = Route.useSearch();
  return <ConfirmEmailPage token={token} />;
}
