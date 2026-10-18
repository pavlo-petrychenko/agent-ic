import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptPageHeaderProps } from '@/features/prompts/containers/PromptPage/PromptPageHeader/PromptPageHeader.typedefs';
import { PromptOptionsMenu } from '@/features/prompts/view/PromptOptionsMenu';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function PromptPageHeader({
  name,
  subtitle,
  editing,
  draftNumber,
  canEdit,
  menuActions,
  currentFolderName,
  onSelect,
  onEdit,
  onDiscard,
  onSave,
}: PromptPageHeaderProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  const actions = editing ? (
    <>
      <Button variant={ButtonVariant.Secondary} onClick={onDiscard}>
        {t('draft.discard')}
      </Button>
      <Button onClick={onSave}>{t('draft.saveAs', { number: draftNumber })}</Button>
    </>
  ) : menuActions.length > 0 ? (
    <>
      <PromptOptionsMenu
        actions={menuActions}
        currentFolderName={currentFolderName}
        onSelect={onSelect}
      />
      {canEdit && <Button onClick={onEdit}>{t('view.edit')}</Button>}
    </>
  ) : null;

  return <PageHeader title={name} subtitle={subtitle} actions={actions} />;
}
