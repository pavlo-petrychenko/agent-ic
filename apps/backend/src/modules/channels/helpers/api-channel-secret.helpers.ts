import {
  API_CHANNEL_SECRET_MASK_CHARACTER,
  API_CHANNEL_SECRET_VISIBLE_PREFIX,
  API_CHANNEL_SECRET_VISIBLE_SUFFIX,
} from '@/modules/channels/constants/api-channel.constants';

export const apiChannelSecretHint = (secret: string): string => {
  const hiddenLength =
    secret.length - API_CHANNEL_SECRET_VISIBLE_PREFIX - API_CHANNEL_SECRET_VISIBLE_SUFFIX;
  if (hiddenLength <= 0) {
    return API_CHANNEL_SECRET_MASK_CHARACTER.repeat(secret.length);
  }
  return `${secret.slice(0, API_CHANNEL_SECRET_VISIBLE_PREFIX)}${API_CHANNEL_SECRET_MASK_CHARACTER.repeat(hiddenLength)}${secret.slice(-API_CHANNEL_SECRET_VISIBLE_SUFFIX)}`;
};
