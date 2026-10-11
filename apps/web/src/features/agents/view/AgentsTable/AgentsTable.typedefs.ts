import type { AgentRow } from '@/features/agents/typedefs/agent.typedefs';
import type { TableStatus } from '@/shared/ui/data/Table';

export interface AgentsTableProps {
  rows: readonly AgentRow[];
  status: TableStatus;
  statusIds: readonly string[];
  hasNextPage: boolean;
  loadingMore: boolean;
  onStatusIdsChange: (ids: string[]) => void;
  onClearFilters: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onOpen: (row: AgentRow) => void;
}
