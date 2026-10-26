interface TelegramSuccess<TResult> {
  readonly ok: true;
  readonly result: TResult;
}

interface TelegramFailure {
  readonly ok: false;
  readonly error_code: number;
  readonly description?: string;
  readonly parameters?: {
    readonly retry_after?: number;
  };
}

export type TelegramResponse<TResult> = TelegramSuccess<TResult> | TelegramFailure;

export interface TelegramMeResponse {
  readonly id: number;
  readonly is_bot: boolean;
  readonly first_name: string;
  readonly username: string;
}

export interface TelegramWebhookInfoResponse {
  readonly url: string;
  readonly pending_update_count: number;
  readonly last_error_date?: number;
  readonly last_error_message?: string;
}

export interface TelegramChatResponse {
  readonly id: number;
}

export interface TelegramUserResponse {
  readonly id?: number;
  readonly first_name?: string;
}

export interface TelegramMessageResponse {
  readonly message_id: number;
  readonly date: number;
  readonly text?: string;
  readonly chat: TelegramChatResponse;
  readonly from?: TelegramUserResponse;
}

export interface TelegramUpdateResponse {
  readonly update_id: number;
  readonly message?: TelegramMessageResponse;
}
