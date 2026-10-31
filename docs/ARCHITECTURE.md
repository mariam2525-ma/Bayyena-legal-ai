# System Architecture & Database Schema — Muhkam (مُحكَم) `v1.1.1`

> **نطاق Supabase في هذه الحزمة:** الكود ومخطط SQL فقط. استُبعد ملف صفوف المعرفة `database/03-bayyena_knowledge_rows.sql` من الملفات الحالية وتاريخ Git؛ أي وصف قديم لـ141 مقطعًا يخص المصدر السابق وليس بيانات موجودة في هذا التسليم. أُحدث اختبار جرد الملفات ليؤكد وجود ملفات SQL الثلاثة وغياب صفوف البيانات، ولم يُحذف أو يُخفف أي اختبار وظيفي أو XSS.


> **تحديث توثيق التسليم:** الاسم الحالي للمساعد هو «محكم». المعرف `bayyena_knowledge` تقني داخلي. هذه لقطة المصدر v1.1.1، وليست نسخة مثبتة التطابق مع النشر الحالي. البحث معطّل في كود هذه اللقطة؛ مفاتيحه مفعّلة في الموقع الحي وتؤكد المالكة عمله، ولم يُرسل استعلام مستقل في المراجعة. لا يُعد فرق النسخة عطلًا حيًا. ملف `database/01-schema.sql` مسودة مُعاد بناؤها بأنواع وسياسات مستنتجة، وليس مخطط Supabase معتمدًا؛ لا يُنفذ على قاعدة حية قبل المقارنة واعتماد المالك. تعريفات CI/النشر ملفات مصدر، لا دليل تشغيل سحابي.


## 1. High-Level Architecture
Muhkam is a serverless, cloud-native Arabic Legal AI platform built on a 3-tier architecture offering **4 core services** (**Contract Review**, **Contract Drafting**, **Legal Research**, **Contract Translation**) plus the **Muhkam Legal Assistant (مساعد محكم)**:
1. **Presentation Layer (Static Modular Frontend):** Hosted on Vercel (`https://mohakem-contract-platform.vercel.app/`). Built with semantic HTML5 (`dir="rtl"`, `lang="ar"`), custom CSS design tokens (5 colour palettes / Light & Dark modes), and 10 ordered JavaScript modules (`js/00-errlog.js` to `js/09-bootstrap.js`). Displays a prominent academic trial warning banner (`#trialBanner`) instructing users not to upload real personal data.
2. **AI Orchestration Layer (n8n Cloud — 8 Workflows):** **8 specialized workflows** (`n8n/01-support-desk.json` through `n8n/08-web-search.json`) integrating **Google Gemini 3.1 Flash-Lite / Gemini Flash OCR** and **Embeddings (`1536`-dim)** for contract review, contract drafting, legal research, hybrid translation, Muhkam RAG chat, support triage, document ingestion, and conditional external web search.
3. **Data & Identity Layer (Supabase PostgreSQL + `pgvector`):** Manages JWT authentication, Row-Level Security (RLS) user tables (`history`, `review_jobs`, `support_tickets`), and the **Muhkam Knowledge Base** (`bayyena_knowledge`) indexed with HNSW cosine similarity.

## 2. Frontend Modules (`js/`)
Classic scripts loaded in deterministic numerical order (compatible with both HTTP servers and direct `file://` execution):

| Module | Responsibility |
|---|---|
| `js/config.js` | Central configuration: n8n webhook URLs (`WH`) and Supabase URL + publishable key (`AUTH`) |
| `js/00-errlog.js` | Captures recent runtime/console errors to attach as diagnostic context on support tickets |
| `js/01-core.js` | Policy version constant (`POLICY_VER = "1.0"`), DOM helpers (`$`, `$$`), XSS sanitizer (`esc()`), toast notification system, and reactive state `S` |
| `js/02-tool.js` | Tool tab navigation (4 services), file upload validation (PDF/DOCX/TXT/Image up to 20 MB), and XSS-safe report rendering (`render()`, `pick()`, `again()`) |
| `js/03-i18n.js` | Bilingual dictionary (Arabic/English), DOM text-node translator (`tr()`), and palette/theme switcher (`setPal()`) |
| `js/04-api-analysis.js` | Synchronous (`hook`) and Asynchronous (`hookAsync` + Supabase polling) webhook clients, HTML sanitizer (`show()`, `cln()`), and Contract Review handler (`analyze()`) |
| `js/05-drafting-chat.js` | Contract Drafting form controller (`fld()`, `dSync()`), Legal Research, Legal Translation (`sendOther()`), and Muhkam RAG Assistant (`ask()`) |
| `js/06-auth.js` | Supabase Auth (Sign-Up with terms/privacy consent, Login, Password Reset, Token Refresh, Session Persistence) |
| `js/07-history-support.js` | User History CRUD (`public.history`), citation drawer (`addSources()`), and Support Ticket submission (`public.support_tickets`) |
| `js/08-diagnostics-layout.js` | Built-in live endpoint diagnostics (`#diag`) and responsive RTL header fitting (`need()`, `fit()`, `sched()`) |
| `js/09-bootstrap.js` | Application initialization after all module definitions are registered |
| `js/policy.js` & `js/policy-pdf-data.js` | Unmodified embedded Base64 Privacy Policy & Terms of Use viewer with fallback to `assets/policy.pdf` |

## 3. Backend Workflows (`n8n/` — 8 Workflows)
1. **`01-support-desk.json` (10 nodes)**: Verifies user JWT → analyzes ticket urgency/category via Gemini → emails support team (`={{ $env.SUPPORT_EMAIL || 'support@muhkam.local' }}`) via Gmail → updates `support_tickets.ai_analysis`.
2. **`02-contract-review.json` (28 nodes)**: Verifies user JWT → acknowledges job → extracts text from PDF/DOCX/Image via Gemini OCR → runs 5 chained legal LLM stages (Extract Clauses, Retrieve Laws, Risk Analysis, Missing Clauses, Suggested Amendments) → compiles HTML report → saves to `review_jobs` (with `Processing Error` fallback).
3. **`03-contract-drafting.json` (16 nodes)**: Verifies user JWT → validates required contract fields → invokes `04-legal-research` sub-workflow → retrieves Egyptian statutory provisions & templates → drafts contract → runs AI self-review → saves to `review_jobs`.
4. **`04-legal-research.json` (27 nodes)**: Operates both as a direct webhook (`legal-ai/research`) and as an internal sub-workflow for contract drafting. Classifies legal questions under Egyptian law (Civil Code Art. 558+ and Law 4/1996 for new residential leases; Civil Code Art. 418, 447+ and Traffic Law 66/1973 for used car sales between individuals), synthesizes a cited legal memo, and validates confidence.
5. **`05-knowledge-chat-rag.json` (13 nodes)**: Powers the **Muhkam Assistant (`مساعد محكم`)**. Generates a `1536`-dimensional embedding for the user's question → invokes `rpc/match_bayyena_knowledge` (`match_count: 6`, `min_similarity: 0.5`) → injects retrieved legal chunks into Gemini → returns grounded answer with citations.
6. **`06-contract-translator.json` (21 nodes)**: Hybrid legal translator supporting PDF (digital + OCR), DOCX, TXT, and raw text. Injects a curated **Egyptian Legal Terminology Dictionary**, translates via Gemini, and runs an automated post-processing audit (`6b. Validate Numbers & Align Clauses`) to prevent numeric drift across Arabic/English clauses.
7. **`07-knowledge-ingest.json` (14 nodes — `Legal AI - Full Cloud Workflow (Gemini Flash OCR) - Fixed`)**:
   - Accepts PDFs via Webhook (`legal-ai/knowledge/ingest`) or n8n Form (`Legal Document Upload Form`).
   - Validates PDF binary signature (`%PDF-`) and runs `Extract PDF Text` first. If `Has Text Layer?` is true (`text.length >= 200`), classifies the document via regex rules (`Classify Text Layer`) without hitting OCR token limits; otherwise routes to `Gemini Flash OCR & Classify`.
   - Splits text into overlapping chunks (`chunkSize = 3500`, `overlap = 350`), computes `1536`-dim embeddings, and inserts rows into `public.bayyena_knowledge`.
8. **`08-web-search.json` (19 nodes — `Workflow 8 - Conditional External Web Search (Serper + Gemini)`)**:
   - Provides both a user-facing webhook (`legal-ai/web-search`) with Supabase JWT verification and an internal sub-workflow trigger (`When Executed by Another Workflow`).
   - Queries `https://google.serper.dev/search` (`gl: "eg"`, `hl: "ar"`), filters out forums/unreliable domains, summarizes via Gemini with bracketed citations, and appends an explicit external-source verification disclaimer (`«مصادر خارجية — يحتاج تحققًا»`).
   - **Source vs. current deployment:** This `v1.1.1` source snapshot exports `08-web-search.json` with `active: false` and disables the external-search controls in its frontend. The current live DOM shows those controls enabled, and the owner reports that external search works; no independent live query was run. Do not infer a Serper failure or treat the older source setting as the current live state.

## 4. Supabase Database Structure & SQL Files

- A read-only inspection of the active Supabase project's live metadata was performed on 2026-10-30. It covered the four public tables, their columns and constraints, RLS policies, indexes, public routines, and user-defined `ensure_rls` event trigger. See [`SUPABASE_LIVE_STRUCTURE.md`](SUPABASE_LIVE_STRUCTURE.md) for the findings and limitations.
- All four public tables were reported with RLS enabled: `bayyena_knowledge`, `history`, `review_jobs`, and `support_tickets`. The live inspection found `history_user_idx`, `bayyena_knowledge_emb_idx`, `match_bayyena_knowledge`, `rls_auto_enable`, and the event trigger `ensure_rls`.
- `list_migrations` returned an empty list. No row values were queried/exported, no SQL was applied, and RLS behavior was not tested using separate user sessions. This is not a complete migration history or replayable deployment record.
- `database/01-schema.sql` is a historical reconstructed SQL draft; it is not the inspected live structure, a complete snapshot, or a deployment migration. Do not execute it against the active project.
- `database/02-fix-stuck-jobs.sql`: remediation code for stale `pending` jobs; not run in this review.
- `database/04-retention.sql`: optional retention code; not executed and requires owner approval.
- Exported knowledge-row data is excluded from the current source files and reachable Git history. The live metadata inspection did not query or export table rows. The existence of the `bayyena_knowledge` table does not establish its row count, content provenance, or live indexing state.
