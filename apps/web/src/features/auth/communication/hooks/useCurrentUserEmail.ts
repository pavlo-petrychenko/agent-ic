import { useQuery } from '@apollo/client/react';
import { CurrentUserEmailDocument } from '@/features/auth/communication/gql/query/currentUserEmail.generated';

export function useCurrentUserEmail(): string | null {
  const { data } = useQuery(CurrentUserEmailDocument);
  return data?.me.email ?? null;
}
