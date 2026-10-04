# 0011. Knowledge base ingestion and retrieval

- **Status:** Accepted
- **Date:** 2026-10-02
- **Research:** [docs/research/knowledge-retrieval.md](../research/knowledge-retrieval.md)

## Context
- Answering from the business's own documents is the core of the product, so it can't be designed carelessly just because this is an MVP.
- **Corpora:** per tenant, tens to a few hundred documents (FAQs, price tables, services, policies) from uploads, Google Docs and ClickUp. Ukrainian and English, though Ukrainian-specific tuning is not a requirement.
- **Constraints:** a few seconds per chat turn; low cost; must run on CloudNativePG now and AWS RDS later.
- **Industry pattern:** hybrid search at the core (Intercom Fin, OpenAI File Search, Bedrock) plus navigation tools for the long tail (Dust).
- PageIndex-style tree reasoning is too slow per turn and aimed at long financial reports.

## Decision

**Document model and ingestion:**
- Canonical Markdown per document → a **section tree** from headings → **chunks that never cross sections**.
- Tables are kept whole, plus one line of text per row.
- Embedding and BM25 text = "Doc › H2 › H3" breadcrumb + a one-line document summary (one cheap LLM call per document) + the chunk.
- No per-chunk LLM context for now.
- **Parsers sit behind `DocumentParser`:**
  - Google Docs → Markdown export;
  - ClickUp → v3 pages API with Markdown + page tree;
  - MD / TXT native;
  - DOCX → mammoth → Markdown;
  - **PDF: text layer only** (scanned PDFs rejected with a reason); a vision / OCR parser plugs in later.
- **Incremental sync:**
  - hashes at document, section and chunk level;
  - an embedding cache keyed on (model, dims, text hash);
  - wipe protection when a fetch fails partway;
  - real-time sync debounced.
- **Atomic re-sync:** new chunks are written under generation N+1, then `active_generation` flips in one transaction.

**Index (Postgres, portable to RDS):**
- **BM25 computed in SQL** over `tsvector` (`simple` + `unaccent`), with IDF per knowledge base.
- **pgvector exact search scoped to the agent's KBs** (`halfvec`, 1024 dims; no global HNSW, partial indexes only for very large KBs).
- **`pg_trgm`** on titles, names and SKUs.
- The three lists are merged with **RRF (k=60)**, then **expanded to the whole section or small document**.
- The database is created with an ICU or `C.UTF-8` locale so `pg_trgm` handles Cyrillic.
- Everything sits behind a `Retriever` abstraction, so `pg_search` or Qdrant can replace parts of it later.

**Embeddings:**
- `jina-embeddings-v5-text-small` through **LLMAPI** (our LLM provider; AI SDK OpenAI-compatible provider, `https://api.llmapi.ai/v1`).
- **Verified on 2026-10-02:**
  - `dimensions` passes through;
  - ~120 ms per query embedding;
  - LLMAPI **drops Jina's `task` parameter** (query vs passage modes), so all text uses one default mode.

  We accept this for now and ask LLMAPI to support `task`; when it does, KBs are re-indexed in the background.
- The model and dims are stored **per KB**, so customers can bring their own embedding model later.

**Agent access:**
- **Tools:**
  - `search_knowledge(query, path?/doc_ids?, top_k)`: returns whole small sections or documents, with ids, paths and scores;
  - `browse_documents(path, depth, title_query?, cursor?)`: the document tree, paginated;
  - `read_document(doc_id, section?, offset, max_tokens, grep?)`: for large documents.
- **Retrieval mode per Agent step:**
  - **default: the agent decides** (it searches through tools);
  - option: automatic search before every reply, skipped for greetings and very short messages.
- **Guard rails:**
  - at most 2–3 tool rounds per turn;
  - results already in the conversation are de-duplicated;
  - a token budget per tool result;
  - an explicit "nothing found" result the flow can route to escalation.

**Rerank:** a pluggable stage, **off by default**: `none` · `llm-listwise` (small model via LLMAPI) · `jev` (to evaluate) · later Voyage / Cohere / a self-hosted cross-encoder. It always falls back to RRF.

**Toggles:**
- Every stage is a toggle with a safe default.
- Layered: platform defaults → workspace flags (ours) → Agent step settings.
- Builders see only the safe ones: retrieval mode, and whether whole documents may be read.

**Evaluation:** deferred past the MVP. Langfuse traces every run, so datasets and experiments can be added later.

## Consequences
- One database and one transaction for re-sync, deletes and joins (e.g. "which source answered").
- Nothing new to operate. The same code runs on the homeserver and on RDS.
- The agent can see structure and read whole documents without the latency of tree reasoning.
- **BM25 in SQL** scans the tenant's rows: fast for thousands of chunks, slower for 100k+. Ukrainian gets no stemming; `pg_trgm` and embeddings make up for it.
- **Product and design impact:**
  - the Agent step inspector gets a retrieval-mode control;
  - the retrieval playground shows sections or documents, not only the "top 3 chunks";
  - scanned PDFs are rejected in the MVP.
- **Without evaluations,** defaults and toggles are chosen by manual testing. That is a known risk; tracing keeps the door open.

## Alternatives considered
- **PageIndex as the retriever:** several serial LLM calls per turn (seconds to tens of seconds); Python only; vendor-run benchmarks on long PDFs with tables excluded. **We take its pattern instead:** a tree plus read tools.
- **RAPTOR, GraphRAG / LightRAG:** expensive indexing and built for multi-hop questions. Our questions are single-hop lookups.
- **ParadeDB `pg_search` now:** a better tokenizer, fuzzy matching and scaling, but it isn't on RDS (we'd have to self-manage Postgres on AWS), and its IDF is computed across all tenants.
- **Qdrant / OpenSearch:** a second stateful store; breaks the single-transaction re-sync.
- **A global HNSW index:** pgvector filters after the index scan, so recall suffers for small tenants.
- **Automatic search as the default:** saves one LLM round on real questions. The team chose "agent decides" as the default and kept automatic search as an option.
- **Rerankers that are on from the start:** a second provider, plus latency, before evaluations show a gain.
- **A hosted OCR or vision parser for PDFs now:** deferred; a parser can be added behind the abstraction.
