import { TEMPLATE_KNOWLEDGE_BASE_WRITER_COUNT_MESSAGE } from '@/modules/agents/constants/agent-template.constants';

export class TemplateKnowledgeBaseWriterCountError extends Error {
  constructor() {
    super(TEMPLATE_KNOWLEDGE_BASE_WRITER_COUNT_MESSAGE);
    this.name = new.target.name;
  }
}
