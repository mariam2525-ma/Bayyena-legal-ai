# Muhkam (مُحكَم) — AI-Powered Egyptian Legal Platform (`v1.1.1`)

> **حالة المراجعة العامة — 2026-10-31:** [PR #1](https://github.com/mariam2525-ma/Bayyena-legal-ai/pull/1) مفتوح كمسودة Draft؛ الرأس الحالي ونتائج CI متاحان في [Checks](https://github.com/mariam2525-ma/Bayyena-legal-ai/pull/1/checks). نجح CI للرأس المرحلي `5e7e7ad` في [التشغيل 41202467435](https://github.com/mariam2525-ma/Bayyena-legal-ai/actions/runs/41202467435)؛ هذا checkpoint مؤرخ، وليس ادعاءً عن SHA لاحق. نجاح CI لا يثبت الخدمات الحية. 7b ما زال جزئيًا؛ لا يوجد PNG كامل مقبول للجداول العامة من الصادرات المستلمة. لم يُدمج PR ولم يحدث نشر أو تفعيل workflow أو تعديل حي في Supabase.

> **نطاق Supabase في هذه الحزمة:** الكود ومخطط SQL فقط. استُبعد ملف صفوف المعرفة `database/03-bayyena_knowledge_rows.sql` من ملفات المصدر الحالية وتاريخ Git؛ أي وصف قديم لـ141 مقطعًا يخص نسخة سابقة ولا يعني أن صفوف البيانات موجودة في هذا التسليم؛ أي وصف قديم لـ141 مقطعًا يخص المصدر السابق وليس بيانات موجودة في هذا التسليم. أُحدث اختبار جرد الملفات ليؤكد وجود ملفات SQL الثلاثة وغياب صفوف البيانات، ولم يُحذف أو يُخفف أي اختبار وظيفي أو XSS.


> **تحديث توثيق التسليم:** الاسم الحالي للمساعد هو «محكم». المعرف `bayyena_knowledge` تقني داخلي. هذه لقطة المصدر v1.1.1، وليست نسخة مثبتة التطابق مع النشر الحالي. البحث معطّل في كود هذه اللقطة؛ مفاتيحه مفعّلة في الموقع الحي وتؤكد المالكة عمله، ولم يُرسل استعلام مستقل في المراجعة. لا يُعد فرق النسخة عطلًا حيًا. فُحصت بنية Supabase الحية للقراءة فقط بتاريخ 2026-10-30، بما يشمل الجداول والأعمدة والقيود وسياسات RLS والفهارس والروتينات ومشغل `ensure_rls`؛ الملخص في `docs/SUPABASE_LIVE_STRUCTURE.md`. أعاد `list_migrations` قائمة فارغة، ولم تُقرأ بيانات صفوف أو يطبق SQL. يظل `database/01-schema.sql` مسودة SQL تاريخية غير معتمدة، وليس snapshot أو migration قابلة لإعادة التشغيل. تعريفات CI/النشر ملفات مصدر، لا دليل تشغيل سحابي.


**Four specialized legal services** (**Contract Review / مراجعة العقود**, **Contract Drafting / صياغة العقود**, **Legal Research / البحث القانوني**, **Contract Translation / ترجمة العقود**) + the **Muhkam Legal Assistant (مساعد محكم)**, powered by **8 n8n workflows**, **Supabase PostgreSQL + `pgvector`**, and **Google Gemini**, grounded in Egyptian legislation and legal literature.

> Arabic · RTL · Light/Dark Themes · Bilingual UI (Arabic / English) · Academic Trial Release (`v1.1.1`)

- **Live Deployed Web App (Vercel):** https://mohakem-contract-platform.vercel.app/
- **Public Git repository:** https://github.com/mariam2525-ma/Bayyena-legal-ai
- **Git provenance:** the original supplied archive was not rewritten or pushed. The public review branch was built above the repository's existing `main`, using new commits with noreply metadata; no original local history or tags were uploaded. The current delivery omits `.git`. Older archive descriptions refer to the pre-push checkpoint, not this public Draft PR.

## 1. System Architecture
```
Browser (Modular Static HTML5 / CSS3 / ES-Free JS Modules — 4 Services + Muhkam Assistant)
   ├─ Supabase Auth ............... Sign-up, login, password recovery, JWT session refresh
   ├─ Supabase PostgREST (RLS) .... review_jobs, history, support_tickets
   └─ n8n Cloud Webhooks .......... 8 Workflows (Gemini 3.1 Flash-Lite, Gemini Flash OCR, Embeddings, Conditional Serper Web Search)
                                        └─ Supabase PostgreSQL + pgvector (bayyena_knowledge — owner-managed knowledge; row data excluded)
```
The backend consists of **8 numbered n8n workflows** in `n8n/` (`01-support-desk.json` through `08-web-search.json`) paired with **Supabase PostgreSQL + `pgvector`** scripts in `database/` (`01-schema.sql`, `02-fix-stuck-jobs.sql`, `04-retention.sql`; row data excluded).

## 2. Legal Scope & Statutory Accuracy
- **New Residential Lease Contracts (`عقود الإيجار السكني الجديدة بين الأفراد`):** Governed by the **Egyptian Civil Code (Articles 558 et seq.)**, **Law No. 4 of 1996**, and the contractual agreement of the parties (`العقد شريعة المتعاقدين`).
  - *Important Distinction:* **Law No. 164 of 2025** applies **exclusively to old-rent leases** (`الإيجار القديم` previously governed by Laws No. 49 of 1977 and No. 136 of 1981) and is **never** the statutory basis for a new residential lease between individuals.
- **Used Car Sale Contracts Between Non-Professional Individuals (`عقود بيع السيارات المستعملة بين الأفراد`):** Governed by the **Egyptian Civil Code** (sale provisions Articles 418 et seq. and latent-defect / warranty provisions Articles 447 et seq.) and **Egyptian Traffic Law No. 66 of 1973** (as amended).
  - *Important Distinction:* **Consumer Protection Law No. 181 of 2018** governs commercial supplier-to-consumer transactions and **does not** govern a private sale of a used car between two non-professional individuals.

## 3. Repository Structure
| Path | Description |
|---|---|
| `index.html` | Main application markup (`lang="ar"`, `dir="rtl"`), including academic trial banner (`#trialBanner`) and 4 service tabs + Muhkam chat |
| `css/style.css` | Stylesheet with responsive layout and 5 colour palettes / light-dark design tokens |
| `js/config.js` | Central configuration (n8n webhook URLs, Supabase URL + publishable key) |
| `js/00…09-*.js` | 10 modular frontend scripts loaded in deterministic numerical order with JSDoc documentation |
| `js/policy.js`, `js/policy-pdf-data.js`, `assets/policy.pdf` | Original unmodified Privacy Policy & Terms of Use PDF (`POLICY_VER = "1.0"`, SHA-256 `4c139e22...`) |
| `n8n/01…08-*.json` | **8 n8n workflows** (`01-support-desk` through `08-web-search`, scrubbed of all `pinData`, tokens, and personal emails) |
| `database/*.sql` (3 files) | Reconstructed Supabase schema draft, stuck-job remediation code, and optional retention SQL; no exported row data (requires explicit owner approval before running) |
| `.eslintrc.json`, `.prettierrc.json`, `scripts/`, `tests/` | ESLint checks `no-undef` and `no-unused-vars` plus syntax, formatting, 8-workflow JSON/security validation, and 9 smoke/XSS tests; source-snapshot search assertions are not live-search tests |
| `docs/` | `API.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `PULL_REQUESTS.md`, `SUPABASE_LIVE_STRUCTURE.md`, `TESTING_AND_QA.md`, `USER_MANUAL.md` |
| `.github/workflows/` | GitHub Actions CI (`ci.yml` running `npm run check`) and GitHub Pages deployment (`deploy.yml`) |

## 4. System Requirements
- **Client / End User:** Any modern web browser (Chrome, Edge, Firefox, Safari) on desktop or mobile.
- **Local Development & Automated Verification:** **Node.js ≥ 18** (tested on Node 18 & 20), `npm`, and `eslint`.
- **Cloud Backend Services:**
  - **Supabase Project:** PostgreSQL with `vector` (`pgvector`) and `pgcrypto` extensions enabled.
  - **n8n Instance:** n8n Cloud or self-hosted n8n (`≥ 1.x`).
  - **API Credentials:** Google Gemini (`googlePalmApi`), Supabase Service Role (`supabaseApi`), Gmail OAuth2 (`gmailOAuth2`), and optional Serper API key (`httpHeaderAuth` for workflow `08-web-search.json`). The archived source snapshot disables external-search controls; the live UI currently enables them and the owner reports that search works. No independent live query was sent.

## 5. Installation & Configuration Steps
```bash
git clone <repository-url>
cd muhkam
npm install          # installs devDependencies (eslint, prettier, jsdom)
```
1. **Database Setup (Supabase):**
   - The live structure was inspected read-only on 2026-10-30; see `docs/SUPABASE_LIVE_STRUCTURE.md`. This is a partial metadata summary, not a complete DDL or migration. Compare the reconstructed draft `database/01-schema.sql` with an owner-approved schema in a disposable test project first; do not execute it blindly on a live project.
   - Exported knowledge-row data is deliberately excluded. Ingest owner-approved legal sources through the supplied ingestion workflow after checking rights and the approved schema. No row values were queried or exported, and no SQL was applied.
   - Run `database/02-fix-stuck-jobs.sql` if cleaning up timed-out `pending` jobs.
   - **Do NOT run `database/04-retention.sql`** unless the database owner explicitly approves enabling 30-day automatic deletion.
2. **Backend Workflows Setup (n8n):**
   - Import the **8 workflow files** from `n8n/` (`01-support-desk.json` through `08-web-search.json`).
   - Configure credentials in n8n (`Google Gemini(PaLM) Api account`, `Supabase account`, `Gmail account`).
   - Note on `08-web-search.json`: External search via Serper is currently disabled in the trial frontend (`disabled` with label `"غير متاح حاليًا"`) in this source snapshot only; the current live controls are enabled, the owner reports working search, and no independent live query was run.
3. **Frontend Configuration (`js/config.js`):**
   - Verify `WH` points to your n8n webhook base URL and `AUTH` holds your Supabase URL and **publishable** key (`sb_publishable_...`). Never place a `service_role` key in frontend code.

## 6. Testing & Quality Assurance
Run the full automated verification suite (ESLint + JS syntax check + Prettier format check + 8-workflow JSON/secret validator + 9 smoke & XSS unit tests):
```bash
npm run check
```
Or run individual checks:
```bash
npm run lint:js        # ESLint + node --check across all frontend JS files
npm run format:check   # Prettier / formatting verification across JS files
npm run lint:json      # Validates all 8 n8n workflows and scans against leaked JWTs/emails/pinData
npm test               # Runs 9 automated tests in tests/smoke.test.js
```
See [`docs/TESTING_AND_QA.md`](docs/TESTING_AND_QA.md) for the full Test Plan, honest execution results for **TC-01 through TC-20**, and Bug Reports.

## 7. Documentation Index
- **API & Webhook Reference (8 Workflows):** [`docs/API.md`](docs/API.md)
- **System Architecture & Database Schema:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Read-only Supabase live structure snapshot (2026-10-30):** [`docs/SUPABASE_LIVE_STRUCTURE.md`](docs/SUPABASE_LIVE_STRUCTURE.md)
- **Testing & Quality Assurance Report (TC-01…TC-20):** [`docs/TESTING_AND_QA.md`](docs/TESTING_AND_QA.md)
- **End-User Manual (دليل المستخدم):** [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md)
- **Pull Requests & Release History (`v1.1.1`):** [`docs/PULL_REQUESTS.md`](docs/PULL_REQUESTS.md)
- **Version Control & Contributing Guide:** [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)

## تشغيل الواجهة محليًا ومتطلبات الجهاز

لا توجد متطلبات عتاد خاصة للواجهة الثابتة: يكفي جهاز يشغّل متصفحًا حديثًا، واتصال إنترنت للخدمات السحابية. يلزم Node.js 18 أو أحدث وnpm للفحوص، وPython 3 للأمر المحلي التالي. موارد n8n وSupabase والنماذج تُهيّأ في بيئة المالك؛ لا تدّعي الحزمة حدًا أدنى مقاسًا لذاكرتها أو معالجها.

بعد فك الأرشيف في مجلد المشروع:

```bash
npm ci
npm run check
python3 -m http.server 8000
```

افتح `http://localhost:8000/`، وأوقف الخادم بـ Ctrl+C. عرض الواجهة لا يعني جاهزية الخدمات الخلفية؛ اضبط الإعدادات بنفسك. لا توجد اعتمادات تشغيل في الحزمة.

## خطوات تهيئة نسخة منشورة

1. أنشئ بيئة اختبار منفصلة للخدمات. اطلب مخطط Supabase المعتمد من المالك وقارنه بالمسودة؛ لا تنفذ SQL أو سكربت الاحتفاظ على قاعدة حية دون اعتماد. اضبط Auth وعناوين إعادة التوجيه وRLS وفق المخطط المعتمد.
2. استورد ملفات n8n الثمانية من `n8n/`، وأعد ربط الاعتمادات داخل n8n، وعناوين Webhook وأهداف المسارات الفرعية. لا تنسخ مفاتيح خادم إلى الواجهة. توافر الملفات ليس إثباتًا لنجاح الاستيراد أو التنفيذ.
3. اضبط `js/config.js` بعناوين بيئتك ومفتاح Supabase القابل للنشر فقط. احتفظ بأي مفتاح سري في الخدمة الخلفية.
4. انشر مجلد الواجهة الثابتة على مشروع Vercel: اجعل إعداد المشروع Static/Other، بلا أمر build خاص، ومجلد الإخراج هو مجلد الواجهة. هذا إجراء تهيئة مقترح، ولم يُنفذ نشر في هذه المراجعة.
5. اختبر جلسة تجريبية وتدفقات النجاح والفشل في بيئة الاختبار قبل اعتمادها. إعداد البحث في المصدر أقدم من الموقع الحي؛ لا يُغيّر هنا ليحاكي نشرًا لم تُسلّم نسخته.

## حدود أدلة التعاون والنشر

وصف الدمجات المحلية في `docs/PULL_REQUESTS.md` والمسودة في `evidence/LOCAL_PR_DRAFT.txt` سجلات تاريخية تسبق الدفع، وليست إثباتًا لتعاون عام متعدد الأشخاص. أُنشئ لاحقًا [PR #1 كمسودة](https://github.com/mariam2525-ma/Bayyena-legal-ai/pull/1) ونُشرت تحديثاته على فرع المراجعة فقط، مع CI فعلي منفصل عن الاختبارات المحلية. مرجع الرأس ونتيجته الحالية [Checks](https://github.com/mariam2525-ma/Bayyena-legal-ai/pull/1/checks). يعرّف `deploy.yml` نشر GitHub Pages عند الدفع إلى `main`؛ لذلك قد يشغّل الدمج نشرًا، ولا يُعامل كإجراء توثيق عادي. لم يُنفذ دمج أو نشر أو تفعيل n8n أو SQL حي في هذه المراجعة. هذا PR مراجعة واحد، لا تاريخ تعاون جديد مُفترض.
