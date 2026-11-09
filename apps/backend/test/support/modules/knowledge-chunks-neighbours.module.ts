import { KnowledgeChunksReader } from '@/modules/usage';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import { FakeKnowledgeChunksReader } from '@test/support/fakes/fake-knowledge-chunks-reader.fake';

export class KnowledgeChunksNeighboursModule extends defineModule({
  global: true,
  providers: [
    FakeKnowledgeChunksReader,
    { provide: KnowledgeChunksReader, useExisting: FakeKnowledgeChunksReader },
  ],
  exports: [FakeKnowledgeChunksReader, KnowledgeChunksReader],
}) {}
