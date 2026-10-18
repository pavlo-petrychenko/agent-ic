import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptPickerDialogProps } from '@/features/prompts/containers/PromptPickerDialog/PromptPickerDialog.typedefs';
import { toPromptGroups } from '@/features/prompts/logic/helpers/promptTree.helpers';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { RowList } from '@/shared/ui/display/RowList';
import { IconName } from '@/shared/ui/foundations/Icon';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function PromptPickerDialog({ onPick, onClose }: PromptPickerDialogProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { folders, prompts, loading, failed, retry } = usePromptLibrary();
  const [query, setQuery] = useState('');
  const groups = toPromptGroups(folders, prompts, query);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('picker.title')}
      description={t('picker.description')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Md}
      footerRight={
        <Button variant={ButtonVariant.Secondary} onClick={onClose}>
          {t('dialog.close')}
        </Button>
      }
    >
      <div className="flex min-h-0 flex-col gap-3">
        <SearchInput
          value={query}
          label={t('picker.search')}
          clearLabel={t('picker.clear')}
          loading={loading}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
        />
        {failed && (
          <Callout
            tone={CalloutTone.Err}
            action={
              <Button
                variant={ButtonVariant.Ghost}
                size={ButtonSize.Sm}
                onClick={() => void retry()}
              >
                {t('retry')}
              </Button>
            }
          >
            {t('loadError')}
          </Callout>
        )}
        {!failed && !loading && prompts.length === 0 && (
          <EmptyState
            icon={IconName.Compl}
            title={t('picker.empty')}
            description={t('picker.emptyNote')}
          />
        )}
        {!failed && !loading && prompts.length > 0 && groups.length === 0 && (
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('picker.noMatch', { query })}
          </Text>
        )}
        {groups.map((group) => (
          <section key={group.folder.id} className="flex flex-col gap-1">
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {group.folder.name}
            </Text>
            <RowList
              mono={false}
              aria-label={group.folder.name}
              rows={group.prompts.map((prompt) => ({ id: prompt.id, name: prompt.name }))}
              onRowSelect={onPick}
            />
          </section>
        ))}
      </div>
    </Dialog>
  );
}
