import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { KnowledgeBasePickerDialogProps } from '@/features/knowledge/view/KnowledgeBasePickerDialog/KnowledgeBasePickerDialog.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Checkbox } from '@/shared/ui/inputs/Checkbox';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function KnowledgeBasePickerDialog({
  knowledgeBases,
  selectedIds,
  loading,
  failed,
  onToggle,
  onRetry,
  onClose,
}: KnowledgeBasePickerDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return term.length === 0
      ? knowledgeBases
      : knowledgeBases.filter((knowledgeBase) =>
          knowledgeBase.name.toLocaleLowerCase().includes(term),
        );
  }, [knowledgeBases, query]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('agentField.pickerTitle')}
      description={t('agentField.pickerDescription')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Md}
      footerRight={
        <Button variant={ButtonVariant.Secondary} onClick={onClose}>
          {t('agentField.done')}
        </Button>
      }
    >
      <div className="flex min-h-0 flex-col gap-3">
        <SearchInput
          value={query}
          label={t('agentField.search')}
          clearLabel={t('agentField.clearSearch')}
          loading={loading}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
        />
        {failed ? (
          <Callout
            tone={CalloutTone.Err}
            action={
              <Button variant={ButtonVariant.Ghost} size={ButtonSize.Sm} onClick={onRetry}>
                {t('retry')}
              </Button>
            }
          >
            {t('agentField.loadError')}
          </Callout>
        ) : null}
        {!failed && !loading && knowledgeBases.length === 0 ? (
          <EmptyState
            icon={IconName.Kb}
            title={t('agentField.noKnowledgeBases')}
            description={t('agentField.noKnowledgeBasesNote')}
          />
        ) : null}
        {!failed && knowledgeBases.length > 0 && filtered.length === 0 ? (
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('agentField.noMatch', { query })}
          </Text>
        ) : null}
        {!failed && filtered.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {filtered.map((knowledgeBase) => (
              <li key={knowledgeBase.id}>
                <Checkbox
                  checked={selectedIds.includes(knowledgeBase.id)}
                  label={knowledgeBase.name}
                  description={
                    knowledgeBase.documentCount === 0
                      ? t('nav.noSources')
                      : t('nav.sources', { count: knowledgeBase.documentCount })
                  }
                  onCheckedChange={() => onToggle(knowledgeBase.id)}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Dialog>
  );
}
