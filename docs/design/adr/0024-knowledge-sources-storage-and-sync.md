# 0024. Knowledge sources, storage and sync

- **Status:** Accepted; refines 0011
- **Date:** 2026-10-23
- **Refines:** [0011](0011-knowledge-base-and-retrieval.md): sources, storage, sync, per-document generations, agent tools and the lexical index. Retrieval quality decisions of 0011 (hybrid search, section expansion, no global HNSW, RRF) still stand.

## Context

ADR 0011 designed the retrieval core before the first knowledge screen existed. The MVP now needs concrete answers for four things it left open or assumed too broadly:

- **Which sources ship.** Uploads and Google Docs are in. ClickUp and real-time change notifications are out of the MVP.
- **What Google access is realistic.** Google classifies Drive scopes by sensitivity. `drive.readonly` is restricted: it needs restricted-scope verification, a CASA Tier 2 security assessment and an annual reassessment. `drive.file` is non-sensitive and works with Google Picker, but a folder picked with `drive.file` grants access to the folder itself, not its children. Folder-wide import therefore cannot ship without the restricted scope.
- **Where uploads live and who handles them.** A 20 MB file cannot travel through the GraphQL API and be parsed in the request. The API needs a handshake, object storage needs a layout, and indexing needs a durable worker.
- **What the agent is allowed to do.** The product decision is that an agent must search with a natural-language question, not browse or read the whole knowledge base.

Three constraints shape the rest:

- one Postgres and one object store; no second search engine in the MVP;
- must run on CloudNativePG now and AWS RDS later, where BM25 extensions such as ParadeDB `pg_search` are unavailable;
- Ukrainian and English corpora, a few seconds per chat turn and a low cost per KB.

## Decision

### Sources

- Source kinds: **upload** and **Google Docs**. ClickUp, Notion, pages written on the platform and custom API sources are later.
- One source per “Add source” action: an upload is one file; one Google Picker selection is one source that may contain several Google Docs. The source is the unit with a status, sync settings, re-sync and delete. Documents inside it are the unit of indexing.
- Uploads accept PDF, DOCX, TXT and MD, up to 20 MB. PDFs are text-layer only; scanned PDFs fail with a reason. Uploads do not sync; replacing the file creates a new generation and the old version stays searchable until the flip.
- Google Docs uses `drive.file` and Google Picker, with `openid` and `email` for the account identity. Users pick individual documents. Folder import, Drive-wide access and real-time notifications are out of the MVP.
- Google access is a workspace-level connection: a sealed refresh token, the account email and subject, a status and a last error. A revoked token turns the connection `revoked`; the sources become `error` and ask for a reconnect.
- Sync modes: **one-time**, **manual** and **scheduled** (hourly, daily or weekly at a time in the workspace timezone). Real-time is dropped.

### Upload path

- The browser asks the API for a presigned PUT, uploads directly to S3/Silo, then confirms.
- The API never receives the file bytes. It creates a short-lived upload ticket, generates the document id, validates the object with a `HEAD`, copies it server-side to its permanent key and enqueues the ingestion.
- The original upload and the canonical Markdown are both kept in object storage. The original is the user's file; the Markdown is enough to re-chunk and re-embed later.
- A bucket lifecycle rule removes abandoned temporary uploads after 24 hours.

### Ingestion and generations

- Pipeline: fetch → parse → canonical Markdown → section tree → chunks → a one-time summary → embed → BM25 terms → write generation N+1 → flip.
- Chunks never cross headings; 300–600 tokens; 10–15% overlap inside prose; tables atomic or split by row groups with the header repeated.
- The embedding and BM25 text is the document title, section breadcrumb, document summary and chunk.
- A document gets one summary at its first successful index: a light model reads the full canonical Markdown and returns one sentence. The document stores `summary_source` (`auto` or `user`) and `summary_updated_at`.
- Scheduled and manual re-syncs never regenerate a summary. A failed summary is retried only while it is still null. A replacement upload keeps the summary.
- The user can edit the summary; a user edit is never overwritten. Because the summary is in every chunk's `index_text`, an edit enqueues a document re-index and flips a new generation. The UI labels the summary as AI-generated once, says it is not updated automatically, and explains the re-index.
- Embeddings are cached by `(workspace, model, dimensions, text hash)`. A re-sync embeds only changed chunks.
- **Generation is per document, not per source.** A Google source can hold many documents; one failed document must not block the others. Search joins `chunks.generation = documents.active_generation`, and the flip is one short transaction. Old results remain searchable until it commits.
- The source status aggregates its documents and the last sync run. Progress comes from the `sync_runs` counters, not from polling a worker.

### Storage

- New platform module `storage`: an abstract `FileStorage` gateway with an S3/Silo implementation and a fake, two clients (internal endpoint for workers, public endpoint for presigned browser URLs), and explicit S3 config validated by zod.
- One bucket with workspace-scoped keys for temporary uploads, retained originals and canonical Markdown.

### Schema

- Every reference is a foreign key, as ADR 0022 requires: `workspace_id` cascades from `identity.workspaces`; ownership and composite keys cascade; `created_by_user_id` pointers set null; `sources.connection_id` restricts while a source exists. Every foreign key has an index that starts with its columns.
- `sections.kb_id`, `chunks.kb_id` and `chunk_terms.kb_id` stay denormalized for filtering, but reference `knowledge_bases(workspace_id, id)`.
- CORS on the bucket allows `PUT`, `GET` and `HEAD` from the web origin.

### Retrieval and agent tools

- The agent gets **one `search_knowledge` tool per attached KB**, using the KB's editable tool name and description. It takes a natural-language question and an optional `top_k`.
- No `browse_documents`, no `read_document`, no whole-KB prompt and no small-KB mode. The agent answers from the returned sections.
- `RetrievalMode.Auto` stays in the flow schema but is not implemented in the MVP; the builder does not offer it. A flow that carries it is treated as `Tools` until the automatic path is built.
- Retrieval fuses three lists with RRF (`k = 60`):
  - exact vector search scoped to the KB (`halfvec`, 1024 dims, no global HNSW);
  - **true BM25** over a `chunk_terms` table (term, frequency per chunk), with per-KB `N` and `avgdl`, `k1 = 1.2`, `b = 0.75`;
  - `pg_trgm` on document titles.
- The BM25 text is tokenized in the application with one tokenizer shared by ingestion and query: NFKC, lowercase, strip diacritics, split on letters and numbers. Postgres `tsvector` is not used for scoring because it does not expose term frequency in a usable form; `chunk_terms` makes exact BM25 portable to RDS.
- Results are grouped and expanded to whole sections when the section is small, capped by tokens, and deduplicated.
- The retrieval playground uses the same service as the tool and shows ranked sections with sources and scores.

### Deletion and safety

- Deleting a KB is blocked while any current agent draft or live version references it. The module returns the usages, like prompts.
- The flow package gains `knowledgeBaseReferences` and `MissingKnowledgeBase`; a `KnowledgeFlowReferenceChecker` validates references on publish and in the publish preview.
- Deletes are soft (`deleted_at`) and a durable cleanup job removes S3 objects and then hard-deletes rows.
- Disconnecting a Google account is blocked while sources use it.
- The workspace deletion event cleans up knowledge files, like prompts.

## Consequences

- Google Docs ships without a six-week restricted-scope review and an annual security assessment. The cost is no folder import and no Drive-wide sync; users pick documents explicitly, and adding more documents is another “Add source”.
- Uploads are fast and do not load the API. The cost is a more complex handshake (ticket, head, copy) and an object-storage CORS/lifecycle setup.
- Per-document generations make a multi-document Google source robust; a single broken doc cannot block the rest and search never sees a half-index.
- One full-document summary per new document bounds the LLM cost: daily re-syncs do not call the summary model, and a user edit costs a re-index rather than another summary call. The trade-off is that the summary can go stale until the user edits it, which the UI states explicitly.
- True BM25 gives keyword quality without an extension, but `chunk_terms` adds significant write amplification. The mitigations are corpus-stat caching, capping terms and a different lexical engine behind the retriever if a large tenant makes it necessary.
- Search-only tools keep prompt size and cost predictable, but the agent cannot open a long document that search did not surface. That is an accepted MVP limitation.
- The design still needs an evaluation set: chunk sizes, RRF weights and the retrieval tool description are chosen by manual testing until then.
- The Google OAuth consent screen must be published, not left in testing mode, or refresh tokens expire after seven days.
- The knowledge module now depends on a new `platform/storage` module and on `@agent-ic/flow` additions; both are prerequisites for the first source.

## Alternatives considered

- **`drive.readonly` and folder import.** It matches the original “pick documents or a folder” idea, but restricted-scope verification plus CASA is too much for the MVP and would delay the whole knowledge module. It remains the path if folder sync becomes a product requirement.
- **Google Workspace domain-wide delegation.** Clean folder access for Workspace domains, but it excludes consumer Gmail accounts, which is most of the target market.
- **Service account with a shared folder.** Works without the restricted scope but requires the user to share a folder with a robot address and creates cross-tenant discovery risks.
- **ClickUp and real-time sync.** Both add a second connector contract and webhook infrastructure before the core is proven. Scheduled sync covers the need in the MVP.
- **Uploading through the API.** Simpler handshake, but holds API memory and request time for large files, competes with dashboard traffic and gives a worse failure surface.
- **Source-level generation.** Simpler in the original ADR, but a Google source with five documents would either expose a half-updated source or block all five when one fails. Per-document generation fixes that.
- **BM25 over `tsvector`.** No true IDF or saturation, and extracting term frequency from a `tsvector` is convoluted and slow. A term-frequency table is explicit, portable and testable.
- **A global HNSW index.** pgvector filters after the index scan, so recall drops for small tenants. Exact search scoped to the KB is both simpler and more accurate at MVP scale.
- **Browse/read tools and whole-KB prompts.** They improve the long tail but make cost and prompt size unpredictable and contradict the product decision to search, not browse. They can return later behind a per-agent toggle.
- **Qdrant or OpenSearch.** A second stateful store breaks the single-transaction generation flip and adds operations for no MVP benefit.
