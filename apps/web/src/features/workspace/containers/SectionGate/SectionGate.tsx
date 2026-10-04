import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useWorkspaceShell } from '@/features/workspace/communication/hooks/useWorkspaceShell';
import { WORKSPACE_SECTION_PATHS } from '@/features/workspace/constants/navigation.constants';
import { WORKSPACE_NAMESPACE } from '@/features/workspace/constants/workspaceI18n.constants';
import type { SectionGateProps } from '@/features/workspace/containers/SectionGate/SectionGate.typedefs';
import { canOpenSection, homeSection } from '@/features/workspace/logic/helpers/navigation.helpers';
import { NoAccess } from '@/features/workspace/view/NoAccess';

export function SectionGate({ workspaceId, section, children }: SectionGateProps) {
  const { t } = useTranslation(WORKSPACE_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const active = useWorkspaceShell(workspaceId).data?.active ?? null;

  if (active === null) {
    return null;
  }
  if (canOpenSection(active.role, section)) {
    return children;
  }
  const home = homeSection(active.role);

  return (
    <NoAccess
      title={t('noAccess.title', { section: t(`nav.sections.${section}`) })}
      description={t('noAccess.description', {
        workspace: active.name,
        role: tCommon(`roles.name.${active.role}`),
        summary: tCommon(`roles.summary.${active.role}`),
      })}
      actionLabel={t('noAccess.action', { section: t(`nav.sections.${home}`) })}
      onAction={() => void navigate({ to: WORKSPACE_SECTION_PATHS[home], params: { workspaceId } })}
    />
  );
}
