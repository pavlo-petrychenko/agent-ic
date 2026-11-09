import { Locale } from '@agent-ic/contracts';

export const TEMPLATE_PROMPT_WRITER = Symbol('TEMPLATE_PROMPT_WRITER');

export const TEMPLATE_PROMPT_FOLDER_NAME: Readonly<Record<Locale, string>> = {
  [Locale.En]: 'Templates',
  [Locale.Uk]: 'Шаблони',
};

export const TEMPLATE_PROMPT_NOTE: Readonly<Record<Locale, string>> = {
  [Locale.En]: 'Created from an agent template.',
  [Locale.Uk]: 'Створено з шаблону агента.',
};

export const MAX_TEMPLATE_KNOWLEDGE_BASES = 20;

export const INVALID_TEMPLATE_PROMPT_WRITER_MESSAGE =
  'A template prompt writer must extend the abstract class.';
export const TEMPLATE_PROMPT_WRITER_COUNT_MESSAGE =
  'Exactly one template prompt writer must be registered.';
