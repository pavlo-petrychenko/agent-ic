import clsx from 'clsx';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import {
  TEMPLATE_LEVEL_TONE,
  TEMPLATE_STEP_PREVIEW_LIMIT,
} from '@/features/agents/constants/agentTemplate.constants';
import {
  TEMPLATE_CARD_DESCRIPTION_SUFFIX,
  TEMPLATE_CARD_NAME_SUFFIX,
  TEMPLATE_CARD_THUMBNAIL_HEIGHT,
} from '@/features/agents/view/TemplateCard/TemplateCard.constants';
import type { TemplateCardProps } from '@/features/agents/view/TemplateCard/TemplateCard.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge } from '@/shared/ui/display/Badge';
import { NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { Tag, TagKind } from '@/shared/ui/display/Tag';
import { FlowThumbnail, FlowThumbnailSize } from '@/shared/ui/flow/FlowThumbnail';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/agents/view/TemplateCard/TemplateCard.module.scss';

export function TemplateCard({ card, size, actionLabel, onSelect }: TemplateCardProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const id = useId();
  const nameId = `${id}${TEMPLATE_CARD_NAME_SUFFIX}`;
  const descriptionId = `${id}${TEMPLATE_CARD_DESCRIPTION_SUFFIX}`;
  const shownSteps = card.steps.slice(0, TEMPLATE_STEP_PREVIEW_LIMIT);
  const hiddenSteps = card.steps.length - shownSteps.length;

  const content = (
    <>
      <span className={styles.media}>
        <FlowThumbnail
          nodes={card.graph.nodes}
          edges={card.graph.edges}
          size={FlowThumbnailSize.Sm}
          height={TEMPLATE_CARD_THUMBNAIL_HEIGHT[size]}
          ariaLabel={t('gallery.card.preview', { name: card.name })}
        />
      </span>
      <span className={styles.text}>
        <span className={styles.titleRow}>
          <span id={nameId} className={styles.name}>
            {card.name}
          </span>
          <Badge tone={TEMPLATE_LEVEL_TONE[card.level]}>{t(`gallery.level.${card.level}`)}</Badge>
        </span>
        <span id={descriptionId} className={styles.description}>
          {card.description}
        </span>
      </span>
      <span className={styles.meta}>
        <span className={styles.steps}>
          {shownSteps.map((step) => (
            <NodeTile
              key={step.type}
              kind={step.kind}
              icon={step.icon}
              size={TileSize.Sm}
              aria-label={step.label}
            />
          ))}
          {hiddenSteps > 0 && <span className={styles.more}>{`+${hiddenSteps}`}</span>}
        </span>
        {card.usesKnowledge && <Tag kind={TagKind.Kb}>{t('gallery.usesKnowledge')}</Tag>}
      </span>
    </>
  );

  if (actionLabel === null) {
    return (
      <button
        type="button"
        className={clsx(styles.root, styles.pick, styles[size])}
        aria-labelledby={nameId}
        aria-describedby={descriptionId}
        data-template={card.key}
        onClick={() => onSelect(card.key)}
      >
        {content}
      </button>
    );
  }

  return (
    <article
      className={clsx(styles.root, styles[size])}
      aria-labelledby={nameId}
      data-template={card.key}
    >
      {content}
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Sm}
        icon={IconName.Plus}
        className={styles.action}
        aria-describedby={nameId}
        onClick={() => onSelect(card.key)}
      >
        {actionLabel}
      </Button>
    </article>
  );
}
