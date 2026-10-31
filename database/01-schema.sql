-- =====================================================================
-- مُحكَم / بيّنة — هيكل قاعدة البيانات (Supabase)
-- ⚠️ هذا الملف "مُعاد بناؤه" من: (1) أعمدة وبيانات ملفات الـ rows التي صدّرتِها،
--    (2) طريقة استخدام الموقع للجداول. ليس نسخة مسحوبة من مشروعك.
--    الأنواع مستنتجة من البيانات، والـ policies من سلوك الموقع (تخمين منطقي).
--    قارنيه بالحقيقي قبل التنفيذ على مشروع فيه بيانات.
-- =====================================================================

-- ملاحظة تحديث 2026-10-30: عوينت metadata الحية (الجداول والأعمدة والقيود والسياسات
-- والفهارس والروتينات ومشغل ensure_rls) للقراءة فقط؛ الملخص في docs/SUPABASE_LIVE_STRUCTURE.md.
-- هذا الملف مسودة SQL تاريخية معاد بناؤها، وليس نسخة البنية الحية أو snapshot SQL أو migration.
-- لم تُقرأ قيم صفوف أو يُطبّق SQL؛ أعاد list_migrations قائمة فارغة.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ---------- سجل المستخدم ----------
create table if not exists public.history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text not null,                 -- chat | review | research | draft
  title      text,
  input      jsonb,
  output     text,
  created_at timestamptz not null default now()
);
create index if not exists history_user_created_idx on public.history (user_id, created_at desc);

-- ---------- تذاكر الدعم ----------
create table if not exists public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email       text,
  category    text,                         -- review | draft | research | translate | account | other
  subject     text,
  message     text,
  page_url    text,
  user_agent  text,
  context     jsonb,
  ai_analysis jsonb,
  priority    text not null default 'normal',   -- low | normal | high | urgent
  status      text not null default 'open',     -- open | in_progress | resolved | closed
  admin_reply text,
  created_at  timestamptz not null default now()
);
create index if not exists tickets_user_created_idx on public.support_tickets (user_id, created_at desc);

-- ---------- مهام مراجعة العقود (الموقع ينشئها pending، و n8n يحدّثها) ----------
create table if not exists public.review_jobs (
  id         uuid primary key,              -- يولّده الموقع
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status     text not null default 'pending',   -- pending | done | error
  report     text,                          -- تقرير HTML
  error      text,
  created_at timestamptz not null default now()
);
create index if not exists review_jobs_user_created_idx on public.review_jobs (user_id, created_at desc);
create index if not exists review_jobs_pending_idx on public.review_jobs (created_at) where status = 'pending';

-- ---------- قاعدة معرفة بيّنة (RAG) ----------
create table if not exists public.bayyena_knowledge (
  chunk_id           text primary key,      -- مثال: doc-1791292834500-0 (افتراض: لا يوجد عمود id في التصدير)
  document_id        text not null,
  chunk_index        integer not null,
  title              text,
  document_type      text,                  -- قانون | عقد | إقرار
  source             text,
  is_legal_authority boolean not null default false,
  article_number     text,                  -- النوع غير مؤكد (كل القيم null في التصدير)
  jurisdiction       text,                  -- النوع غير مؤكد
  language           text,                  -- النوع غير مؤكد
  content            text not null,
  embedding          vector(1536),          -- البعد 1536 من البيانات
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);
create index if not exists bayyena_doc_idx on public.bayyena_knowledge (document_id, chunk_index);
create index if not exists bayyena_embedding_idx on public.bayyena_knowledge
  using hnsw (embedding vector_cosine_ops);

-- =====================================================================
-- Row Level Security (تخمين من سلوك الموقع و workflows n8n)
-- =====================================================================
alter table public.history          enable row level security;
alter table public.support_tickets  enable row level security;
alter table public.review_jobs      enable row level security;
alter table public.bayyena_knowledge enable row level security;   -- بدون policies = للـ service_role فقط

-- history: المستخدم يرى ويضيف ويحذف سجله فقط
create policy history_select on public.history for select to authenticated using (user_id = auth.uid());
create policy history_insert on public.history for insert to authenticated with check (user_id = auth.uid());
create policy history_delete on public.history for delete to authenticated using (user_id = auth.uid());

-- support_tickets: يرسل ويشاهد تذاكره فقط (التحديث من n8n / لوحة الإدارة)
create policy tickets_select on public.support_tickets for select to authenticated using (user_id = auth.uid());
create policy tickets_insert on public.support_tickets for insert to authenticated with check (user_id = auth.uid());

-- review_jobs: ينشئ مهمته ويقرأ حالتها. التحديث مطلوب أيضًا لأن workflows المراجعة والبحث والترجمة
-- تعمل PATCH بتوكن المستخدم نفسه (Authorization من الـ webhook)، فبدون policy التحديث تبقى المهمة pending.
create policy jobs_select on public.review_jobs for select to authenticated using (user_id = auth.uid());
create policy jobs_insert on public.review_jobs for insert to authenticated with check (user_id = auth.uid());
create policy jobs_update on public.review_jobs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- دالة البحث الدلالي التي يستدعيها workflow الشات (rpc/match_bayyena_knowledge)
-- الاستدعاء من n8n: { query_embedding, match_count: 6, min_similarity: 0.5 }
-- الحقول التي يقرؤها الـ workflow: chunk_id, title, document_type, source, content, similarity
-- ⚠️ مُعاد بناؤها من طريقة الاستدعاء؛ تعريفها الحقيقي غير موجود عندي.
-- =====================================================================
create or replace function public.match_bayyena_knowledge(
  query_embedding vector(1536),
  match_count     integer default 6,
  min_similarity  double precision default 0.5
)
returns table (
  chunk_id text, document_id text, title text, document_type text,
  source text, content text, similarity double precision
)
language sql stable
as $$
  select k.chunk_id, k.document_id, k.title, k.document_type, k.source, k.content,
         1 - (k.embedding <=> query_embedding) as similarity
  from public.bayyena_knowledge k
  where k.embedding is not null
    and 1 - (k.embedding <=> query_embedding) >= min_similarity
  order by k.embedding <=> query_embedding
  limit match_count;
$$;
