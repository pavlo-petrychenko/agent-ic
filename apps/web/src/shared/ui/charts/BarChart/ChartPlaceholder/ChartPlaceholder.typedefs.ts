import type { ChartPlaceholderKind } from '@/shared/ui/charts/BarChart/ChartPlaceholder/ChartPlaceholder.constants';

export interface ChartEmptyText {
  title: string;
  hint: string | null;
}

interface ChartPlaceholderBaseProps {
  height: number;
  className?: string;
}

export interface ChartLoadingPlaceholderProps extends ChartPlaceholderBaseProps {
  kind: ChartPlaceholderKind.Loading;
  label: string | null;
}

export interface ChartEmptyPlaceholderProps extends ChartPlaceholderBaseProps {
  kind: ChartPlaceholderKind.Empty;
  text: ChartEmptyText | null;
}

export type ChartPlaceholderProps = ChartLoadingPlaceholderProps | ChartEmptyPlaceholderProps;
