import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HELP_ACTION_ICONS,
  HELP_MENU_ICON_SIZE,
  HELP_MENU_WIDTH,
  HelpAction,
} from '@/features/onboarding/constants/helpMenu.constants';
import { ONBOARDING_NAMESPACE } from '@/features/onboarding/constants/onboardingI18n.constants';
import { TourStatus } from '@/features/onboarding/constants/tour.constants';
import type { HelpMenuProps } from '@/features/onboarding/containers/HelpMenu/HelpMenu.typedefs';
import { stepProgress } from '@/features/onboarding/logic/helpers/tour.helpers';
import { useTourActions } from '@/features/onboarding/logic/hooks/useTourActions';
import { useTourNavigation } from '@/features/onboarding/logic/hooks/useTourNavigation';
import { useTourStore } from '@/features/onboarding/storage/hooks/useTourStore';
import { HelpTrigger } from '@/features/onboarding/view/HelpTrigger';
import { Icon } from '@/shared/ui/foundations/Icon';
import { Menu, MenuRole, MenuVariant } from '@/shared/ui/overlays/Menu';
import { Popover } from '@/shared/ui/overlays/Popover';

export function HelpMenu({ workspaceId, compact = false }: HelpMenuProps) {
  const { t } = useTranslation(ONBOARDING_NAMESPACE);
  const [open, setOpen] = useState(false);
  const eligible = useTourStore((state) => state.eligible);
  const tour = useTourStore((state) => state.tour);
  const setChecklistOpen = useTourStore((state) => state.setChecklistOpen);
  const actions = useTourActions();
  const go = useTourNavigation(workspaceId);

  if (!eligible) {
    return null;
  }

  const progress =
    tour.status === TourStatus.Active && tour.stepId !== null ? stepProgress(tour.stepId) : null;

  const onSelect = (id: string) => {
    setOpen(false);
    if (id === HelpAction.ProductTour) {
      actions.open();
    } else if (id === HelpAction.GettingStarted) {
      setChecklistOpen(true);
    } else if (id === HelpAction.Templates) {
      go.templates();
    } else if (id === HelpAction.Guides) {
      go.guides(null);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      bare
      ariaLabel={t('help.menu')}
      trigger={<HelpTrigger label={t('help.label')} compact={compact} />}
    >
      <Menu
        ariaLabel={t('help.menu')}
        variant={MenuVariant.Action}
        role={MenuRole.Menu}
        width={HELP_MENU_WIDTH}
        onSelect={onSelect}
        items={Object.values(HelpAction).map((action) => ({
          id: action,
          label: t(`help.${action}`),
          hint:
            action === HelpAction.ProductTour && progress !== null
              ? t('help.resume', { current: progress.current, total: progress.total })
              : null,
          leading: <Icon name={HELP_ACTION_ICONS[action]} size={HELP_MENU_ICON_SIZE} />,
        }))}
      />
    </Popover>
  );
}
