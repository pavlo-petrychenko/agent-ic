import type { AgentRow } from '@/features/agents/typedefs/agent.typedefs';
import type { TableStatus } from '@/shared/ui/data/Table';

export interface AgentsTableProps {
  rows: readonly AgentRow[];
  status: TableStatus;
  hasNextPage: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onOpen: (row: AgentRow) => void;
}
