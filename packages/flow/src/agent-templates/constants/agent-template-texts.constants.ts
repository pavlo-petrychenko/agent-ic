import type { LocalizedText } from '@flow/agent-templates/typedefs/agent-template.typedefs';

export const CUSTOMER_MESSAGE_LABEL: LocalizedText = {
  en: 'Customer message',
  uk: 'Повідомлення клієнта',
};

export const SEND_ANSWER_LABEL: LocalizedText = {
  en: 'Send the answer',
  uk: 'Надіслати відповідь',
};

export const HAND_OFF_LABEL: LocalizedText = {
  en: 'Hand off to the team',
  uk: 'Передати команді',
};

export const HAND_OFF_MESSAGE: LocalizedText = {
  en: 'Thanks for your patience. A person from our team will reply here shortly.',
  uk: 'Дякуємо за терпіння. Людина з нашої команди скоро відповість вам тут.',
};

export const FALLBACK_MESSAGE: LocalizedText = {
  en: 'Sorry, everyone on our team is busy right now. We will get back to you as soon as we can.',
  uk: 'Вибачте, зараз уся наша команда зайнята. Ми відповімо вам, щойно зможемо.',
};

export const ASSISTANT_FAILED_REASON: LocalizedText = {
  en: 'The assistant could not answer.',
  uk: 'Асистент не зміг відповісти.',
};

export const HANDOFF_WHEN: LocalizedText = {
  en: 'The customer asks for a person, is upset or complains, or you still cannot help after two tries.',
  uk: 'Клієнт просить живу людину, засмучений чи скаржиться, або ви не можете допомогти навіть після двох спроб.',
};

export const END_WHEN: LocalizedText = {
  en: 'The customer says goodbye, thanks you to finish, or says they have no more questions.',
  uk: 'Клієнт прощається, дякує на завершення або каже, що питань більше немає.',
};

export const APOLOGY_MESSAGE: LocalizedText = {
  en: 'Sorry, something went wrong on our side. A person from our team will reply here shortly.',
  uk: 'Вибачте, у нас щось пішло не так. Людина з нашої команди скоро відповість вам тут.',
};

export const TALK_TO_PERSON_BUTTON: LocalizedText = {
  en: 'Talk to a person',
  uk: 'Поговорити з людиною',
};

export const TALK_TO_PERSON_RULE_LABEL: LocalizedText = { en: 'Person', uk: 'Людина' };
