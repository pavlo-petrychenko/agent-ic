import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import {
  KNOWLEDGE_SEARCH_BM25_B,
  KNOWLEDGE_SEARCH_BM25_K1,
  KNOWLEDGE_SEARCH_TRIGRAM_THRESHOLD,
} from '@/modules/knowledge/constants/knowledge-search.constants';
import type { KnowledgeSourceKind } from '@/modules/knowledge/constants/knowledge.constants';
import type { KnowledgeSearchCandidate } from '@/modules/knowledge/typedefs/knowledge-search.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

interface SearchRow extends Record<string, unknown> {
  readonly chunk_id: string;
  readonly chunk_ordinal: number;
  readonly section_id: string;
  readonly document_id: string;
  readonly document_title: string;
  readonly source_id: string;
  readonly source_title: string;
  readonly source_kind: string;
  readonly path: string;
  readonly content: string;
  readonly token_count: number;
  readonly section_token_count: number;
  readonly url: string | null;
}

const CANDIDATE_COLUMNS = sql`
  c.id AS chunk_id,
  c.ordinal AS chunk_ordinal,
  c.section_id,
  c.document_id,
  d.title AS document_title,
  d.source_id,
  s.title AS source_title,
  s.kind::text AS source_kind,
  sec.path,
  c.content,
  c.token_count,
  sec.token_count AS section_token_count,
  d.source_url AS url
`;

const CANDIDATE_JOINS = sql`
  JOIN knowledge.sections sec
    ON sec.workspace_id = c.workspace_id AND sec.id = c.section_id
  JOIN knowledge.documents d
    ON d.workspace_id = c.workspace_id AND d.id = c.document_id
  JOIN knowledge.sources s
    ON s.workspace_id = d.workspace_id AND s.id = d.source_id
`;

const candidateWhere = (
  workspaceId: string,
  knowledgeBaseId: string,
  model: string,
  dimensions: number,
): SQL => sql`
  c.workspace_id = ${workspaceId}
  AND c.kb_id = ${knowledgeBaseId}
  AND c.generation = d.active_generation
  AND sec.generation = c.generation
  AND c.embedding_model = ${model}
  AND c.embedding_dimensions = ${dimensions}
  AND d.deleted_at IS NULL
  AND s.deleted_at IS NULL
`;

const toCandidate = (row: SearchRow): KnowledgeSearchCandidate => ({
  chunkId: row.chunk_id,
  chunkOrdinal: row.chunk_ordinal,
  sectionId: row.section_id,
  documentId: row.document_id,
  documentTitle: row.document_title,
  sourceId: row.source_id,
  sourceTitle: row.source_title,
  sourceKind: row.source_kind as KnowledgeSourceKind,
  path: row.path,
  content: row.content,
  tokenCount: row.token_count,
  sectionTokenCount: row.section_token_count,
  url: row.url,
});

@Injectable()
export class KnowledgeSearchRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async vectorCandidates(
    workspaceId: string,
    knowledgeBaseId: string,
    model: string,
    dimensions: number,
    embedding: readonly number[],
    limit: number,
  ): Promise<KnowledgeSearchCandidate[]> {
    const { rows } = await this.txHost.tx.execute<SearchRow>(sql`
      WITH query AS (
        SELECT ${JSON.stringify(embedding)}::halfvec(${sql.raw(String(dimensions))}) AS embedding
      )
      SELECT ${CANDIDATE_COLUMNS}
      FROM knowledge.chunks c
      CROSS JOIN query
      ${CANDIDATE_JOINS}
      WHERE ${candidateWhere(workspaceId, knowledgeBaseId, model, dimensions)}
      ORDER BY c.embedding <=> query.embedding, c.ordinal ASC, c.id ASC
      LIMIT ${limit}
    `);
    return rows.map(toCandidate);
  }

  async bm25Candidates(
    workspaceId: string,
    knowledgeBaseId: string,
    model: string,
    dimensions: number,
    terms: readonly string[],
    limit: number,
  ): Promise<KnowledgeSearchCandidate[]> {
    if (terms.length === 0) {
      return [];
    }
    const { rows } = await this.txHost.tx.execute<SearchRow>(sql`
      WITH active AS (
        SELECT c.id, c.token_count
        FROM knowledge.chunks c
        ${CANDIDATE_JOINS}
        WHERE ${candidateWhere(workspaceId, knowledgeBaseId, model, dimensions)}
      ),
      stats AS (
        SELECT
          COUNT(*)::float8 AS n,
          COALESCE(AVG(token_count), 0)::float8 AS avgdl
        FROM active
      ),
      query_terms AS (
        SELECT DISTINCT value AS term
        FROM jsonb_array_elements_text(${JSON.stringify(terms)}::jsonb)
      ),
      df AS (
        SELECT ct.term, COUNT(*)::float8 AS df
        FROM knowledge.chunk_terms ct
        JOIN active a ON a.id = ct.chunk_id
        JOIN query_terms t ON t.term = ct.term
        WHERE ct.workspace_id = ${workspaceId} AND ct.kb_id = ${knowledgeBaseId}
        GROUP BY ct.term
      ),
      scored AS (
        SELECT
          ct.chunk_id,
          SUM(
            LN(1 + (stats.n - df.df + 0.5) / (df.df + 0.5)) *
            (ct.frequency::float8 * (${KNOWLEDGE_SEARCH_BM25_K1}::float8 + 1)) /
            (
              ct.frequency::float8 +
              ${KNOWLEDGE_SEARCH_BM25_K1}::float8 *
              (1 - ${KNOWLEDGE_SEARCH_BM25_B}::float8 + ${KNOWLEDGE_SEARCH_BM25_B}::float8 * (a.token_count::float8 / NULLIF(stats.avgdl, 0)))
            )
          ) AS score
        FROM knowledge.chunk_terms ct
        JOIN active a ON a.id = ct.chunk_id
        JOIN query_terms t ON t.term = ct.term
        JOIN df ON df.term = ct.term
        CROSS JOIN stats
        WHERE ct.workspace_id = ${workspaceId} AND ct.kb_id = ${knowledgeBaseId}
        GROUP BY ct.chunk_id
      )
      SELECT ${CANDIDATE_COLUMNS}
      FROM scored
      JOIN knowledge.chunks c
        ON c.workspace_id = ${workspaceId} AND c.id = scored.chunk_id
      ${CANDIDATE_JOINS}
      WHERE ${candidateWhere(workspaceId, knowledgeBaseId, model, dimensions)}
      ORDER BY scored.score DESC, c.ordinal ASC, c.id ASC
      LIMIT ${limit}
    `);
    return rows.map(toCandidate);
  }

  async trigramCandidates(
    workspaceId: string,
    knowledgeBaseId: string,
    model: string,
    dimensions: number,
    query: string,
    limit: number,
  ): Promise<KnowledgeSearchCandidate[]> {
    const { rows } = await this.txHost.tx.execute<SearchRow>(sql`
      WITH search_query AS (
        SELECT ${query}::text AS query_text
      )
      SELECT ${CANDIDATE_COLUMNS}
      FROM knowledge.chunks c
      CROSS JOIN search_query
      ${CANDIDATE_JOINS}
      WHERE ${candidateWhere(workspaceId, knowledgeBaseId, model, dimensions)}
        AND similarity(d.title, search_query.query_text) > ${KNOWLEDGE_SEARCH_TRIGRAM_THRESHOLD}
      ORDER BY similarity(d.title, search_query.query_text) DESC, c.ordinal ASC, c.id ASC
      LIMIT ${limit}
    `);
    return rows.map(toCandidate);
  }
}
