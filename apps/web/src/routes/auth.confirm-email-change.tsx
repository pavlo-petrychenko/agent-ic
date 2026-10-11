import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { ConfirmEmailChangePage, TOKEN_SEARCH_DEFAULTS, tokenSearchSchema } from '@/features/auth';

export const Route = createFileRoute('/auth/confirm-email-change')({
  validateSearch: tokenSearchSchema,
  search: { middlewares: [stripSearchParams(TOKEN_SEARCH_DEFAULTS)] },
  component: ConfirmEmailChangeRoute,
});

function ConfirmEmailChangeRoute() {
  const { token } = Route.useSearch();
  return <ConfirmEmailChangePage token={token} />;
}
