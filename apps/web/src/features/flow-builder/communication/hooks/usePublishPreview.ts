import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo, useRef } from 'react';
import { PublishPreviewDocument } from '@/features/flow-builder/communication/gql/query/publishPreview.generated';
import { toPublishPreview } from '@/features/flow-builder/communication/helpers/publish.helpers';
import type { UsePublishPreviewResult } from '@/features/flow-builder/typedefs/publish.typedefs';

export function usePublishPreview(agentId: string, revision: number): UsePublishPreviewResult {
  const { data, loading, refetch } = useQuery(PublishPreviewDocument, {
    variables: { agentId },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });
  const fetchedFor = useRef(revision);

  useEffect(() => {
    if (fetchedFor.current !== revision) {
      fetchedFor.current = revision;
      void refetch().catch(() => undefined);
    }
  }, [refetch, revision]);

  const preview = useMemo(() => (data === undefined ? null : toPublishPreview(data)), [data]);
  return {
    preview,
    loading,
    failed: !loading && preview === null,
    retry: () => void refetch().catch(() => undefined),
  };
}
