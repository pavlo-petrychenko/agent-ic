import {
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateKnowledgeRole,
  AgentTemplateLevel,
} from '@agent-ic/flow';
import {
  AgentTemplateKey as ApiAgentTemplateKey,
  AgentTemplateKnowledgeRole as ApiAgentTemplateKnowledgeRole,
} from '@/shared/api/generated/schema.generated';
import { BadgeTone } from '@/shared/ui/display/Badge';

export enum GalleryTab {
  Templates = 'templates',
  Examples = 'examples',
  Snippets = 'snippets',
  Blank = 'blank',
}

export const GALLERY_TABS: readonly GalleryTab[] = [
  GalleryTab.Templates,
  GalleryTab.Examples,
  GalleryTab.Snippets,
  GalleryTab.Blank,
];

export const GALLERY_TAB_KIND: Readonly<Record<GalleryTab, AgentTemplateKind | null>> = {
  [GalleryTab.Templates]: AgentTemplateKind.Template,
  [GalleryTab.Examples]: AgentTemplateKind.Example,
  [GalleryTab.Snippets]: AgentTemplateKind.Snippet,
  [GalleryTab.Blank]: null,
};

export const KIND_GALLERY_TAB: Readonly<Record<AgentTemplateKind, GalleryTab>> = {
  [AgentTemplateKind.Template]: GalleryTab.Templates,
  [AgentTemplateKind.Example]: GalleryTab.Examples,
  [AgentTemplateKind.Snippet]: GalleryTab.Snippets,
};

export const FEATURED_GALLERY_TABS: readonly GalleryTab[] = [
  GalleryTab.Templates,
  GalleryTab.Examples,
];

export enum TemplateKnowledgeMode {
  CreateNew = 'create_new',
  UseExisting = 'use_existing',
}

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
  [AgentTemplateKey.FaqFromDocuments]: ApiAgentTemplateKey.FaqFromDocuments,
  [AgentTemplateKey.LeadHandling]: ApiAgentTemplateKey.LeadHandling,
  [AgentTemplateKey.AppointmentBooking]: ApiAgentTemplateKey.AppointmentBooking,
  [AgentTemplateKey.RouteToSpecialists]: ApiAgentTemplateKey.RouteToSpecialists,
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

export const KNOWLEDGE_ROLE_TO_API: Readonly<
  Record<AgentTemplateKnowledgeRole, ApiAgentTemplateKnowledgeRole>
> = {
  [AgentTemplateKnowledgeRole.Menu]: ApiAgentTemplateKnowledgeRole.Menu,
  [AgentTemplateKnowledgeRole.Booking]: ApiAgentTemplateKnowledgeRole.Booking,
  [AgentTemplateKnowledgeRole.Jobs]: ApiAgentTemplateKnowledgeRole.Jobs,
  [AgentTemplateKnowledgeRole.General]: ApiAgentTemplateKnowledgeRole.General,
  [AgentTemplateKnowledgeRole.Sales]: ApiAgentTemplateKnowledgeRole.Sales,
  [AgentTemplateKnowledgeRole.Support]: ApiAgentTemplateKnowledgeRole.Support,
};

export const TEMPLATE_PREVIEW_ID_PREFIX = 'preview_';
export const TEMPLATE_PREVIEW_TIME_ZONE = 'UTC';
export const TEMPLATE_PREVIEW_MODELS = { agent: '', completion: '' };
export const TEMPLATE_STEP_PREVIEW_LIMIT = 6;
export const TEMPLATE_KNOWLEDGE_PATH = '/w/$workspaceId/knowledge';
