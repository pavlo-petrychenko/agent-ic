import { TOUR_LINK_ICONS } from '@/features/onboarding/view/TourDoneLinks/TourDoneLinks.constants';
import type { TourDoneLinksProps } from '@/features/onboarding/view/TourDoneLinks/TourDoneLinks.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';

export function TourDoneLinks({ body, links, onSelect }: TourDoneLinksProps) {
  return (
    <div className="flex flex-col gap-3">
      <span>{body}</span>
      <ul className="m-0 flex list-none flex-col items-start gap-1 p-0">
        {links.map((link) => (
          <li key={link.id}>
            <Button
              variant={ButtonVariant.Ghost}
              size={ButtonSize.Sm}
              icon={TOUR_LINK_ICONS[link.id]}
              onClick={() => onSelect(link.id)}
            >
              {link.label}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
