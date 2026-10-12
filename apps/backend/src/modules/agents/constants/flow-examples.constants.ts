import {
  ConditionOperator,
  FailureMode,
  HttpMethod,
  OutputFieldType,
  PortName,
} from '@agent-ic/flow';
import { EXAMPLE_TRIGGER_KEY as START } from '@/modules/agents/constants/flow-example-nodes.constants';
import {
  backgroundLink,
  exampleAgent,
  exampleApiRequest,
  exampleCompletion,
  exampleEndChat,
  exampleEnumField,
  exampleField,
  exampleHandOff,
  exampleParallel,
  exampleRouter,
  exampleRule,
  exampleSendReply,
  exampleSendText,
  exampleTrigger,
  link,
} from '@/modules/agents/helpers/flow-example-nodes.helpers';
import type { FlowExample } from '@/modules/agents/typedefs/flow-example.typedefs';

const ECHO_GET_URL = 'https://postman-echo.com/get';
const ECHO_POST_URL = 'https://postman-echo.com/post';
const CAFE_ASSISTANT_PROMPT =
  'You are the assistant of Kavarnia, a cosy café in Lviv. Answer briefly and kindly.';
const PRICE_LIST = 'Espresso 45 UAH, cappuccino 65 UAH, syrnyky 120 UAH, lviv cheesecake 95 UAH.';
const MENU_BUTTONS = ['Menu', 'Hours', 'Talk to a person'] as const;
const [MENU_BUTTON, HOURS_BUTTON, PERSON_BUTTON] = MENU_BUTTONS;

const faqAssistant: FlowExample = {
  name: 'FAQ assistant',
  description: 'An agent answers; when it fails, a person takes over.',
  nodes: [
    exampleTrigger([0, 0]),
    exampleAgent('faq', 'Answer the question', [0, 1], CAFE_ASSISTANT_PROMPT),
    exampleSendReply('reply', 'Send the answer', [0, 2], 'faq.messages'),
    exampleHandOff('hand_off', 'Hand off to the team', [1, 2], 'The assistant could not answer.'),
  ],
  edges: [link(START, 'faq'), link('faq', 'reply'), link('faq', 'hand_off', PortName.Error)],
};

const intentRouter: FlowExample = {
  name: 'Intent router',
  description: 'A completion sorts the message, a router sends each kind its own way.',
  nodes: [
    exampleTrigger([0, 0]),
    exampleCompletion('intent', 'What does the customer want?', [0, 1], 'Sort the message.', [
      exampleEnumField('kind', 'What the customer wants', [
        'booking',
        'prices',
        'complaint',
        'other',
      ]),
    ]),
    exampleRouter(
      'route',
      'Route by intent',
      [0, 2],
      [
        exampleRule('booking', 'Booking', 'intent.kind', ConditionOperator.Eq, 'booking'),
        exampleRule('prices', 'Prices', 'intent.kind', ConditionOperator.Eq, 'prices'),
        exampleRule('complaint', 'Complaint', 'intent.kind', ConditionOperator.Eq, 'complaint'),
      ],
    ),
    exampleAgent('booking_helper', 'Booking helper', [-1.5, 3], 'Help the guest book a table.'),
    exampleSendText('prices', 'Send the price list', [-0.5, 3], PRICE_LIST),
    exampleHandOff('hand_off', 'Hand off to the team', [0.5, 3], 'The customer needs a person.'),
    exampleAgent('assistant', 'Answer anything else', [1.5, 3], CAFE_ASSISTANT_PROMPT),
    exampleSendReply(
      'booking_reply',
      'Send the booking answer',
      [-1.5, 4],
      'booking_helper.messages',
    ),
    exampleSendReply('reply', 'Send the answer', [1.5, 4], 'assistant.messages'),
  ],
  edges: [
    link(START, 'intent'),
    link('intent', 'route'),
    link('intent', 'hand_off', PortName.Error),
    link('route', 'booking_helper', 'booking'),
    link('route', 'prices', 'prices'),
    link('route', 'hand_off', 'complaint'),
    link('route', 'assistant', PortName.Else),
    link('booking_helper', 'booking_reply'),
    link('booking_helper', 'hand_off', PortName.Error),
    link('assistant', 'reply'),
    link('assistant', 'hand_off', PortName.Error),
  ],
};

const complaintCheck: FlowExample = {
  name: 'Complaint check in parallel',
  description: 'A complaint check and a drafted reply run together; the reply waits for both.',
  nodes: [
    exampleTrigger([0, 0]),
    exampleParallel('together', 'Check and draft together', [0, 1]),
    exampleCompletion('complaint', 'Is it a complaint?', [-0.5, 2], 'Is this a complaint?', [
      exampleField('is_complaint', OutputFieldType.Boolean, 'The customer complains'),
      exampleField('reason', OutputFieldType.String, 'What went wrong', false),
    ]),
    exampleAgent('draft', 'Draft a reply', [0.5, 2], CAFE_ASSISTANT_PROMPT),
    exampleHandOff(
      'check_failed',
      'Hand off to the team',
      [-1.5, 3],
      'The complaint check failed.',
    ),
    exampleHandOff('draft_failed', 'Hand off to the team', [1.5, 3], 'The draft failed.'),
    exampleRouter(
      'decide',
      'Complaint?',
      [0, 4],
      [exampleRule('complaint', 'Complaint', 'complaint.is_complaint', ConditionOperator.IsTrue)],
    ),
    exampleHandOff(
      'complaint_hand_off',
      'Hand the complaint over',
      [-0.5, 5],
      'Complaint: {{complaint.reason}}',
    ),
    exampleSendReply('reply', 'Send the draft', [0.5, 5], 'draft.messages'),
  ],
  edges: [
    link(START, 'together'),
    link('together', 'complaint', PortName.Branches),
    link('together', 'draft', PortName.Branches),
    link('complaint', 'check_failed', PortName.Error),
    link('draft', 'draft_failed', PortName.Error),
    link('together', 'decide'),
    link('decide', 'complaint_hand_off', 'complaint'),
    link('decide', 'reply', PortName.Else),
  ],
};

const replyAndScore: FlowExample = {
  name: 'Reply and score',
  description: 'The reply waits only for the agent; scoring runs in the background.',
  nodes: [
    exampleTrigger([0, 0]),
    exampleParallel('together', 'Answer and score', [0, 1]),
    exampleAgent('answer', 'Answer the question', [-0.5, 2], CAFE_ASSISTANT_PROMPT),
    exampleHandOff(
      'hand_off',
      'Hand off to the team',
      [-1.5, 3],
      'The assistant could not answer.',
    ),
    exampleCompletion('scorer', 'Score the conversation', [0.5, 2], 'Rate the mood and topic.', [
      exampleField('mood', OutputFieldType.Number, 'Mood from 1 (angry) to 5 (happy)'),
      exampleField('topic', OutputFieldType.String, 'The topic in two or three words'),
    ]),
    exampleApiRequest('save_score', 'Save the score', [0.5, 3], {
      method: HttpMethod.Post,
      url: ECHO_POST_URL,
      body: '{"mood": {{scorer.mood}}, "topic": "{{scorer.topic}}"}',
      onFailure: FailureMode.Continue,
    }),
    exampleSendReply('reply', 'Send the answer', [-0.5, 4], 'answer.messages'),
  ],
  edges: [
    link(START, 'together'),
    link('together', 'answer', PortName.Branches),
    link('answer', 'hand_off', PortName.Error),
    backgroundLink('together', 'scorer'),
    link('scorer', 'save_score'),
    link('together', 'reply'),
  ],
};

const lookUpThenAnswer: FlowExample = {
  name: 'Look up, then answer',
  description: 'Two lookups run at the same time; the agent answers with both results.',
  nodes: [
    exampleTrigger([0, 0]),
    exampleParallel('lookups', 'Look up together', [0, 1]),
    exampleApiRequest('bookings', 'Load bookings', [-0.5, 2], {
      method: HttpMethod.Get,
      url: `${ECHO_GET_URL}?customer={{user.name}}&list=bookings`,
      body: null,
      onFailure: FailureMode.Continue,
    }),
    exampleApiRequest('loyalty', 'Load loyalty points', [0.5, 2], {
      method: HttpMethod.Get,
      url: `${ECHO_GET_URL}?customer={{user.name}}&list=loyalty`,
      body: null,
      onFailure: FailureMode.Continue,
    }),
    exampleAgent(
      'answer',
      'Answer with both',
      [0, 3],
      `${CAFE_ASSISTANT_PROMPT} Bookings: {{bookings.body}}. Loyalty points: {{loyalty.body}}.`,
    ),
    exampleSendReply('reply', 'Send the answer', [0, 4], 'answer.messages'),
    exampleHandOff('hand_off', 'Hand off to the team', [1, 4], 'The assistant could not answer.'),
  ],
  edges: [
    link(START, 'lookups'),
    link('lookups', 'bookings', PortName.Branches),
    link('lookups', 'loyalty', PortName.Branches),
    link('lookups', 'answer'),
    link('answer', 'reply'),
    link('answer', 'hand_off', PortName.Error),
  ],
};

const tableBooking: FlowExample = {
  name: 'Table booking',
  description: 'An agent collects the day and guests, then an API request books the table.',
  nodes: [
    exampleTrigger([0, 0]),
    exampleAgent(
      'booking',
      'Collect the booking',
      [0, 1],
      'Find the day and the number of guests.',
      [
        exampleField('date', OutputFieldType.String, 'The day, as YYYY-MM-DD', false),
        exampleField('guests', OutputFieldType.Number, 'How many guests', false),
      ],
    ),
    exampleRouter(
      'check',
      'Has a day?',
      [0, 2],
      [exampleRule('no_date', 'No day yet', 'booking.date', ConditionOperator.IsEmpty)],
    ),
    exampleSendText('ask_day', 'Ask for the day', [-0.5, 3], 'Which day would you like to come?'),
    exampleApiRequest('save_booking', 'Book the table', [0.5, 3], {
      method: HttpMethod.Post,
      url: ECHO_POST_URL,
      body: '{"date": "{{booking.date}}", "guests": "{{booking.guests}}"}',
      onFailure: FailureMode.ErrorPort,
    }),
    exampleSendText(
      'confirm',
      'Confirm the booking',
      [0.5, 4],
      'Your table for {{booking.guests}} is booked on {{booking.date}}.',
      ['Change', 'Cancel'],
    ),
    exampleHandOff('hand_off', 'Hand off to the team', [1.5, 4], 'The booking could not be saved.'),
  ],
  edges: [
    link(START, 'booking'),
    link('booking', 'check'),
    link('booking', 'hand_off', PortName.Error),
    link('check', 'ask_day', 'no_date'),
    link('check', 'save_booking', PortName.Else),
    link('save_booking', 'confirm'),
    link('save_booking', 'hand_off', PortName.Error),
  ],
};

const menuButtons: FlowExample = {
  name: 'Menu buttons',
  description: 'Quick reply buttons lead to fixed answers; anything else goes to the agent.',
  nodes: [
    exampleTrigger([0, 0]),
    exampleRouter(
      'pressed',
      'Which button?',
      [0, 1],
      [
        exampleRule('menu', MENU_BUTTON, 'message.text', ConditionOperator.Eq, MENU_BUTTON),
        exampleRule('hours', HOURS_BUTTON, 'message.text', ConditionOperator.Eq, HOURS_BUTTON),
        exampleRule('person', PERSON_BUTTON, 'message.text', ConditionOperator.Eq, PERSON_BUTTON),
      ],
    ),
    exampleSendText('menu', 'Send the menu', [-1.5, 2], PRICE_LIST, MENU_BUTTONS),
    exampleSendText('hours', 'Send the hours', [-0.5, 2], 'Open daily 8:00–21:00.', MENU_BUTTONS),
    exampleHandOff(
      'hand_off',
      'Hand off to the team',
      [0.5, 2],
      'The customer asked for a person.',
    ),
    exampleAgent('assistant', 'Answer anything else', [1.5, 2], CAFE_ASSISTANT_PROMPT),
    exampleSendReply('reply', 'Send the answer', [1.5, 3], 'assistant.messages', MENU_BUTTONS),
  ],
  edges: [
    link(START, 'pressed'),
    link('pressed', 'menu', 'menu'),
    link('pressed', 'hours', 'hours'),
    link('pressed', 'hand_off', 'person'),
    link('pressed', 'assistant', PortName.Else),
    link('assistant', 'reply'),
    link('assistant', 'hand_off', PortName.Error),
  ],
};

const closeTheChat: FlowExample = {
  name: 'Close the chat',
  description: 'When the customer is done, the chat ends with a goodbye.',
  nodes: [
    exampleTrigger([0, 0]),
    exampleCompletion(
      'finished',
      'Is the customer done?',
      [0, 1],
      'Is the customer saying goodbye?',
      [exampleField('done', OutputFieldType.Boolean, 'The customer has nothing more to ask')],
    ),
    exampleRouter(
      'check',
      'Done?',
      [0, 2],
      [exampleRule('done', 'Done', 'finished.done', ConditionOperator.IsTrue)],
    ),
    exampleEndChat('goodbye', 'End the chat', [-0.5, 3], 'Glad we could help. Have a nice day!'),
    exampleAgent('assistant', 'Keep helping', [0.5, 3], CAFE_ASSISTANT_PROMPT),
    exampleSendReply('reply', 'Send the answer', [0.5, 4], 'assistant.messages'),
    exampleHandOff('hand_off', 'Hand off to the team', [1.5, 4], 'The assistant could not answer.'),
  ],
  edges: [
    link(START, 'finished'),
    link('finished', 'check'),
    link('finished', 'assistant', PortName.Error),
    link('check', 'goodbye', 'done'),
    link('check', 'assistant', PortName.Else),
    link('assistant', 'reply'),
    link('assistant', 'hand_off', PortName.Error),
  ],
};

export const FLOW_EXAMPLES: readonly FlowExample[] = [
  faqAssistant,
  intentRouter,
  complaintCheck,
  replyAndScore,
  lookUpThenAnswer,
  tableBooking,
  menuButtons,
  closeTheChat,
];
