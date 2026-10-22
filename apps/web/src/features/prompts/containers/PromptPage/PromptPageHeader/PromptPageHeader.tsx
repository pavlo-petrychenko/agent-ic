import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptPageHeaderProps } from '@/features/prompts/containers/PromptPage/PromptPageHeader/PromptPageHeader.typedefs';
import { PromptOptionsMenu } from '@/features/prompts/view/PromptOptionsMenu';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconName } from '@/shared/ui/foundations/Icon';
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
  compare,
  older,
  onTest,
}: PromptPageHeaderProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  const testAction =
    onTest === null ? null : (
      <Button variant={ButtonVariant.Secondary} icon={IconName.Play} onClick={onTest}>
        {t('test.open')}
      </Button>
    );

  const actions =
    compare !== null ? (
      <>
        {canEdit && compare.restoreLabel !== null && compare.onRestoreFrom !== null && (
          <Button variant={ButtonVariant.Secondary} onClick={compare.onRestoreFrom}>
            {compare.restoreLabel}
          </Button>
        )}
        <Button onClick={compare.onClose}>{t('compare.close')}</Button>
      </>
    ) : editing ? (
      <>
        <Button variant={ButtonVariant.Secondary} onClick={onDiscard}>
          {t('draft.discard')}
        </Button>
        {testAction}
        <Button onClick={onSave}>{t('draft.saveAs', { number: draftNumber })}</Button>
      </>
    ) : older !== null ? (
      <>
        <Button variant={ButtonVariant.Secondary} onClick={older.onCompare}>
          {older.compareLabel}
        </Button>
        {testAction}
        {canEdit && <Button onClick={older.onRestore}>{t('view.restoreAsDraft')}</Button>}
      </>
    ) : menuActions.length > 0 ? (
      <>
        <PromptOptionsMenu
          actions={menuActions}
          currentFolderName={currentFolderName}
          onSelect={onSelect}
        />
        {testAction}
        {canEdit && <Button onClick={onEdit}>{t('view.edit')}</Button>}
      </>
    ) : null;

  return <PageHeader title={name} subtitle={subtitle} actions={actions} />;
}
