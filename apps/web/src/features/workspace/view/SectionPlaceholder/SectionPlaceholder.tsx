import type { SectionPlaceholderProps } from '@/features/workspace/view/SectionPlaceholder/SectionPlaceholder.typedefs';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';

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
