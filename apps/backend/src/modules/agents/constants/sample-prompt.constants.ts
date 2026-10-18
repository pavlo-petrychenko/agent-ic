import type { SamplePromptDefinition } from '@/modules/agents/typedefs/sample-prompt.typedefs';

export enum SamplePromptKey {
  CafeAssistant = 'cafe_assistant',
  IntentSort = 'intent_sort',
  BookingHelper = 'booking_helper',
  BookingDetails = 'booking_details',
  ComplaintCheck = 'complaint_check',
  MoodScorer = 'mood_scorer',
  GoodbyeCheck = 'goodbye_check',
  LookUpAnswer = 'look_up_answer',
}

export const SAMPLE_PROMPT_FOLDER_NAME = 'Café';

export const SAMPLE_PROMPT_NOTE = 'Added with the demo seed';

const CAFE_ASSISTANT =
  'You are the assistant of Kavarnia, a cosy café in Lviv. Answer briefly and kindly.';

export const SAMPLE_PROMPTS: Readonly<Record<SamplePromptKey, SamplePromptDefinition>> = {
  [SamplePromptKey.CafeAssistant]: { name: 'Café assistant', text: CAFE_ASSISTANT },
  [SamplePromptKey.IntentSort]: { name: 'Intent sort', text: 'Sort the message.' },
  [SamplePromptKey.BookingHelper]: { name: 'Booking helper', text: 'Help the guest book a table.' },
  [SamplePromptKey.BookingDetails]: {
    name: 'Booking details',
    text: 'Find the day and the number of guests.',
  },
  [SamplePromptKey.ComplaintCheck]: { name: 'Complaint check', text: 'Is this a complaint?' },
  [SamplePromptKey.MoodScorer]: { name: 'Mood and topic scorer', text: 'Rate the mood and topic.' },
  [SamplePromptKey.GoodbyeCheck]: {
    name: 'Goodbye check',
    text: 'Is the customer saying goodbye?',
  },
  [SamplePromptKey.LookUpAnswer]: {
    name: 'Look-up answers',
    text: `${CAFE_ASSISTANT} Bookings: {{bookings.body}}. Loyalty points: {{loyalty.body}}.`,
  },
};
