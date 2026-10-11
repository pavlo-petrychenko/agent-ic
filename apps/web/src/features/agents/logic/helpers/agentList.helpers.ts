import { TableStatus } from '@/shared/ui/data/Table';

export const toTableStatus = (loading: boolean, failed: boolean): TableStatus => {
  if (loading) {
    return TableStatus.Loading;
  }
  return failed ? TableStatus.Error : TableStatus.Ready;
};
