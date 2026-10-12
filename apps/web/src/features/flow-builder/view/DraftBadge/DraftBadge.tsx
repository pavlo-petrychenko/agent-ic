import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import type { DraftBadgeProps } from '@/features/flow-builder/view/DraftBadge/DraftBadge.typedefs';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';

export function DraftBadge({ baseVersion, liveVersion, unchanged }: DraftBadgeProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

  if (unchanged && liveVersion !== null) {
    return (
      <Badge tone={BadgeTone.Neutral} dot>
        {t('header.unchanged', { version: liveVersion })}
      </Badge>
    );
  }
  return (
    <Badge tone={baseVersion === null ? BadgeTone.Neutral : BadgeTone.Warn} dot>
      {baseVersion === null
        ? t('header.neverPublished')
        : t('header.editedFrom', { version: baseVersion })}
    </Badge>
  );
}
