import type { ChannelOptionsProps } from '@/features/channels/view/ChannelOptions/ChannelOptions.typedefs';
import { Button } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';

export function ChannelOptions({ options }: ChannelOptionsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 compact:grid-cols-2">
      {options.map((option) => (
        <Card key={option.id} className="h-full">
          <EmptyState
            icon={option.icon}
            tone={option.tone}
            title={option.title}
            description={option.description}
            actions={
              <Button variant={option.actionVariant} onClick={option.onAction}>
                {option.actionLabel}
              </Button>
            }
          />
        </Card>
      ))}
    </div>
  );
}
