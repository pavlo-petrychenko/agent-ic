import { INVALID_TEMPLATE_KNOWLEDGE_BASE_WRITER_MESSAGE } from '@/modules/agents/constants/agent-template.constants';

export class InvalidTemplateKnowledgeBaseWriterError extends Error {
  constructor() {
    super(INVALID_TEMPLATE_KNOWLEDGE_BASE_WRITER_MESSAGE);
    this.name = new.target.name;
  }
}
