import type { SectionPlaceholderProps } from '@/features/workspace/view/SectionPlaceholder/SectionPlaceholder.typedefs';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function SectionPlaceholder({
  title,
  subtitle,
  icon,
  emptyTitle,
  emptyDescription,
}: SectionPlaceholderProps) {
  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="px-7">
        <Card>
          <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
        </Card>
      </div>
    </div>
  );
}
