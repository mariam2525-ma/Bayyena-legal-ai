# Contributing

> **نطاق Supabase في هذه الحزمة:** الكود ومخطط SQL فقط. استُبعد ملف صفوف المعرفة `database/03-bayyena_knowledge_rows.sql` من الملفات الحالية وتاريخ Git؛ أي وصف قديم لـ141 مقطعًا يخص المصدر السابق وليس بيانات موجودة في هذا التسليم. أُحدث اختبار جرد الملفات ليؤكد وجود ملفات SQL الثلاثة وغياب صفوف البيانات، ولم يُحذف أو يُخفف أي اختبار وظيفي أو XSS.


> **تحديث توثيق التسليم:** الاسم الحالي للمساعد هو «محكم». المعرف `bayyena_knowledge` تقني داخلي. هذه لقطة المصدر v1.1.1، وليست نسخة مثبتة التطابق مع النشر الحالي. البحث معطّل في كود هذه اللقطة؛ مفاتيحه مفعّلة في الموقع الحي وتؤكد المالكة عمله، ولم يُرسل استعلام مستقل في المراجعة. لا يُعد فرق النسخة عطلًا حيًا. ملف `database/01-schema.sql` مسودة مُعاد بناؤها بأنواع وسياسات مستنتجة، وليس مخطط Supabase معتمدًا؛ لا يُنفذ على قاعدة حية قبل المقارنة واعتماد المالك. تعريفات CI/النشر ملفات مصدر، لا دليل تشغيل سحابي.


## Branching strategy (GitFlow-lite)
- `main` — always deployable; protected; receives merges from `develop` (releases) and `hotfix/*`.
- `develop` — integration branch.
- `feature/<topic>` — new work, branched from `develop`, merged back with a pull request.
- `fix/<topic>` / `hotfix/<topic>` — bug fixes.

## Commits (Conventional Commits)
`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `ci:`, `chore:` — imperative, ≤ 72 chars, body explains *why*.

## Pull requests
Describe the change, how it was tested (`npm run check`), screenshots for UI changes, and link the issue. At least one review before merge.

## CI evidence
The local CI workflow runs `npm ci` followed by `npm run check` for the configured push and pull-request branches. The revised workflow in this package is uncommitted; until an owner-authorized push or pull request runs it on GitHub, it is configuration evidence only, not a public Actions result.

## Never commit
Session tokens/JWTs, service-role keys, user data exports (`originals/` is git-ignored).
