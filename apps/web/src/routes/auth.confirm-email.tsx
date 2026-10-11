import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { ConfirmEmailPage, TOKEN_SEARCH_DEFAULTS, tokenSearchSchema } from '@/features/auth';

export const Route = createFileRoute('/auth/confirm-email')({
  validateSearch: tokenSearchSchema,
  search: { middlewares: [stripSearchParams(TOKEN_SEARCH_DEFAULTS)] },
  component: ConfirmEmailRoute,
});

function ConfirmEmailRoute() {
  const { token } = Route.useSearch();
  return <ConfirmEmailPage token={token} />;
}
