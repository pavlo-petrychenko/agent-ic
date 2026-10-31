import { z } from 'zod';
import {
  API_CHANNEL_TEXT_MAX_LENGTH,
  API_CHANNEL_USER_ID_MAX_LENGTH,
} from '@/modules/channels/constants/api-channel.constants';

export const apiChannelMessageInputSchema = z.object({
  user_id: z.string().trim().min(1).max(API_CHANNEL_USER_ID_MAX_LENGTH),
  text: z.string().trim().min(1).max(API_CHANNEL_TEXT_MAX_LENGTH),
});
