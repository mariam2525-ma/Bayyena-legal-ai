# API & Webhook Reference — Muhkam (مُحكَم) `v1.1.1`

> **نطاق Supabase في هذه الحزمة:** الكود ومخطط SQL فقط. استُبعد ملف صفوف المعرفة `database/03-bayyena_knowledge_rows.sql` من الملفات الحالية وتاريخ Git؛ أي وصف قديم لـ141 مقطعًا يخص المصدر السابق وليس بيانات موجودة في هذا التسليم. أُحدث اختبار جرد الملفات ليؤكد وجود ملفات SQL الثلاثة وغياب صفوف البيانات، ولم يُحذف أو يُخفف أي اختبار وظيفي أو XSS.


> **تحديث توثيق التسليم:** الاسم الحالي للمساعد هو «محكم». المعرف `bayyena_knowledge` تقني داخلي. هذه لقطة المصدر v1.1.1، وليست نسخة مثبتة التطابق مع النشر الحالي. البحث معطّل في كود هذه اللقطة؛ مفاتيحه مفعّلة في الموقع الحي وتؤكد المالكة عمله، ولم يُرسل استعلام مستقل في المراجعة. لا يُعد فرق النسخة عطلًا حيًا. ملف `database/01-schema.sql` مسودة مُعاد بناؤها بأنواع وسياسات مستنتجة، وليس مخطط Supabase معتمدًا؛ لا يُنفذ على قاعدة حية قبل المقارنة واعتماد المالك. تعريفات CI/النشر ملفات مصدر، لا دليل تشغيل سحابي.


The frontend communicates with **two cloud backends**: **n8n Cloud Webhooks** (**8 workflows** for AI orchestration) and **Supabase PostgREST / Auth** (authentication, persistence, and `pgvector` RAG). Every user-facing endpoint requires an authenticated Supabase user session.

- **Live Web Application:** https://mohakem-contract-platform.vercel.app/

## 1. Authentication Flow
1. Sign in via Supabase Auth (`POST {SUPABASE_URL}/auth/v1/token?grant_type=password`, header `apikey: <publishable key>`).
2. Send the returned `access_token` on every request: `Authorization: Bearer <access_token>`.
3. Every n8n user-facing workflow first calls `GET {SUPABASE_URL}/auth/v1/user` with that token (**Verify User** node) and immediately returns HTTP **401 Unauthorized** if the token is missing, invalid, or expired.

## 2. n8n Cloud Webhooks (`POST https://<n8n-host>/webhook/<path>`) — 8 Workflows

| Workflow File | Endpoint Path | Nodes | Request Payload | Execution Mode | Output & Persistence |
|---|---|---|---|---|---|
| `01-support-desk.json` | `legal-ai/support` | 10 | JSON: `ticket_id`, `category`, `subject`, `message`, `email`, `name`, `page_url`, `context` | Synchronous | Sends support email (`$env.SUPPORT_EMAIL`) via Gmail OAuth2 and saves Gemini AI triage analysis in `support_tickets.ai_analysis` |
| `02-contract-review.json` | `legal-ai/review` | 28 | `multipart/form-data`: `job_id`, `contract_type`, `user_role`, `allow_web_search`, `contract_text`, optional `file` (PDF/DOCX/TXT/Image) | Async (`review_jobs`) | Extracts clauses, retrieves applicable Egyptian Civil Code / special statutory rules, performs risk analysis, identifies missing clauses, and stores HTML report in `review_jobs.report` |
| `03-contract-drafting.json` | `legal-ai/draft` | 16 | JSON: `job_id`, `contract_type`, `first_party_info`, `second_party_info`, `drafting_prompt`, + contract-specific fields (`property_address`, `car_chassis_motor`, etc.) | Async (`review_jobs`) | Calls Workflow 04 for legal grounding, retrieves templates/laws, drafts full Arabic contract, runs self-review, and saves to `review_jobs.report` |
| `04-legal-research.json` | `legal-ai/research` | 27 | JSON: `job_id`, `question`, `contract_type`, `user_role` (+ Arabic aliases `نوع العقد محل الاستشارة`, `صفة السائل`, `موضوع أو سؤال الاستشارة`) | Async (`review_jobs`) & Sub-workflow | Classifies query under Egyptian law (Civil Code Art. 558+ & Law 4/1996 for new leases; Civil Code Art. 418, 447+ & Traffic Law 66/1973 for private car sales), builds cited legal opinion, verifies confidence, and saves to `review_jobs.report` |
| `05-knowledge-chat-rag.json` | `legal-ai/chat` | 13 | JSON: `message`, `question`, `history` (last 8 `{q,a}` turns), `audience` (`general`/`legal`), `kind` (`contract`/`research`), `lang` | Synchronous | Powers **Muhkam Assistant (`محكم`)**: embeds question (`1536`-dim), queries `rpc/match_bayyena_knowledge`, and returns grounded answer with statutory/book citations |
| `06-contract-translator.json` | `translate-contract-hybrid` | 21 | JSON `{text, targetLanguage, job_id}` or `multipart/form-data` with `file` (PDF/DOCX/TXT) | Async (`review_jobs`) | Applies Egyptian legal terminology dictionary, translates via Gemini, validates numbers & clause alignment (`6b`), and outputs side-by-side HTML |
| `07-knowledge-ingest.json` | `legal-ai/knowledge/ingest` | 20 | Authenticated `multipart/form-data` PDF or JSON `{pdf_base64, file_name}`; optional `pdf_url` on an approved HTTPS Drive/Dropbox host; up to 20 MiB decoded PDF | Synchronous ingestion | Hybrid extraction: checks digital PDF text layer first (`Extract PDF Text` → `Has Text Layer?`), falls back to `Gemini Flash OCR & Classify`, chunks text (`3500` chars / `350` overlap), creates `1536`-dim embeddings, and inserts into shared `bayyena_knowledge` |
| `08-web-search.json` | `legal-ai/web-search` | 19 | JSON `{question, message, history, allow_web_search: true}` or internal sub-workflow trigger | Synchronous / Sub-workflow | Verifies JWT & `allow_web_search`, queries Serper (`google.serper.dev/search`), summarizes via Gemini with citations, and marks output `external_web` («يحتاج تحققًا»). **Status note:** The archived v1.1.1 source disables its UI controls; the current live UI controls are enabled and the owner reports search works. No independent live query or Serper response was tested, so this archive does not establish the current backend credential status. |

**Review-branch security note for workflow 07:** its webhook now verifies the Supabase user token and returns 401 for unauthenticated requests. The separate public n8n upload form is disabled until there is an authenticated replacement. URL ingestion permits only exact HTTPS Google Drive/Dropbox hosts, rejects credentials/custom ports/fragments, and does not follow redirects; links that require redirects may fail. The 20 MiB check is applied after the response/file is received, so it is not a network-level download cap. This source change has not been activated or live-tested. It authenticates users but does not establish an admin role; because inserts use a privileged n8n credential into shared knowledge, do not activate until the owner confirms who may ingest and appropriate role/egress controls are in place.

### Asynchronous Job Pattern (`hookAsync`)
To prevent browser HTTP timeouts on multi-step legal analysis (which takes 20–90 seconds):
1. The client inserts a row into `public.review_jobs` with `{ id: <uuid>, status: "pending" }`.
2. The client sends `POST` to the n8n webhook with `job_id`; n8n validates the user JWT and immediately replies with HTTP `200 OK` (**Ack** node).
3. The client polls `GET /rest/v1/review_jobs?id=eq.<job_id>&select=status,report,error` every 4 seconds (up to 10 minutes) until `status` transitions to `done` or `error`.
4. If any AI node fails mid-pipeline in workflows `02`, `03`, `04`, or `06`, the dedicated **`Processing Error`** node catches the failure and updates `review_jobs.status = 'error'` with a descriptive message.

## 3. Supabase PostgREST Endpoints (`{SUPABASE_URL}/rest/v1/...`)

| Table / RPC / Script | Purpose | Access Control (RLS) |
|---|---|---|
| `public.review_jobs` | Tracks async AI job states (`pending`, `done`, `error`) and stores generated HTML reports | Authenticated user owns row (`user_id = auth.uid()`) |
| `public.history` | Stores user activity history across `chat`, `review`, `research`, and `draft` modules | Authenticated user owns row (`user_id = auth.uid()`) |
| `public.support_tickets` | Stores user support requests, diagnostic context, and Gemini triage analysis | Authenticated user (`SELECT`, `INSERT` own rows) |
| `public.bayyena_knowledge` | Stores **141 indexed legal chunks** with `vector(1536)` embeddings (Egyptian laws, contract templates, *The Golden Book of Legal Contracts*, and *Translation of Civil Contracts* by Dr. Mostafa El-Morshedy) | Service Role (n8n workflows) & `match_bayyena_knowledge` RPC |
| `rpc/match_bayyena_knowledge` | Semantic cosine similarity search (`1 - (embedding <=> query_embedding) >= min_similarity`) | Called by Workflow `05-knowledge-chat-rag.json` |
| `database/04-retention.sql` | Optional `public.purge_old_muhkam_records()` function for 30-day retention | **Not active by default** (requires explicit database owner approval before execution) |
