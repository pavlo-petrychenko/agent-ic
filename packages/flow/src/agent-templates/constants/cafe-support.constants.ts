import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import {
  APOLOGY_MESSAGE,
  ASSISTANT_FAILED_REASON,
  HAND_OFF_LABEL,
  SEND_ANSWER_LABEL,
  TALK_TO_PERSON_BUTTON,
} from '@flow/agent-templates/constants/agent-template-texts.constants';
import {
  AGENT_TEMPLATE_ALL_NOTIFY_CHANNELS,
  AGENT_TEMPLATE_ECHO_URL,
  AGENT_TEMPLATE_INACTIVITY_KEY,
  AGENT_TEMPLATE_TRIGGER_KEY,
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateLevel,
  AgentTemplatePromptKey,
} from '@flow/agent-templates/constants/agent-template.constants';
import {
  agentStep,
  apiRequestStep,
  endChat,
  handOff,
  inactivityTrigger,
  link,
  localize,
  localizer,
  messageTrigger,
  routerStep,
  sendMessages,
  sendText,
  templateCondition,
  templateEnumField,
  templateField,
  templateHandoffSettings,
  templateRule,
  templateRuleOfAll,
} from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplateDefinition,
  AgentTemplateDraft,
  AgentTemplateOptions,
  LocalizedText,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { PortName } from '@flow/document/constants/flow.constants';
import { MINUTES_PER_HOUR } from '@flow/limits/constants/limit.constants';
import { AgentExitKind, FailureMode } from '@flow/nodes/constants/step.constants';
import {
  InactivityActivity,
  InactivityRepeatKind,
  InactivityUnit,
} from '@flow/nodes/constants/trigger.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { INACTIVITY_ROOT, TODAY_VARIABLE } from '@flow/scope/constants/scope.constants';
import { UnhandledFailureAction } from '@flow/settings/constants/settings.constants';

const MESSAGE_TEXT = 'message.text';
const QUICK_REPLY_KEY = 'quick_reply';
const MENU_KEY = 'menu';
const HOURS_KEY = 'hours';
const PERSON_RULE = 'person';
const PERSON_KEY = 'talk_to_person';
const ASSISTANT_KEY = 'assistant';
const ASSISTANT_FAILED_KEY = 'assistant_failed';
const CHECK_BOOKING_KEY = 'check_booking';
const BOOKING_READY_RULE = 'booking_ready';
const SAVE_BOOKING_KEY = 'save_booking';
const CONFIRM_BOOKING_KEY = 'confirm_booking';
const BOOKING_FAILED_KEY = 'booking_failed';
const REPLY_KEY = 'reply';
const GOODBYE_KEY = 'goodbye';
const CLOSE_CHAT_KEY = 'close_chat';
const FOLLOW_UP_KEY = 'which_follow_up';
const FIRST_RULE = 'first';
const STILL_THERE_KEY = 'still_there';
const LAST_REMINDER_KEY = 'last_reminder';
const CLOSE_AFTER_SILENCE_KEY = 'close_after_silence';

const INTENT_FIELD = 'intent';
const BOOKING_INTENT = 'booking';
const QUESTION_INTENT = 'question';
const DATE_FIELD = 'booking_date';
const TIME_FIELD = 'booking_time';
const GUESTS_FIELD = 'guests';
const PHONE_FIELD = 'phone';
const TODAY_PROMPT_VARIABLE = 'today';
const MIN_GUESTS = 1;

const FIRST_ATTEMPT = 1;
const SILENCE_HOURS = 2;
const REPEAT_HOURS = 22;
const MAX_FOLLOW_UPS = 2;
const AUTO_CLOSE_HOURS = 48;

const field = (name: string): string => `${ASSISTANT_KEY}.${name}`;
const value = (name: string): string => `{{${field(name)}}}`;

const BOOKING_BODY = `{"name": "{{user.name}}", "date": "${value(DATE_FIELD)}", "time": "${value(TIME_FIELD)}", "guests": ${value(GUESTS_FIELD)}, "phone": "${value(PHONE_FIELD)}"}`;

const MENU_BUTTON: LocalizedText = { en: 'Menu', uk: 'Меню' };
const HOURS_BUTTON: LocalizedText = { en: 'Opening hours', uk: 'Години роботи' };
const MENU_BUTTONS: readonly LocalizedText[] = [MENU_BUTTON, HOURS_BUTTON, TALK_TO_PERSON_BUTTON];
const AFTER_BOOKING_BUTTONS: readonly LocalizedText[] = [MENU_BUTTON, TALK_TO_PERSON_BUTTON];

const MENU_TEXT: LocalizedText = {
  en: 'Here is our menu.\nCoffee: espresso 55 UAH, americano 60 UAH, cappuccino 75 UAH, flat white 85 UAH, latte 80 UAH.\nNot coffee: matcha latte 95 UAH, hot chocolate 80 UAH, tea 50 UAH.\nFood: croissant 65 UAH, cheesecake 110 UAH, syrnyky with sour cream 145 UAH, shakshuka 185 UAH.\nPlant milk is 15 UAH extra. Ask me about allergens or book a table right here.',
  uk: 'Ось наше меню.\nКава: еспресо 55 грн, американо 60 грн, капучино 75 грн, флет вайт 85 грн, лате 80 грн.\nНе кава: матча лате 95 грн, гарячий шоколад 80 грн, чай 50 грн.\nЇжа: круасан 65 грн, чизкейк 110 грн, сирники зі сметаною 145 грн, шакшука 185 грн.\nРослинне молоко — плюс 15 грн. Запитайте мене про алергени або забронюйте столик просто тут.',
};

const HOURS_TEXT: LocalizedText = {
  en: 'We are open every day: Monday to Friday from 8:00 to 21:00, Saturday and Sunday from 9:00 to 22:00. The kitchen takes the last order 30 minutes before closing.',
  uk: 'Ми працюємо щодня: з понеділка по п’ятницю з 8:00 до 21:00, у суботу й неділю з 9:00 до 22:00. Кухня приймає останнє замовлення за 30 хвилин до закриття.',
};

const draft = (options: AgentTemplateOptions): AgentTemplateDraft => {
  const t = localizer(options.locale);
  const menuButtons = MENU_BUTTONS.map(t);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      routerStep(
        QUICK_REPLY_KEY,
        t({ en: 'Which button?', uk: 'Яка кнопка?' }),
        [0, 1],
        [
          templateRule(
            MENU_KEY,
            t(MENU_BUTTON),
            MESSAGE_TEXT,
            ConditionOperator.Eq,
            t(MENU_BUTTON),
          ),
          templateRule(
            HOURS_KEY,
            t(HOURS_BUTTON),
            MESSAGE_TEXT,
            ConditionOperator.Eq,
            t(HOURS_BUTTON),
          ),
          templateRule(
            PERSON_RULE,
            t(TALK_TO_PERSON_BUTTON),
            MESSAGE_TEXT,
            ConditionOperator.Eq,
            t(TALK_TO_PERSON_BUTTON),
          ),
        ],
      ),
      sendText(
        MENU_KEY,
        t({ en: 'Send the menu', uk: 'Надіслати меню' }),
        [-1.5, 2],
        t(MENU_TEXT),
        menuButtons,
      ),
      sendText(
        HOURS_KEY,
        t({ en: 'Send the opening hours', uk: 'Надіслати години роботи' }),
        [-0.8, 3],
        t(HOURS_TEXT),
        menuButtons,
      ),
      handOff(
        options,
        PERSON_KEY,
        t(HAND_OFF_LABEL),
        [0.08, 3],
        t({
          en: 'The guest pressed “Talk to a person”.',
          uk: 'Гість натиснув «Поговорити з людиною».',
        }),
        AGENT_TEMPLATE_ALL_NOTIFY_CHANNELS,
      ),
      agentStep(options, {
        key: ASSISTANT_KEY,
        label: t({ en: 'Café assistant', uk: 'Асистент кав’ярні' }),
        at: [2, 2],
        prompt: AgentTemplatePromptKey.CafeAssistant,
        knowledge: true,
        bindings: { [TODAY_PROMPT_VARIABLE]: TODAY_VARIABLE },
        output: [
          templateEnumField(
            INTENT_FIELD,
            t({
              en: 'booking while the guest is arranging a table, otherwise question',
              uk: 'booking, поки гість домовляється про столик, інакше question',
            }),
            [QUESTION_INTENT, BOOKING_INTENT],
          ),
          templateField(
            DATE_FIELD,
            OutputFieldType.String,
            t({ en: 'The booking date as YYYY-MM-DD', uk: 'Дата бронювання у форматі YYYY-MM-DD' }),
            false,
          ),
          templateField(
            TIME_FIELD,
            OutputFieldType.String,
            t({
              en: 'The booking time as HH:MM, 24-hour',
              uk: 'Час бронювання у форматі HH:MM, 24 години',
            }),
            false,
          ),
          templateField(
            GUESTS_FIELD,
            OutputFieldType.Number,
            t({ en: 'The number of guests', uk: 'Кількість гостей' }),
            false,
          ),
          templateField(
            PHONE_FIELD,
            OutputFieldType.String,
            t({
              en: 'The guest’s phone number, as written',
              uk: 'Номер телефону гостя, як він його написав',
            }),
            false,
          ),
        ],
        exits: {
          handoff: {
            when: t({
              en: 'The guest asks for a person, complains, or the question needs a decision by the team, such as a large group, a private event or a refund.',
              uk: 'Гість просить живу людину, скаржиться або питання потребує рішення команди, наприклад для великої компанії, приватного заходу чи повернення коштів.',
            }),
          },
          end: {
            when: t({
              en: 'The guest says goodbye and has nothing more to ask.',
              uk: 'Гість прощається й більше нічого не питає.',
            }),
          },
        },
      }),
      routerStep(
        CHECK_BOOKING_KEY,
        t({ en: 'Ready to book?', uk: 'Можна бронювати?' }),
        [1.02, 3],
        [
          templateRuleOfAll(
            BOOKING_READY_RULE,
            t({ en: 'All booking details', uk: 'Усі деталі бронювання' }),
            [
              templateCondition(field(INTENT_FIELD), ConditionOperator.Eq, BOOKING_INTENT),
              templateCondition(field(DATE_FIELD), ConditionOperator.IsNotEmpty),
              templateCondition(field(TIME_FIELD), ConditionOperator.IsNotEmpty),
              templateCondition(field(GUESTS_FIELD), ConditionOperator.Gte, MIN_GUESTS),
              templateCondition(field(PHONE_FIELD), ConditionOperator.IsNotEmpty),
            ],
          ),
        ],
      ),
      handOff(
        options,
        ASSISTANT_FAILED_KEY,
        t({ en: 'Hand off: assistant failed', uk: 'Передати: асистент не відповів' }),
        [1.92, 3],
        t(ASSISTANT_FAILED_REASON),
        AGENT_TEMPLATE_ALL_NOTIFY_CHANNELS,
      ),
      sendMessages(
        GOODBYE_KEY,
        t({ en: 'Say goodbye', uk: 'Попрощатися' }),
        [2.8, 3],
        ASSISTANT_KEY,
      ),
      endChat(CLOSE_CHAT_KEY, t({ en: 'End the chat', uk: 'Завершити чат' }), [2.8, 4], null),
      apiRequestStep(
        SAVE_BOOKING_KEY,
        t({ en: 'Save the booking', uk: 'Зберегти бронювання' }),
        [-0.1, 4],
        { url: AGENT_TEMPLATE_ECHO_URL, body: BOOKING_BODY, onFailure: FailureMode.ErrorPort },
      ),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [1.16, 4], ASSISTANT_KEY, menuButtons),
      sendText(
        CONFIRM_BOOKING_KEY,
        t({ en: 'Confirm the booking', uk: 'Підтвердити бронювання' }),
        [-0.7, 5],
        t({
          en: `Your table is booked: ${value(GUESTS_FIELD)} guests on ${value(DATE_FIELD)} at ${value(TIME_FIELD)}. If anything changes, we will call you at ${value(PHONE_FIELD)}. See you at Kavarnia!`,
          uk: `Столик заброньовано: ${value(DATE_FIELD)} о ${value(TIME_FIELD)}, гостей — ${value(GUESTS_FIELD)}. Якщо щось зміниться, ми зателефонуємо на ${value(PHONE_FIELD)}. Чекаємо на вас у Kavarnia!`,
        }),
        AFTER_BOOKING_BUTTONS.map(t),
      ),
      handOff(
        options,
        BOOKING_FAILED_KEY,
        t({ en: 'Hand off: booking not saved', uk: 'Передати: бронювання не збережено' }),
        [0.3, 5],
        t({
          en: `Booking could not be saved: ${value(GUESTS_FIELD)} guests on ${value(DATE_FIELD)} at ${value(TIME_FIELD)}, phone ${value(PHONE_FIELD)}. Please confirm it with the guest.`,
          uk: `Бронювання не вдалося зберегти: ${value(DATE_FIELD)} о ${value(TIME_FIELD)}, гостей — ${value(GUESTS_FIELD)}, телефон ${value(PHONE_FIELD)}. Будь ласка, підтвердьте його з гостем.`,
        }),
        AGENT_TEMPLATE_ALL_NOTIFY_CHANNELS,
        t({
          en: 'Sorry, we could not save your booking automatically. A person from our team will confirm it here shortly.',
          uk: 'Вибачте, нам не вдалося зберегти бронювання автоматично. Людина з нашої команди скоро підтвердить його тут.',
        }),
      ),
      inactivityTrigger(
        AGENT_TEMPLATE_INACTIVITY_KEY,
        t({ en: 'Guest went quiet', uk: 'Гість замовк' }),
        [4.5, 0],
        {
          silence: { amount: SILENCE_HOURS, unit: InactivityUnit.Hours },
          activity: InactivityActivity.Customer,
          repeat: {
            kind: InactivityRepeatKind.Every,
            every: { amount: REPEAT_HOURS, unit: InactivityUnit.Hours },
            maxTimes: MAX_FOLLOW_UPS,
          },
          conditions: { notEscalated: true, channelTypes: [] },
        },
      ),
      routerStep(
        FOLLOW_UP_KEY,
        t({ en: 'Which follow-up?', uk: 'Яке нагадування?' }),
        [4.5, 1],
        [
          templateRule(
            FIRST_RULE,
            t({ en: 'First follow-up', uk: 'Перше нагадування' }),
            `${INACTIVITY_ROOT}.attempt`,
            ConditionOperator.Eq,
            FIRST_ATTEMPT,
          ),
        ],
      ),
      sendText(
        STILL_THERE_KEY,
        t({ en: 'Ask if they are still there', uk: 'Запитати, чи гість ще тут' }),
        [4, 2],
        t({
          en: 'Are you still there? Tap a button below or just write your question, and I will gladly help.',
          uk: 'Ви ще тут? Натисніть кнопку нижче або просто напишіть питання, і я радо допоможу.',
        }),
        menuButtons,
      ),
      sendText(
        LAST_REMINDER_KEY,
        t({ en: 'Send a last reminder', uk: 'Надіслати останнє нагадування' }),
        [5, 2],
        t({
          en: 'Just a friendly reminder: if you would like to book a table or ask about the menu, we are here.',
          uk: 'Просто дружнє нагадування: якщо захочете забронювати столик чи запитати про меню, ми поруч.',
        }),
      ),
      endChat(
        CLOSE_AFTER_SILENCE_KEY,
        t({ en: 'Close the quiet chat', uk: 'Закрити тихий чат' }),
        [5, 3],
        t({
          en: 'I am closing this chat for now. Write any time to start a new one. See you at Kavarnia!',
          uk: 'Поки що я закриваю цей чат. Пишіть будь-коли, щоб почати новий. Чекаємо на вас у Kavarnia!',
        }),
      ),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, QUICK_REPLY_KEY),
      link(QUICK_REPLY_KEY, MENU_KEY, MENU_KEY),
      link(QUICK_REPLY_KEY, HOURS_KEY, HOURS_KEY),
      link(QUICK_REPLY_KEY, PERSON_KEY, PERSON_RULE),
      link(QUICK_REPLY_KEY, ASSISTANT_KEY, PortName.Else),
      link(ASSISTANT_KEY, CHECK_BOOKING_KEY),
      link(ASSISTANT_KEY, ASSISTANT_FAILED_KEY, PortName.Error),
      link(ASSISTANT_KEY, GOODBYE_KEY, AgentExitKind.End),
      link(GOODBYE_KEY, CLOSE_CHAT_KEY),
      link(CHECK_BOOKING_KEY, SAVE_BOOKING_KEY, BOOKING_READY_RULE),
      link(CHECK_BOOKING_KEY, REPLY_KEY, PortName.Else),
      link(SAVE_BOOKING_KEY, CONFIRM_BOOKING_KEY),
      link(SAVE_BOOKING_KEY, BOOKING_FAILED_KEY, PortName.Error),
      link(AGENT_TEMPLATE_INACTIVITY_KEY, FOLLOW_UP_KEY),
      link(FOLLOW_UP_KEY, STILL_THERE_KEY, FIRST_RULE),
      link(FOLLOW_UP_KEY, LAST_REMINDER_KEY, PortName.Else),
      link(LAST_REMINDER_KEY, CLOSE_AFTER_SILENCE_KEY),
    ],
    settings: {
      handoff: templateHandoffSettings(options.locale, AGENT_TEMPLATE_ALL_NOTIFY_CHANNELS),
      onUnhandledFailure: {
        action: UnhandledFailureAction.Handoff,
        customerMessage: localize(APOLOGY_MESSAGE, options.locale),
      },
      autoClose: { afterMinutes: AUTO_CLOSE_HOURS * MINUTES_PER_HOUR },
    },
  };
};

export const CAFE_SUPPORT_TEMPLATE: AgentTemplateDefinition = {
  key: AgentTemplateKey.CafeSupport,
  kind: AgentTemplateKind.Template,
  category: AgentTemplateCategory.Support,
  level: AgentTemplateLevel.Advanced,
  name: { en: 'Café support', uk: 'Підтримка кав’ярні' },
  description: {
    en: 'A complete café assistant: menu and hours buttons, answers from your knowledge base, table bookings sent to your system, hand-off to the team and follow-ups when a guest goes quiet.',
    uk: 'Повний асистент кав’ярні: кнопки меню й годин роботи, відповіді з вашої бази знань, бронювання столиків у вашу систему, передавання команді й нагадування, коли гість замовк.',
  },
  highlights: [
    {
      en: 'Buttons answer common questions without AI',
      uk: 'Кнопки відповідають на часті питання без ШІ',
    },
    {
      en: 'The assistant collects bookings into output fields',
      uk: 'Асистент збирає бронювання в поля виводу',
    },
    {
      en: 'Follow-ups and auto-close keep chats tidy',
      uk: 'Нагадування й автозакриття тримають чати в порядку',
    },
  ],
  usesKnowledge: true,
  prompts: [AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.CafeAssistant]],
  draft,
};
