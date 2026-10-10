import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import {
  CHECK_EMAIL_SEARCH_DEFAULTS,
  CheckEmailPage,
  checkEmailSearchSchema,
} from '@/features/auth';

export const Route = createFileRoute('/auth/check-email')({
  validateSearch: checkEmailSearchSchema,
  search: { middlewares: [stripSearchParams(CHECK_EMAIL_SEARCH_DEFAULTS)] },
  component: CheckEmailRoute,
});

function CheckEmailRoute() {
  const { email } = Route.useSearch();
  return <CheckEmailPage email={email} />;
}
