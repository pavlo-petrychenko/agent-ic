import { useTranslation } from 'react-i18next';
import { useWorkspaceShell } from '@/features/workspace/communication/hooks/useWorkspaceShell';
import { SECTION_ICONS } from '@/features/workspace/constants/navigation.constants';
import { WORKSPACE_NAMESPACE } from '@/features/workspace/constants/workspaceI18n.constants';
import type { SectionPlaceholderPageProps } from '@/features/workspace/containers/SectionPlaceholderPage/SectionPlaceholderPage.typedefs';
import { SectionPlaceholder } from '@/features/workspace/view/SectionPlaceholder';

export function SectionPlaceholderPage({ workspaceId, section }: SectionPlaceholderPageProps) {
  const { t } = useTranslation(WORKSPACE_NAMESPACE);
  const workspace = useWorkspaceShell(workspaceId).data?.active?.name ?? '';

  return (
    <SectionPlaceholder
      title={t(`nav.sections.${section}`)}
      subtitle={t(`placeholders.${section}.subtitle`, { workspace })}
      icon={SECTION_ICONS[section]}
      emptyTitle={t(`placeholders.${section}.title`)}
      emptyDescription={t(`placeholders.${section}.description`)}
    />
  );
}
