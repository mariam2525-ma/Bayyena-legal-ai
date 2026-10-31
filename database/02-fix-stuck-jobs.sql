-- مهام المراجعة العالقة في pending
-- في التصدير: 31 من 55 مهمة ما زالت pending (بعضها من 8 أكتوبر)، لأن الـ workflow لو فشل
-- في نص الطريق لا يحدّث الصف إلى error، فيبقى الموقع ينتظر.

-- 1) افحصي أولًا:
select status, count(*) from public.review_jobs group by status;

-- 2) أغلقي العالقة (أقدم من 15 دقيقة) كـ error:
update public.review_jobs
set status = 'error',
    error  = 'انتهت مهلة المعالجة. أعد المحاولة، وإن تكرر الأمر تواصل مع الدعم.'
where status = 'pending'
  and created_at < now() - interval '15 minutes';

-- 3) (اختياري) تنظيف تلقائي كل 5 دقائق — يحتاج تفعيل pg_cron من Database > Extensions:
-- select cron.schedule('close-stuck-review-jobs', '*/5 * * * *', $$
--   update public.review_jobs
--   set status='error', error='انتهت مهلة المعالجة. أعد المحاولة.'
--   where status='pending' and created_at < now() - interval '15 minutes'
-- $$);
