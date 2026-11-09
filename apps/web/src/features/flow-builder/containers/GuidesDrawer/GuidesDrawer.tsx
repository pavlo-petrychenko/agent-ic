import type { AgentTemplateKey } from '@agent-ic/flow';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  AGENTS_PATH,
  GUIDES_DRAWER_WIDTH,
  GuideType,
} from '@/features/flow-builder/constants/guide.constants';
import type { GuideId } from '@/features/flow-builder/constants/guide.constants';
import type { GuidesDrawerProps } from '@/features/flow-builder/containers/GuidesDrawer/GuidesDrawer.typedefs';
import { findGuide, guideTitleKey } from '@/features/flow-builder/logic/helpers/guide.helpers';
import { buildGuideExample } from '@/features/flow-builder/logic/helpers/guideExample.helpers';
import { useGuideSections } from '@/features/flow-builder/logic/hooks/useGuideSections';
import { useGuideStore } from '@/features/flow-builder/storage/hooks/useGuideStore';
import { GuideDetail } from '@/features/flow-builder/view/GuideDetail';
import { GuideList } from '@/features/flow-builder/view/GuideList';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Drawer } from '@/shared/ui/overlays/Drawer';

export function GuidesDrawer({ workspaceId, agentId }: GuidesDrawerProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { locale } = useLocale();
  const navigate = useNavigate();
  const open = useGuideStore((state) => state.open);
  const guideId = useGuideStore((state) => state.guideId);
  const openGuide = useGuideStore((state) => state.openGuide);
  const showList = useGuideStore((state) => state.showList);
  const close = useGuideStore((state) => state.close);
  const [query, setQuery] = useState('');
  const [moved, setMoved] = useState(false);
  const [returnTo, setReturnTo] = useState<GuideId | null>(null);
  const sections = useGuideSections(query);
  const guide = findGuide(guideId);
  const example = useMemo(
    () => (guide?.type === GuideType.Component ? buildGuideExample(guide.nodeType, locale) : null),
    [guide, locale],
  );

  useEffect(() => close, [close]);

  const closeDrawer = () => {
    close();
    setQuery('');
    setMoved(false);
    setReturnTo(null);
  };

  const openTemplate = (key: AgentTemplateKey) => {
    void navigate({
      to: AGENTS_PATH,
      params: { workspaceId },
      search: { templates: 'open', template: key },
    });
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => !next && closeDrawer()}
      ariaLabel={guide === null ? t('guide.title') : t(guideTitleKey(guide))}
      width={GUIDES_DRAWER_WIDTH}
    >
      {guide === null ? (
        <GuideList
          sections={sections}
          query={query}
          focusId={moved ? returnTo : null}
          onQueryChange={setQuery}
          onSelect={(id) => {
            setMoved(true);
            setReturnTo(id);
            openGuide(id);
          }}
          onClose={closeDrawer}
        />
      ) : (
        <GuideDetail
          guide={guide}
          title={t(guideTitleKey(guide))}
          example={example}
          workspaceId={workspaceId}
          agentId={agentId}
          focusTitle={moved}
          onBack={() => {
            setMoved(true);
            showList();
          }}
          onClose={closeDrawer}
          onUseTemplate={openTemplate}
        />
      )}
    </Drawer>
  );
}
