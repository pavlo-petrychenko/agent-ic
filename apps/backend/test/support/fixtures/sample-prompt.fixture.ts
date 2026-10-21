import { SamplePromptKey } from '@/modules/agents/constants/sample-prompt.constants';
import type { SamplePromptRefs } from '@/modules/agents/typedefs/sample-prompt.typedefs';

export const samplePromptRefs = (): SamplePromptRefs => ({
  [SamplePromptKey.CafeAssistant]: 'prm_cafe_assistant',
  [SamplePromptKey.IntentSort]: 'prm_intent_sort',
  [SamplePromptKey.BookingHelper]: 'prm_booking_helper',
  [SamplePromptKey.BookingDetails]: 'prm_booking_details',
  [SamplePromptKey.ComplaintCheck]: 'prm_complaint_check',
  [SamplePromptKey.MoodScorer]: 'prm_mood_scorer',
  [SamplePromptKey.GoodbyeCheck]: 'prm_goodbye_check',
  [SamplePromptKey.LookUpAnswer]: 'prm_look_up_answer',
});
