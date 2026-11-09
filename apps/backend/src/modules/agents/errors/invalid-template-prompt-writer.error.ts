import { INVALID_TEMPLATE_PROMPT_WRITER_MESSAGE } from '@/modules/agents/constants/agent-template.constants';

export class InvalidTemplatePromptWriterError extends Error {
  constructor() {
    super(INVALID_TEMPLATE_PROMPT_WRITER_MESSAGE);
    this.name = new.target.name;
  }
}
