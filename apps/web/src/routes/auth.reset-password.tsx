import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { ResetPasswordPage, TOKEN_SEARCH_DEFAULTS, tokenSearchSchema } from '@/features/auth';

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: tokenSearchSchema,
  search: { middlewares: [stripSearchParams(TOKEN_SEARCH_DEFAULTS)] },
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { token } = Route.useSearch();
  return <ResetPasswordPage token={token} />;
}
