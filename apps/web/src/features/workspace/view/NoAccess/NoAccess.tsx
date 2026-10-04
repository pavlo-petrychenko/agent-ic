import type { NoAccessProps } from '@/features/workspace/view/NoAccess/NoAccess.typedefs';
import { Button } from '@/shared/ui/Button';
import { EmptyState, EmptyStateTone } from '@/shared/ui/EmptyState';
import { IconName } from '@/shared/ui/Icon';

export function NoAccess({ title, description, actionLabel, onAction }: NoAccessProps) {
  return (
    <div className="flex min-h-full items-center justify-center">
      <EmptyState
        icon={IconName.Lock}
        tone={EmptyStateTone.Warn}
        title={title}
        description={description}
        actions={<Button onClick={onAction}>{actionLabel}</Button>}
      />
    </div>
  );
}
