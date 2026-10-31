# Local Merge Records & Release History (`v1.1.1`) — Muhkam (مُحكَم)

> **نطاق Supabase في هذه الحزمة:** الكود ومخطط SQL فقط. استُبعد ملف صفوف المعرفة `database/03-bayyena_knowledge_rows.sql` من الملفات الحالية وتاريخ Git؛ أي وصف قديم لـ141 مقطعًا يخص المصدر السابق وليس بيانات موجودة في هذا التسليم. أُحدث اختبار جرد الملفات ليؤكد وجود ملفات SQL الثلاثة وغياب صفوف البيانات، ولم يُحذف أو يُخفف أي اختبار وظيفي أو XSS.


> **حدّ سجل الإصدارات:** هذا ملف تاريخي محلي يصف تغييرات المصدر عند تدوينها، وليس إثباتًا على الحالة الحية الحالية. عبارات تعطيل البحث تخص لقطة المصدر `v1.1.1`؛ مفاتيح البحث في الموقع الحي مفعّلة والمالكة تؤكد عمل الميزة، ولم يُنفذ استعلام مستقل في هذه المراجعة. لا توجد هنا أدلة على أن Serper أعاد `401/403` حاليًا.

> **تحديث توثيق التسليم:** الاسم الحالي للمساعد هو «محكم». المعرف `bayyena_knowledge` تقني داخلي. هذه لقطة المصدر v1.1.1، وليست نسخة مثبتة التطابق مع النشر الحالي. البحث معطّل في كود هذه اللقطة؛ مفاتيحه مفعّلة في الموقع الحي وتؤكد المالكة عمله، ولم يُرسل استعلام مستقل في المراجعة. لا يُعد فرق النسخة عطلًا حيًا. ملف `database/01-schema.sql` مسودة مُعاد بناؤها بأنواع وسياسات مستنتجة، وليس مخطط Supabase معتمدًا؛ لا يُنفذ على قاعدة حية قبل المقارنة واعتماد المالك. تعريفات CI/النشر ملفات مصدر، لا دليل تشغيل سحابي.


## Local Merge Record #1: `feature/web-search-and-retention` → `develop`
- **Title:** `feat(v1.1.1): add cleaned 08-web-search & 04-retention.sql, archive disabled search controls, add trial banner, ESLint/Prettier & XSS guards`
- **Source Branch:** `feature/web-search-and-retention`
- **Target Branch:** `develop`
- **Status:** Merged (`--no-ff`)

### 1. What Changed (ما تغيّر)
1. **Workflow 08 & Secret Scrubbing (`n8n/`):**
   - Added `n8n/08-web-search.json` (19 nodes, `Workflow 8 - Conditional External Web Search (Serper + Gemini)`) cleaned from raw export with `pinData: {}` and `active: false` (never using raw `My workflow.json` which contained a real session JWT).
   - Cleared `pinData: {}` in `n8n/01-support-desk.json`, `03-contract-drafting.json`, `04-legal-research.json`, and `06-contract-translator.json`, and replaced the hardcoded personal email in `01-support-desk.json` with `={{ $env.SUPPORT_EMAIL || 'support@muhkam.local' }}`.
   - Updated `scripts/validate-workflows.js` to enforce all **8 workflows**, empty `pinData`, zero JWTs, and zero personal emails.
2. **External Search UI & Data Retention (`index.html`, `js/`, `database/04-retention.sql`):**
   - Disabled external search checkboxes (`#web`, `#xw`, `#cw`) in `index.html`, `js/02-tool.js`, and `js/05-drafting-chat.js` with the explicit notice `"غير متاح حاليًا"` (`"currently unavailable"` in `js/03-i18n.js` / `js/07-history-support.js`) as a source-code setting at that historical commit; this does not establish live Serper credential status.
   - Added `database/04-retention.sql` (`public.purge_old_muhkam_records()`) with an explicit header warning not to execute on the production database without owner approval, and verified that neither `index.html` nor `js/03-i18n.js` claims `"تُحذف السجلات تلقائيًا بعد ٣٠ يومًا"`.
   - Added the academic trial warning banner (`#trialBanner`) above `#tabs` in `index.html` (and English translation in `js/03-i18n.js`).
3. **Code Quality, JSDoc & XSS Hardening (`js/`, `.eslintrc.json`, `.prettierrc.json`, `tests/smoke.test.js`):**
   - Added `.eslintrc.json`, `.eslintignore`, `.prettierrc.json`, and `scripts/check-format.js`, wiring `npm run check` (and `.github/workflows/ci.yml`) to execute ESLint, JS syntax check, Prettier format verification, 8-workflow JSON validation, and the automated test suite.
   - Added JSDoc comments documenting purpose, inputs, and outputs for all main functions in `js/02-tool.js`, `js/03-i18n.js`, `js/05-drafting-chat.js`, and `js/08-diagnostics-layout.js`.
   - Audited every `innerHTML` assignment across `js/`; fixed unescaped `r.level` in `render()` (`js/02-tool.js`), `st.map` in `run()` (`js/02-tool.js`), and `fld()` in `js/05-drafting-chat.js`; expanded `tests/smoke.test.js` to **9 automated tests** covering every `innerHTML` path and policy SHA-256 integrity.
4. **Documentation & Legal Accuracy (`README.md`, `docs/`):**
   - Standardized terminology across all documents to **4 services** (Review, Drafting, Research, Translation) + **Muhkam Assistant** and **8 workflows**.
   - Corrected statutory references: new residential leases between individuals are governed by the **Egyptian Civil Code (Art. 558 et seq.) and Law 4/1996** (Civil Code art. 558+ and Law 4/1996 is for old rent only under Laws 49/1977 & 136/1981); used car sales between non-professional individuals are governed by the **Egyptian Civil Code (Art. 418, 447 et seq.) and Traffic Law 66/1973** (Consumer Protection Civil Code arts. 418 and 447+ and Traffic Law 66/1973 does not govern private C2C used car sales).
   - Preserved `assets/policy.pdf` (SHA-256: `4c139e22748b1d4da3efd8ac7d1021498a2a74d7eb36760ceb4e4116a570f148`), `js/policy-pdf-data.js`, and `POLICY_VER = "1.0"` 100% untouched.

### 2. Why (لماذا)
- To eliminate leaked session tokens/emails from workflow exports and git history, prevent the UI from promising external web search or automatic 30-day record deletion that is not currently active on the live backend, close the `r.level` `innerHTML` XSS vector, enforce automated linting/formatting via `npm run check`, and ensure 100% legal and QA honesty in project documentation.

### 3. How It Was Tested (كيف اختُبر)
- Ran `npm run check` locally:
  - `npm run lint:js` (`eslint` + `node scripts/check-syntax.js`): 13/13 JS files passed with 0 errors.
  - `npm run format:check` (`node scripts/check-format.js`): 12/12 source JS files passed formatting checks.
  - `npm run lint:json` (`node scripts/validate-workflows.js`): 8/8 workflows valid, 0 JWTs, 0 personal emails, empty `pinData`.
  - `npm test` (`node --test tests/smoke.test.js`): 9 tests pass automated tests passed (`PASS`).
- Tested live site (`https://mohakem-contract-platform.vercel.app/` and `#diag`) in a real headless browser (`TC-01`, `TC-05`, `TC-17`, `TC-18` passed live; `TC-19` and `TC-20` verified in `v1.1.1`).

### 4. What Was Not Tested (ما لم يُختبر ولماذا)
- Authenticated end-to-end live executions of `review`, `draft`, `research`, `translate`, `chat`, and `support` (`TC-04`, `TC-06`, `TC-07`, `TC-08`, `TC-10`, `TC-11`, `TC-12`, `TC-14`, `TC-16`) were recorded as `لم يُنفَّذ` because completing live Supabase Sign-Up requires human legal consent confirmation and email inbox verification, and live n8n admin credentials (`googlePalmApi`, `supabaseApi`) are hosted in the team's private cloud accounts.
- `database/04-retention.sql` was **not** executed against the live Supabase database per explicit user instruction requiring prior owner approval.

---

## Local Merge Record #2: `develop` → `main` (Release `v1.1.1`)
- **Title:** `release: v1.1.1 — 8 workflows, archived search-control setting, trial warning banner, ESLint/Prettier, JSDoc, XSS guards, and QA report`
- **Source Branch:** `develop`
- **Target Branch:** `main`
- **Tag:** `v1.1.1`
- **Verification:** `npm run check` green (9 tests pass tests passing), `sha256sum assets/policy.pdf` verified (`4c139e22748b1d4da3efd8ac7d1021498a2a74d7eb36760ceb4e4116a570f148`), zero JWTs or personal emails in `git log -p --all`.


## Local Audit Preparation — 2026-10-31
- **Branch prepared locally:** `audit/partial-closure-2026-10-31`
- **Remote push/PR:** not performed; owner approval required.
- **Evidence:** synthetic negative security results are stored in `evidence/security-negative-tests-2026-10-31.json`; local PR text is in `evidence/LOCAL_PR_DRAFT.txt`.
- **Verification:** `npm ci` and `npm run check` passed locally; no cloud Actions run exists yet.
- **Acceptance status:** 5.1d, 5.2c, 5.2d, and 7b remain `PARTIAL` until their respective live/public evidence is authorized and obtained.
