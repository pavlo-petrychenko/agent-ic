import { AGENT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import {
  TEMPLATE_LEVEL_TONE,
  TemplateKnowledgeMode,
} from '@/features/agents/constants/agentTemplate.constants';
import {
  TEMPLATE_DETAIL_HIGHLIGHTS_SUFFIX,
  TEMPLATE_DETAIL_KNOWLEDGE_MODE_SUFFIX,
  TEMPLATE_DETAIL_STEPS_SUFFIX,
  TEMPLATE_DETAIL_THUMBNAIL_HEIGHT,
} from '@/features/agents/view/TemplateDetail/TemplateDetail.constants';
import type { TemplateDetailProps } from '@/features/agents/view/TemplateDetail/TemplateDetail.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge } from '@/shared/ui/display/Badge';
import { BulletList } from '@/shared/ui/display/BulletList';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { Tag, TagKind } from '@/shared/ui/display/Tag';
import { FlowThumbnail, FlowThumbnailSize } from '@/shared/ui/flow/FlowThumbnail';
import { Checkbox } from '@/shared/ui/inputs/Checkbox';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { OptionCard } from '@/shared/ui/inputs/OptionCard';
import styles from '@/features/agents/view/TemplateDetail/TemplateDetail.module.scss';

export function TemplateDetail({
  card,
  name,
  nameInvalid,
  knowledge,
  disabled,
  onNameChange,
  onKnowledgeModeChange,
  onToggleKnowledgeBase,
  onRetryKnowledge,
  onOpenKnowledge,
  onSubmit,
}: TemplateDetailProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const highlightsId = `${id}${TEMPLATE_DETAIL_HIGHLIGHTS_SUFFIX}`;
  const stepsId = `${id}${TEMPLATE_DETAIL_STEPS_SUFFIX}`;
  const knowledgeModeName = `${id}${TEMPLATE_DETAIL_KNOWLEDGE_MODE_SUFFIX}`;

  useEffect(() => {
    nameRef.current?.focus({ preventScroll: true });
    nameRef.current?.select();
  }, []);

  return (
    <form className={styles.root} onSubmit={(event) => event.preventDefault()}>
      <div className={styles.hero}>
        <FlowThumbnail
          nodes={card.graph.nodes}
          edges={card.graph.edges}
          size={FlowThumbnailSize.Md}
          height={TEMPLATE_DETAIL_THUMBNAIL_HEIGHT}
          ariaLabel={t('gallery.card.preview', { name: card.name })}
        />
      </div>
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.badges}>
            <Badge tone={TEMPLATE_LEVEL_TONE[card.level]}>{t(`gallery.level.${card.level}`)}</Badge>
            <Badge>{t(`gallery.categories.${card.category}`)}</Badge>
            {card.usesKnowledge && <Tag kind={TagKind.Kb}>{t('gallery.usesKnowledge')}</Tag>}
          </div>
          <p className={styles.description}>{card.description}</p>
          <section className={styles.section} aria-labelledby={highlightsId}>
            <h3 id={highlightsId} className={styles.sectionTitle}>
              {t('gallery.detail.highlights')}
            </h3>
            <BulletList items={card.highlights} />
          </section>
          <section className={styles.section} aria-labelledby={stepsId}>
            <h3 id={stepsId} className={styles.sectionTitle}>
              {t('gallery.detail.steps')}
            </h3>
            <ul className={styles.steps}>
              {card.steps.map((step) => (
                <li key={step.type}>
                  <NodeTile
                    kind={step.kind}
                    icon={step.icon}
                    size={TileSize.Sm}
                    label={step.label}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className={styles.column}>
          <h3 className={styles.sectionTitle}>{t('gallery.detail.setup')}</h3>
          <Field
            label={t('gallery.detail.nameLabel')}
            hint={t('gallery.detail.nameHint')}
            error={nameInvalid ? t('gallery.detail.nameRequired') : null}
            required
            requiredLabel={t('gallery.detail.required')}
          >
            {(control) => (
              <Input
                ref={nameRef}
                id={control.id}
                aria-describedby={control['aria-describedby']}
                invalid={control.invalid}
                required
                maxLength={AGENT_NAME_MAX_LENGTH}
                disabled={disabled}
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onSubmit();
                  }
                }}
              />
            )}
          </Field>
          {knowledge !== null && (
            <fieldset className={styles.knowledge} disabled={disabled}>
              <legend className={styles.legend}>{t('gallery.knowledge.label')}</legend>
              <OptionCard
                name={knowledgeModeName}
                value={TemplateKnowledgeMode.CreateNew}
                checked={knowledge.mode === TemplateKnowledgeMode.CreateNew}
                onSelect={() => onKnowledgeModeChange(TemplateKnowledgeMode.CreateNew)}
                title={t('gallery.knowledge.createNew.title', {
                  count: knowledge.newNames.length,
                })}
                description={t('gallery.knowledge.createNew.description', {
                  count: knowledge.newNames.length,
                })}
              >
                {knowledge.mode === TemplateKnowledgeMode.CreateNew ? (
                  <ul className={styles.newNames}>
                    {knowledge.newNames.map((newName) => (
                      <li key={newName}>
                        <Tag kind={TagKind.Kb}>{newName}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </OptionCard>
              <OptionCard
                name={knowledgeModeName}
                value={TemplateKnowledgeMode.UseExisting}
                checked={knowledge.mode === TemplateKnowledgeMode.UseExisting}
                onSelect={() => onKnowledgeModeChange(TemplateKnowledgeMode.UseExisting)}
                title={t('gallery.knowledge.useExisting.title')}
                description={t('gallery.knowledge.useExisting.description')}
              >
                {knowledge.mode !== TemplateKnowledgeMode.UseExisting ? null : knowledge.failed ? (
                  <Callout
                    tone={CalloutTone.Err}
                    action={
                      <Button
                        variant={ButtonVariant.Ghost}
                        size={ButtonSize.Sm}
                        onClick={onRetryKnowledge}
                      >
                        {t('gallery.knowledge.retry')}
                      </Button>
                    }
                  >
                    {t('gallery.knowledge.loadError')}
                  </Callout>
                ) : knowledge.loading ? (
                  <p className={styles.hint}>{t('gallery.knowledge.loading')}</p>
                ) : knowledge.knowledgeBases.length === 0 ? (
                  <Callout
                    tone={CalloutTone.Neutral}
                    action={
                      <Button
                        variant={ButtonVariant.Secondary}
                        size={ButtonSize.Sm}
                        href={knowledge.knowledgeHref}
                        onClick={(event) => {
                          event.preventDefault();
                          onOpenKnowledge();
                        }}
                      >
                        {t('gallery.knowledge.open')}
                      </Button>
                    }
                  >
                    {t('gallery.knowledge.none')}
                  </Callout>
                ) : (
                  <ul className={styles.knowledgeList}>
                    {knowledge.knowledgeBases.map((knowledgeBase) => (
                      <li key={knowledgeBase.id} className={styles.knowledgeRow}>
                        <Checkbox
                          checked={knowledge.selectedIds.includes(knowledgeBase.id)}
                          label={knowledgeBase.name}
                          description={
                            knowledgeBase.documentCount === 0
                              ? t('gallery.knowledge.noSources')
                              : t('gallery.knowledge.sources', {
                                  count: knowledgeBase.documentCount,
                                })
                          }
                          onCheckedChange={() => onToggleKnowledgeBase(knowledgeBase.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </OptionCard>
            </fieldset>
          )}
          <Callout tone={CalloutTone.Info}>{t('gallery.detail.draftNote')}</Callout>
        </div>
      </div>
    </form>
  );
}
