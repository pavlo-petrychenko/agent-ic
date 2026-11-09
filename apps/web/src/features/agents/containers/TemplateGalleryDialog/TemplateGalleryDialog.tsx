import type { AgentTemplateKey } from '@agent-ic/flow';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateAgentFromTemplate } from '@/features/agents/communication/hooks/useCreateAgentFromTemplate';
import { useTemplateKnowledgeBases } from '@/features/agents/communication/hooks/useTemplateKnowledgeBases';
import { BUILDER_PATH } from '@/features/agents/constants/agentList.constants';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import {
  CATEGORY_FILTER_ALL,
  GalleryTab,
  KIND_GALLERY_TAB,
  TEMPLATE_KNOWLEDGE_PATH,
} from '@/features/agents/constants/agentTemplate.constants';
import type { TemplateGalleryDialogProps } from '@/features/agents/containers/TemplateGalleryDialog/TemplateGalleryDialog.typedefs';
import {
  cardsOfTab,
  filterByCategory,
  findCard,
  isTemplateNameValid,
  snippetCategories,
  tabOfCard,
  toCategoryFilter,
} from '@/features/agents/logic/helpers/agentTemplate.helpers';
import { useTemplateSetup } from '@/features/agents/logic/hooks/useTemplateSetup';
import type { CategoryFilter } from '@/features/agents/typedefs/agentTemplate.typedefs';
import { TemplateDetail } from '@/features/agents/view/TemplateDetail';
import { TemplateGallery } from '@/features/agents/view/TemplateGallery';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

export function TemplateGalleryDialog({
  workspaceId,
  templates,
  selectedKey,
  blankCreating,
  onSelect,
  onClose,
  onCreateBlank,
}: TemplateGalleryDialogProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const navigate = useNavigate();
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const { createFromTemplate, creating } = useCreateAgentFromTemplate();
  const selected = findCard(templates, selectedKey);
  const [tab, setTab] = useState<GalleryTab>(tabOfCard(selected) ?? GalleryTab.Templates);
  const [category, setCategory] = useState<CategoryFilter>(CATEGORY_FILTER_ALL);
  const [returnKey, setReturnKey] = useState<AgentTemplateKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setup = useTemplateSetup(selected?.key ?? null, selected?.name ?? '');
  const knowledge = useTemplateKnowledgeBases(selected === null || !selected.usesKnowledge);
  const busy = creating || blankCreating;
  const nameValid = isTemplateNameValid(setup.name);
  const snippets = cardsOfTab(templates, GalleryTab.Snippets);
  const visible =
    tab === GalleryTab.Snippets
      ? filterByCategory(snippets, category)
      : cardsOfTab(templates, GalleryTab.Templates);
  const knowledgeLocation = { to: TEMPLATE_KNOWLEDGE_PATH, params: { workspaceId } };

  const guarded = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
    }
  };

  const onPick = (key: AgentTemplateKey) => {
    setError(null);
    onSelect(key);
  };

  const onBack = () => {
    setError(null);
    if (selected !== null) {
      setReturnKey(selected.key);
      setTab(KIND_GALLERY_TAB[selected.kind]);
    }
    onSelect(null);
  };

  const onCreate = () => {
    if (selected === null || !nameValid || busy) {
      return;
    }
    const available = new Set(knowledge.knowledgeBases.map((knowledgeBase) => knowledgeBase.id));
    void guarded(async () => {
      const agentId = await createFromTemplate({
        templateKey: selected.key,
        name: setup.name.trim(),
        knowledgeBaseIds: selected.usesKnowledge
          ? setup.knowledgeBaseIds.filter((id) => available.has(id))
          : [],
      });
      if (agentId !== null) {
        await navigate({ to: BUILDER_PATH, params: { workspaceId, agentId } });
      }
    });
  };

  const onToggleKnowledgeBase = (id: string) =>
    setup.setKnowledgeBaseIds(
      setup.knowledgeBaseIds.includes(id)
        ? setup.knowledgeBaseIds.filter((selectedId) => selectedId !== id)
        : [...setup.knowledgeBaseIds, id],
    );

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      busy={busy}
      error={error}
      title={selected === null ? t('gallery.title') : selected.name}
      description={selected === null ? t('gallery.description') : t('gallery.detail.description')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Xl}
      footerLeft={
        selected === null ? null : (
          <Button variant={ButtonVariant.Ghost} disabled={busy} onClick={onBack}>
            {t('gallery.detail.back')}
          </Button>
        )
      }
      footerRight={
        selected === null ? null : (
          <Button
            icon={IconName.Plus}
            loading={creating}
            disabled={!nameValid || blankCreating}
            onClick={onCreate}
          >
            {t('gallery.detail.create')}
          </Button>
        )
      }
    >
      {selected === null ? (
        <TemplateGallery
          tab={tab}
          tabCounts={{
            [GalleryTab.Templates]: cardsOfTab(templates, GalleryTab.Templates).length,
            [GalleryTab.Snippets]: snippets.length,
          }}
          category={category}
          categories={snippetCategories(snippets)}
          cards={visible}
          focusKey={returnKey}
          blankCreating={blankCreating}
          onTabChange={setTab}
          onCategoryChange={(value) => setCategory(toCategoryFilter(value))}
          onSelect={onPick}
          onCreateBlank={() => void guarded(onCreateBlank)}
        />
      ) : (
        <TemplateDetail
          key={selected.key}
          card={selected}
          name={setup.name}
          nameInvalid={!nameValid}
          knowledge={
            selected.usesKnowledge
              ? {
                  knowledgeBases: knowledge.knowledgeBases,
                  selectedIds: setup.knowledgeBaseIds,
                  loading: knowledge.loading,
                  failed: knowledge.failed,
                  knowledgeHref: router.buildLocation(knowledgeLocation).href,
                }
              : null
          }
          disabled={busy}
          onNameChange={setup.setName}
          onToggleKnowledgeBase={onToggleKnowledgeBase}
          onRetryKnowledge={() => void knowledge.retry()}
          onOpenKnowledge={() => void navigate(knowledgeLocation)}
          onSubmit={onCreate}
        />
      )}
    </Dialog>
  );
}
