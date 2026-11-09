import { useId } from 'react';
import {
  CHECKLIST_ICON_SIZE,
  CHECKLIST_STATUS_ICONS,
  CHECKLIST_STATUS_TONES,
} from '@/features/onboarding/view/TourChecklist/TourChecklist.constants';
import type {
  TourChecklistGroupProps,
  TourChecklistProps,
} from '@/features/onboarding/view/TourChecklist/TourChecklist.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge } from '@/shared/ui/display/Badge';
import { RowList } from '@/shared/ui/display/RowList';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { NavSectionLabel } from '@/shared/ui/navigation/NavSectionLabel';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

function ChecklistGroup({ group, onSelectStep }: TourChecklistGroupProps) {
  const labelId = useId();

  return (
    <section aria-labelledby={labelId} className="flex flex-col gap-1">
      <NavSectionLabel id={labelId} label={group.label} />
      <RowList
        mono={false}
        rows={group.steps.map((step) => ({
          id: step.id,
          name: step.title,
          leading: <Icon name={CHECKLIST_STATUS_ICONS[step.status]} size={CHECKLIST_ICON_SIZE} />,
          meta: <Badge tone={CHECKLIST_STATUS_TONES[step.status]}>{step.statusLabel}</Badge>,
        }))}
        onRowSelect={(id) => {
          const step = group.steps.find((candidate) => candidate.id === id);
          if (step !== undefined) {
            onSelectStep(step.id);
          }
        }}
      />
    </section>
  );
}

export function TourChecklist({
  open,
  onOpenChange,
  labels,
  groups,
  onSelectStep,
  onRestart,
}: TourChecklistProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={labels.title}
      description={labels.description}
      closeLabel={labels.close}
      size={DialogSize.Md}
      footerLeft={
        <Button
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          icon={IconName.Refresh}
          onClick={onRestart}
        >
          {labels.restart}
        </Button>
      }
      footerRight={
        <Button variant={ButtonVariant.Secondary} onClick={() => onOpenChange(false)}>
          {labels.close}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <ChecklistGroup key={group.id} group={group} onSelectStep={onSelectStep} />
        ))}
      </div>
    </Dialog>
  );
}
