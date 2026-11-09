import {
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateLevel,
} from '@agent-ic/flow';
import { AgentTemplateKey as ApiAgentTemplateKey } from '@/shared/api/generated/schema.generated';
import { BadgeTone } from '@/shared/ui/display/Badge';

export enum GalleryTab {
  Templates = 'templates',
  Snippets = 'snippets',
}

export const GALLERY_TABS: readonly GalleryTab[] = [GalleryTab.Templates, GalleryTab.Snippets];

export const GALLERY_TAB_KIND: Readonly<Record<GalleryTab, AgentTemplateKind>> = {
  [GalleryTab.Templates]: AgentTemplateKind.Template,
  [GalleryTab.Snippets]: AgentTemplateKind.Snippet,
};

export const KIND_GALLERY_TAB: Readonly<Record<AgentTemplateKind, GalleryTab>> = {
  [AgentTemplateKind.Template]: GalleryTab.Templates,
  [AgentTemplateKind.Snippet]: GalleryTab.Snippets,
};

export const CATEGORY_FILTER_ALL = 'all';

export const TEMPLATE_CATEGORIES: readonly AgentTemplateCategory[] = [
  AgentTemplateCategory.Support,
  AgentTemplateCategory.Sales,
  AgentTemplateCategory.Quality,
  AgentTemplateCategory.FollowUp,
];

export const TEMPLATE_LEVEL_TONE: Readonly<Record<AgentTemplateLevel, BadgeTone>> = {
  [AgentTemplateLevel.Starter]: BadgeTone.Ok,
  [AgentTemplateLevel.Intermediate]: BadgeTone.Accent,
  [AgentTemplateLevel.Advanced]: BadgeTone.Violet,
};

export const TEMPLATE_KEY_TO_API: Readonly<Record<AgentTemplateKey, ApiAgentTemplateKey>> = {
  [AgentTemplateKey.CafeSupport]: ApiAgentTemplateKey.CafeSupport,
  [AgentTemplateKey.StoreSales]: ApiAgentTemplateKey.StoreSales,
  [AgentTemplateKey.FaqHandOff]: ApiAgentTemplateKey.FaqHandOff,
  [AgentTemplateKey.KnowledgeAnswers]: ApiAgentTemplateKey.KnowledgeAnswers,
  [AgentTemplateKey.MenuButtons]: ApiAgentTemplateKey.MenuButtons,
  [AgentTemplateKey.IntentRouter]: ApiAgentTemplateKey.IntentRouter,
  [AgentTemplateKey.LeadCapture]: ApiAgentTemplateKey.LeadCapture,
  [AgentTemplateKey.FollowUpOnSilence]: ApiAgentTemplateKey.FollowUpOnSilence,
  [AgentTemplateKey.ScheduledCheckIn]: ApiAgentTemplateKey.ScheduledCheckIn,
  [AgentTemplateKey.CloseChat]: ApiAgentTemplateKey.CloseChat,
  [AgentTemplateKey.GuardedReply]: ApiAgentTemplateKey.GuardedReply,
  [AgentTemplateKey.BackgroundReview]: ApiAgentTemplateKey.BackgroundReview,
};

export const TEMPLATE_PREVIEW_ID_PREFIX = 'preview_';
export const TEMPLATE_PREVIEW_TIME_ZONE = 'UTC';
export const TEMPLATE_PREVIEW_MODELS = { agent: '', completion: '' };
export const TEMPLATE_STEP_PREVIEW_LIMIT = 6;
export const TEMPLATE_KNOWLEDGE_PATH = '/w/$workspaceId/knowledge';
