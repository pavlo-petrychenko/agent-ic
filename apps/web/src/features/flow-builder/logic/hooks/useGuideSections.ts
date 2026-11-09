import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  filterGuideItems,
  guideSections,
  guideTitleKey,
} from '@/features/flow-builder/logic/helpers/guide.helpers';
import type { GuideListSection } from '@/features/flow-builder/typedefs/guide.typedefs';

export function useGuideSections(query: string): GuideListSection[] {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

  return useMemo(
    () =>
      filterGuideItems(
        guideSections().map((section) => ({
          group: section.group,
          items: section.guides.map((guide) => ({
            id: guide.id,
            title: t(guideTitleKey(guide)),
            summary: t(`guide.items.${guide.id}.summary`),
            kind: guide.kind,
            icon: guide.icon,
          })),
        })),
        query,
      ),
    [t, query],
  );
}
