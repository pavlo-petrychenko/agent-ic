# Research: knowledge base ingestion and retrieval

**Status:** research summary, 2026-10-02. Feeds the KB/search design decisions in [architecture.md](../architecture.md).
**Inputs:** four research tracks:
- PageIndex and tree-based retrieval;
- hybrid search in Postgres;
- embeddings, chunking and parsing;
- agent tools, real products and evaluation;

Vendor claims are marked as such. Numbers without a source are estimates.

---

## 1. Approaches compared

| Approach | Per-turn latency | Fits many short docs | Fits long structured docs | Tables / prices | Verdict for us |
|---|---|---|---|---|---|
| Hybrid BM25 + vectors (+ rerank) | ~100–500 ms | Good | OK with parent / section expansion | Good (BM25) | **Core** |
| PageIndex (an LLM walks a table-of-contents tree) | Several serial LLM calls; seconds to tens of seconds | Weak | Strong | Excluded from its own benchmark | **Take the pattern, not the library** |
| RAPTOR (summary trees) | Like vector search | Little benefit | Good | Summaries blur numbers | Skip |
| GraphRAG / LightRAG | Medium; expensive indexing | Overkill | Multi-hop questions only | Weak | Skip |
| Whole KB in the prompt + caching | Low on a cache hit | Good if small | Hits limits | Similar items distract the model | **Small-KB mode, to evaluate** |
| Tree outline + search + read tools (Dust-style) | 1–2 tool rounds | Good | Good | Good | **Core** |

**PageIndex:**
- MIT, Python; 38.5k stars, active.
- Local mode handles text PDFs and Markdown; OCR, folders and MCP are Cloud-only.
- The TS SDK is a Cloud client.
- The FinanceBench 98.7% figure comes from a proprietary product built on it, compared against a 2023 baseline.
- Its own README positions it for long financial and legal reports.

**Industry consensus 2025–2026:** hybrid retrieval (dense + BM25 + rerank) for the core, plus navigation tools (browse, read) for the long tail.
- Anthropic: retrieve some data up front, then let the agent explore.
- Sierra's τ-knowledge benchmark (2026): free-form access is more accurate, structured retrieval is faster, and the best model makes *fewer, more precise* searches.

## 2. Hybrid search in Postgres (must work on CloudNativePG and AWS RDS)

- **Postgres's built-in ranking (`ts_rank`) is not BM25:** it has no IDF and no term saturation.
- **True BM25 extensions exist but none is on RDS / Aurora** (checked 2026-10-02):

| Option | Notes | Self-hosted Postgres (CNPG) | RDS / Aurora | License |
|---|---|---|---|---|
| ParadeDB `pg_search` | The most mature; Tantivy engine, ICU tokenizer | yes | **no** | AGPL-3.0 |
| Tiger Data `pg_textsearch` | Block-Max WAND | yes | no | PostgreSQL |
| VectorChord-bm25 | | yes | no | AGPL / ELv2 |

- **The portable recipe:** BM25 computed **in SQL** from `tsvector` term frequencies, plus `doc_len`, IDF computed per KB, a GIN index and `simple` + `unaccent`. Per-KB IDF is arguably *better* than an extension's IDF computed over all tenants.
- **`pg_trgm`** on titles, names and SKUs handles fuzzy matching. **Gotcha:** it may drop Cyrillic letters under `LC_CTYPE=C`. Create the database with an ICU or `C.UTF-8` locale and check `show_trgm('ціна')`.
- **pgvector** (0.8.7; RDS has 0.8.2; require ≥ 0.8.4 on CNPG, which fixed HNSW corruption during vacuum):
  - `halfvec` storage;
  - pgvector filters *after* the HNSW scan, so a global index loses recall for small tenants;
  - **exact search scoped by `kb_id`** gives 100% recall in milliseconds for KBs up to a few thousand chunks;
  - partial HNSW indexes or partitions only for very large KBs.
- **Fusion:** RRF with k=60, top 30–50 from each list, optionally a third list from trigram matching.
- **Rerankers:**
  - Voyage rerank-2.5: $0.05 per 1M tokens, ≈ $0.0006 per query;
  - Cohere Rerank 4 Fast: $2 per 1k searches;
  - zerank-2: $0.025 per 1M tokens (vendor numbers);
  - self-hosted models (Qwen3 / bge reranker) need a GPU;
  - adds ~100–400 ms (estimate). Intercom Fin runs its own reranker at p50 ≈ 150 ms.
- **Atomic re-sync:** write the new chunks under generation N+1, then flip `sources.active_generation` in one short transaction. Reads filter on the active generation. Delete with `ON DELETE CASCADE`.
- **Outside Postgres** (Qdrant 1.19 with per-tenant IDF, OpenSearch with Lucene morphology) would only be justified at very large single-tenant scale. They break the single-transaction re-sync.

## 3. Ingestion: parsing, chunking, embeddings

**Parsing by source:**
- **Google Docs:** Drive export as `text/markdown`.
- **ClickUp:** v3 pages API with `content_format=text/md`, and `max_page_depth=-1` gives the page tree. Watch for the empty-table-cell bug.
- **MD / TXT:** native.
- **DOCX:** mammoth → HTML → Markdown, mapping heading styles, plus a heuristic for "bold used as heading".
- **PDF** (the hard part):
  - **Phase 1:** a hosted parser. Mistral OCR 4 ($2–4 per 1k pages, Markdown and HTML tables) or Gemini Flash as a vision parser; LlamaParse is the alternative.
  - **Phase 2:** a Docling Python sidecar (MIT, `docling-serve`) with Tesseract `ukr+rus+eng` for scans.
  - Cyrillic quality is **unverified for every tool**, so run a bake-off on 20–30 real PDFs.

**Document model:**
- Canonical Markdown per document.
- A **section tree** from H1–H6 headings: path, level, order, range, token count, hash, optional one-line summary.
- **Chunks never cross section boundaries:**
  - target 300–600 tokens, recursive split, 10–15% overlap inside prose only;
  - tiny sibling sections are merged;
  - a document under ~800 tokens becomes one chunk.
- **Tables:** atomic when under ~1k tokens, otherwise split by groups of rows with the header repeated. Also emit row-level text, e.g. "Section › Service: X | Price: 500 UAH".
- **Text used for both the embedding and BM25** = breadcrumb ("Doc › H2 › H3") + the document's one-line summary + the chunk.
- **Small-to-big:** a matching chunk expands to its parent section (when under ~1.5k tokens) or to the whole small document.

**Contextual retrieval** (Anthropic): −35% retrieval failures with contextual embeddings, −49% when BM25 also sees the context, −67% with a reranker.
- **Always:** the deterministic breadcrumb + summary prefix.
- **Optional:** LLM-written context per chunk for long or ambiguous documents. About $1–3 per 200-doc tenant on Claude Haiku 4.5 with batching and caching; regenerated only for changed sections.
- voyage-context-4 adds the context inside the embedding without LLM calls (vector side only; vendor numbers).

**Embedding models (2026), shortlist:**

| Model | Notes | $ / 1M tokens |
|---|---|---|
| **voyage-4 family** | 256–2048 dims (Matryoshka), 32K input. All sizes share **one vector space**, so we can switch size without re-indexing. Context variant available. No public MMTEB score (vendor RTEB claim). AI SDK via a community provider | 0.02 (lite) / 0.06 / 0.12 (large) |
| **gemini-embedding-2** | MMTEB ≈ 69.9 (Google's own number), 128–3072 dims, 8K input, first-party AI SDK provider, batch discount | 0.20 (batch ≈ 0.10) |
| **Qwen3-Embedding-0.6B / 4B / 8B** | Self-hosted, Apache 2.0, MMTEB 64.3 / 69.5 / 70.6, 32K input, Matryoshka. A GPU is preferred | infra only |
| OpenAI text-embedding-3-small | The cheapest fallback; weaker multilingual quality | 0.02 |

- **The embedding model is a platform setting, not bring-your-own-key:** changing it means re-indexing, and mixing models splits the vector space. BYOK stays for chat models.
- Store **1024 dims as `halfvec`**, with `model_id` stored per vector.

**Operations:**
- Hashes at document, section and chunk level, so only changed sections are re-chunked and re-embedded.
- Embedding cache keyed on (model, dims, sha256(text)).
- Debounce real-time sync by 30–60 s.
- **Wipe protection:** never delete stale documents when a fetch partly failed or returned nothing.
- **Changing the model:** backfill the new vectors in the background, flip a per-tenant read flag, then drop the old ones.
- Typical cost for a full index of one SMB KB (0.5–2M tokens): embedding $0.03–0.25, optional LLM context $1–3, PDF parsing ≈ $0.004 per page; re-syncs ≈ $0.

## 4. Agent access: tools and orchestration

**Reference:** Dust's production filesystem tools are `semantic_search`, `list`, `find`, `cat(nodeId, offset, limit, grep)` and `locate_in_tree`.

**Recommended shape:**
1. **Retrieve before the LLM call on every turn:**
   - build a query from the last 2–3 turns; rewrite it with a small model only when it is anaphoric (e.g. "how much is it?");
   - inject the top results with their ids;
   - add a **cached, compact KB outline** (document titles + one-line summaries + top headings, ≈ 3–15k tokens).

   Most FAQ and price questions then finish in **one LLM call**. Intercom Fin also refines the query before retrieving, and Voiceflow rewrites queries.
2. **Tools for the long tail** (at most 2–3 tool rounds per turn):
   - `search_knowledge(query, path?/doc_ids?, top_k)`: hybrid search, **returns whole small sections or documents** (small-to-big), each with `doc_id`, path and score;
   - `browse_documents(path, depth, title_query?, cursor?)`: a paginated tree, replacing a fixed path enum;
   - `read_document(doc_id, section?, offset, max_tokens, grep?)`: for **large** documents only.
3. **Guard rails:**
   - de-duplicate results already in the conversation;
   - a token budget per tool result;
   - an explicit "nothing found" result that the flow can route to escalation;
   - readable `doc_id`s and citations.
4. **Small-KB mode:** if a tenant's whole KB is under roughly **20–40k tokens**, put it all in the cached prompt and keep `search_knowledge` as a safety net. Evaluate before making it the default: model accuracy drops with long context ("context rot"), and low-traffic tenants miss the 5-minute cache.
5. **Skip in the hot path:** HyDE and multi-query (an extra LLM call each), and semantic answer caching (postpone).

**What leading products do:**
- **Intercom Fin:** refine query → fine-tuned retriever (top 40) → its own ModernBERT reranker (p50 ≈ 150 ms) → top 5–10 → generate → validate.
- **OpenAI File Search:** 800-token chunks, hybrid RRF, a reranker.
- **AWS Bedrock KB:** ~300-token chunks, hierarchical chunking, hybrid, reranking.
- **Glean:** hybrid + rerank + a small planner model.
- **Decagon:** scripted procedures first, RAG as the fallback.

## 5. Evaluation

**Team-level (self-hosted Langfuse):**
- **Datasets:** one per template, plus a global set of 200–500 real questions, including "not in KB" cases.
- **Experiments** through the Langfuse SDK runner.
- **Retrieval metrics:** document-level recall@5 / @10, MRR, nDCG@10, plus deterministic checks (wrong-document hits, size of returned text, how targeted searches were).
- **Answer metrics:** correctness and faithfulness via an LLM judge, calibrated on 50–100 hand-labelled items; correct-refusal rate.
- **Operational metrics:** tool calls per turn, p50 / p95 latency, cost per turn.
- **Online:** sample production traces for a faithfulness judge and feed failures back into the datasets.

**Product-level (user-facing; mostly "Later" in the MVP scope):**
- "Save as test" from the playground, the simulator and chats;
- "this doc should have been found" in the retrieval playground;
- "Run tests" with a judge verdict and a diff against the last run (Fin batch tests and Decagon simulations are the references).

## 6. Latency budget per turn (estimates)

| Step | Time |
|---|---|
| Query embedding | 50–150 ms |
| Hybrid SQL over one tenant | < 50 ms |
| Rerank | 100–200 ms |
| Query rewrite (only when needed) | ~300 ms |
| LLM call | 1–2 s |
| Each additional tool round | +1–2 s |

That gives a p95 under ~5 s with at most 2 tool rounds. Telegram shows "typing…" in the meantime.

## 7. Main sources

- Anthropic, *Contextual Retrieval* (2024-09-19); *Effective context engineering for AI agents* (2025-09-29); *Writing tools for agents* (2025-09-11).
- PageIndex: github.com/VectifyAI/PageIndex; the OSS benchmark repo; Mafin 2.5 FinanceBench.
- pgvector CHANGELOG / README; ParadeDB docs; github.com/timescale/pg_textsearch; VectorChord-bm25; PostgreSQL text-search docs.
- Voyage docs and blog (voyage-4, Jan 2026; voyage-context-4, Jun 2026); Gemini embeddings docs and the Gemini Embedding 2 paper; the Qwen3-Embedding model card.
- Mistral OCR 4 (Jun 2026); LlamaIndex ParseBench (Apr 2026); Docling.
- Intercom Fin research blog (reranker, retrieval fine-tuning, 2025-09); Dust source and changelog (Nov 2025); Sierra τ-knowledge (2026-03, 2026-05); Glean Waldo (2026-04); AWS Bedrock KB chunking docs; Gemini File Search docs.
- LlamaIndex, *Did filesystem tools kill vector search* (2026-01-13); Cursor, *semantic search* (2025-11-06).
