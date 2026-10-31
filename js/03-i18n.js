/**
 * 03-i18n.js — Internationalisation (Arabic/English dictionary, DOM translation) and colour palettes.
 */
/* exported setLang */
let lang = "ar";
try {
  lang = localStorage.getItem("mk-lang") || "ar";
} catch (e) {}

/**
 * Arabic-to-English translation dictionary for UI labels, messages, and sample report strings.
 * @type {Record<string, string>}
 */
const EN = {
  الخدمات: "Services",
  "كيف تعمل": "How it works",
  "شرح مبسّط": "Plain explanations",
  اسأل: "Ask",
  "المصادر والخصوصية": "Sources & privacy",
  "ابدأ المراجعة": "Start review",
  "منصة قانونية عربية": "Arabic legal platform",
  "افهم عقدك قبل": "Understand your contract before you sign it",
  "يراجع عقدك بندًا":
    "reviews your contract clause by clause, flags risks, and explains each point in plain language backed by documented legal sources.",
  "راجع عقدك الآن": "Review your contract now",
  "اقرأ الشرح": "Read the plain explanations",
  "نطاق الخدمة": "Current scope",
  "عقود الإيجار": "Residential lease contracts between individuals",
  "عقود بيع": "Car sale contracts between individuals",
  "للأفراد وا": "For individuals, lawyers and legal researchers",
  "سواء كان": "Signed or not yet signed",
  "أربع خدمات": "Four services in one place",
  "اختر ما تحتاجه": "Choose what you need; contract review is the main path.",
  "مراجعة العقود": "Contract review",
  "تحليل البنود":
    "Clause analysis, risk grading and suggested edits for your situation.",
  "صياغة العقود": "Contract drafting",
  "مسودة منظمة":
    "A structured draft reflecting common provisions for the contract type.",
  "البحث القانوني": "Legal research",
  "إجابات مبنية":
    "Answers built on an internal source library, with external search when needed.",
  "ترجمة العقود": "Contract translation",
  "ترجمة قانونية":
    "Legal translation with consistent terminology between Arabic and English.",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "آلية العمل": "Process",
  "من الملف": "From file to a clear report",
  "حدّد السياق": "Set the context",
  "نوع العقد، وهل":
    "Contract type, whether you have signed, and your role: individual or legal professional.",
  "ارفع العقد": "Upload the contract",
  "ملف PDF": "A PDF, Word file, or clear page images.",
  "قراءة وفحص": "Read and check",
  "استخراج البنود": "Extract the clauses and match them against legal sources.",
  "تقرير مفصّل": "Detailed report",
  "مخاطر مرتبة":
    "Ranked risks, why each matters, its effect, and the next step.",
  "ابدأ الآن": "Get started",
  "اختر الخدمة": "Choose a service",
  "نسخة تجريبية أكاديمية:": "Academic trial version:",
  "هذه المنصة لأغراض العرض والتجربة فقط":
    "This platform is for academic demonstration and testing only — do not upload real names, national IDs, addresses, or personal data; use sample data only.",
  "مراجعة عقد": "Review a contract",
  "صياغة عقد": "Draft a contract",
  "بحث قانوني": "Legal research",
  "ترجمة عقد": "Translate a contract",
  صفتك: "Your role",
  "شخص عادي": "General user",
  "قانوني / باحث": "Legal professional / researcher",
  "نوع العقد": "Contract type",
  "إيجار سكني": "Residential lease",
  "بيع سيارة": "Car sale",
  "حالة العقد": "Contract status",
  "لم أوقّع": "Not signed yet",
  "وقّعت بالفعل": "Already signed",
  "السماح بالبحث الخارجي عندما":
    "Allow external search when internal sources are not enough (currently unavailable). External results are marked “needs verification”.",
  "ملف العقد": "Contract file",
  "اسحب الملف": "Drag the file here",
  "PDF أو Word": "PDF, Word, or image — up to 20 MB",
  "اختيار ملف": "Choose file",
  "يُستخدم الملف":
    "Your file is used only to prepare your review and is never shown to other users.",
  "ارفع ملفًا": "Upload a file to continue",
  إرسال: "Send",
  "طلب جديد": "New request",
  "ابدأ مراجعة العقد": "Start contract review",
  "مصطلحات العقود": "Contract terms in simple words",
  "معلومات عامة":
    "General information for awareness; details vary with each contract’s text and circumstances.",
  "مبلغ التأمين": "Security deposit",
  "مبلغ يدفعه":
    "An amount the tenant pays as security for rent and repair of any damage, refunded at the end of the contract after deducting only what is due.",
  انتبه: "Note",
  "إلى مدة الرد":
    "the refund deadline, the deduction criteria, and how the unit’s condition at handover is documented.",
  "التجديد التلقائي": "Automatic renewal",
  "بند يجعل":
    "A clause that extends the contract for a new term unless one party notifies the other.",
  "إلى مهلة الإخطار":
    "the notice period and method; their absence invites disputes. In general, a lease may be treated as renewed if the tenant keeps using the property with the landlord’s knowledge and no objection.",
  "الشرط الجزائي": "Penalty clause (agreed compensation)",
  "تعويض يتفق": "Compensation the parties agree in advance for breach.",
  "إلى مقداره":
    "the amount; a judge may reduce it if it is shown to be excessive.",
  "الفرق بين": "Signed vs. unsigned contracts",
  "قبل التوقيع يمكنك":
    "Before signing you can negotiate and request changes. After signing, the contract is binding, so the goal shifts to understanding your obligations, documenting correspondence and deadlines, and handling existing risks.",
  "هل التقرير": "Is the report a substitute for a lawyer?",
  "لا. المراجعة":
    "No. A preliminary review helps you understand and decide; large or complex matters still need a qualified lawyer.",
  الثقة: "Trust",
  "مصادر موثقة": "Documented sources, protected privacy",
  "مكتبة داخلية": "Internal library first",
  "تبدأ كل":
    "Every review starts from the platform’s legal source library, and each note is attributed to its source.",
  "بحث خارجي": "Conditional external search",
  "لا يُستخدم":
    "The web is used only when needed and with your consent; results are marked “external source — needs verification”.",
  "خصوصية ملفاتك": "Your files stay private",
  "ملفاتك تُستخدم":
    "Your files are used only to prepare your review and are never shown to any other user.",
  "تنبيه قانوني": "Legal notice:",
  "المحتوى والتقارير":
    "Content and reports on the platform are a preliminary review for awareness and understanding, not legal advice, and do not create a lawyer–client relationship. Consult a qualified lawyer before making material decisions.",
  "— جميع": "— All rights reserved.",
  المساعد: "Assistant",
  "اسأل المساعد": "Ask the legal assistant",
  "اسأل عن بند":
    "Ask about a clause in your contract or a legal question, and get an answer in the style that suits you.",
  "أسلوب الإجابة": "Answer style",
  "مبسّط للشخص": "Simple, for general users",
  "مهني للقانوني": "Professional, for legal users",
  "نوع السؤال": "Question type",
  "سؤال عن عقد": "About a contract",
  "اكتب سؤالك أو":
    "Type your question or pick an example. Answers are informational, not legal advice.",
  "اكتب سؤالك": "Type your question…",
  "اسمح بالبحث":
    "Allow external search when needed — currently unavailable (marked “needs verification”).",
  "معاينة: سيصلك":
    "Preview: the live answer will arrive once the assistant is enabled, in plain language with clear practical steps.",
  "نسخة معاينة":
    "Preview: the live answer will arrive once the assistant is enabled, in professional wording with references to provisions and sources.",
  "تعذّر إرسال": "Could not send your question. Please try again.",
  "هل يحق للمؤجر": "Can a landlord keep the security deposit?",
  "ما أثر غياب":
    "What is the effect of a missing notice period in an automatic-renewal clause?",
  "ما الذي يجب": "What should I check before buying a used car?",
  "ما سلطة القاضي": "What is a judge’s power to reduce agreed compensation?",
  "اكتب النص": "Write the text first.",
  "تم استلام طلبك":
    "Your request has been received. The result will appear here when processing completes.",
  "حجم الملف": "File is larger than 20 MB.",
  "صيغة الملف": "Unsupported file type.",
  "تعذّر إكمال": "Could not complete the review. Please try again.",
  "رفع الملف": "Uploading",
  "قراءة البنود": "Reading clauses",
  "فحص المصادر": "Checking sources",
  "إعداد التقرير": "Preparing report",
  "صِف العقد":
    "Describe the contract you need (type, parties, term, special conditions)",
  "مثال: عقد إيجار":
    "Example: a one-year residential lease between two individuals…",
  "اكتب سؤالك القانوني": "Write your legal question",
  "مثال: ما مدة": "Example: what notice period ends a residential lease?",
  "ألصق نص": "Paste the contract text to translate",
  "الصق النص": "Paste text here…",
  "فعّل البحث":
    "Enable external search when internal sources are not enough (currently unavailable).",
  "اتجاه الترجمة": "Translation direction",
  "من العربية إلى": "Arabic to English",
  "من الإنجليزية": "English to Arabic",
  "قبل التوقيع": "Before signing",
  "بعد التوقيع": "After signing",
  "تقرير مراجعة": "Contract review report",
  "مراجعة أولية": "Preliminary review — not legal advice",
  "هذه عيّنة":
    "This is an illustrative sample of the report format; the uploaded file was not analysed in this version.",
  "راجع عقدًا": "Review another contract",
  "لماذا ظهر": "Why was it flagged?",
  "الأثر العملي": "Practical impact",
  "ما الذي تفعله": "What should you do now?",
  "التعديل المقترح": "Suggested change for negotiation",
  "مصدر خارجي": "External source — needs verification",
  "المصدر: مكتبة": "Source: internal source library",
  مرتفع: "High",
  متوسط: "Medium",
  منخفض: "Low",
  "المادة ٣": "Clause 3",
  "المادة ٥": "Clause 5",
  "المادة ٢": "Clause 2",
  "رد مبلغ": "Security deposit refund",
  "تحديد الأجرة": "Rent amount",
  "«لا يُرد":
    "“The deposit is refunded only after the term ends, at the landlord’s discretion.”",
  "«يتجدد":
    "“The contract renews automatically unless either party notifies the other.”",
  "«تكون الأجرة": "“The rent is five thousand Egyptian pounds per month.”",
  "الرد متروك":
    "The refund is left to one party’s discretion, with no clear deadline or standard for inspection and deductions.",
  "قد يتأخر":
    "Recovery of the amount may be delayed or disputed over deductions.",
  "اطلب تحديد":
    "Ask for a refund deadline, deduction criteria, and a signed handover record of the unit’s condition.",
  "وثّق حالة":
    "Document the unit’s condition and correspondence, check the refund due date, and keep proof of handover and deductions.",
  "لا يحدد البند":
    "The clause sets neither a notice period nor a method, inviting disputes.",
  "قد تلتزم":
    "You may become bound to a new term without noticing the notice deadline.",
  "حدّد مهلة":
    "Set a written notice period and a clear delivery method before renewal.",
  "سجّل موعد":
    "Note the notice date in your calendar and send any notice in writing by a method that proves receipt.",
  "القيمة والدورية":
    "Amount and frequency are clear; no direct risk appears from the text alone.",
  "يبقى مهمًا": "It remains important to fix the due date and payment method.",
  "أضف تاريخ": "Add the due date and payment method if not stated.",
  "احتفظ بإثبات": "Keep proof and receipts for every payment.",
};
Object.assign(EN, {
  حسابي: "My account",
  سجلّي: "My history",
  "مراجعاتك وصياغاتك":
    "Your saved reviews, drafts, research and chats. Only you can see them, and you can delete any item.",
  الكل: "All",
  المراجعات: "Reviews",
  الصياغة: "Drafts",
  الأبحاث: "Research",
  المحادثات: "Chats",
  "لا توجد سجلات": "No saved items yet.",
  "تعذّر تحميل": "Could not load your history.",
  "تسجيل الدخول": "Sign in",
  "سجّل الدخول للمتابعة": "Sign in to continue.",
  "انتهت الجلسة": "Your session has expired. Please sign in again.",
  "الدخول إلى حسابك": "Sign in to your account",
  "حساب جديد": "Create account",
  "الاسم الكامل": "Full name",
  "البريد الإلكتروني": "Email",
  "كلمة السر": "Password",
  "كلمة السر 8": "Password must be at least 8 characters.",
  "كلمة السر ضعيفة": "Password is too weak. Use at least 8 characters.",
  "8 أحرف":
    "At least 8 characters. By signing up you agree that the platform’s output is a preliminary review, not legal advice.",
  دخول: "Sign in",
  "إنشاء الحساب": "Create account",
  "هل نسيت كلمة المرور": "Forgot your password?",
  خروج: "Sign out",
  "تم تسجيل الخروج": "Signed out.",
  "لم يُضبط مفتاح": "The public Supabase key has not been configured.",
  "تم إنشاء الحساب":
    "Account created. Check your email to confirm it, then sign in.",
  "البريد أو كلمة": "Incorrect email or password.",
  "هذا البريد مسجّل": "This email is already registered. Please sign in.",
  "فعّل بريدك":
    "Please confirm your email first using the message we sent you.",
  "محاولات كثيرة": "Too many attempts. Please wait a moment.",
  "تعذّر إتمام": "Could not complete the request. Please try again.",
  "أرسلنا رابط": "If this email is registered, we have sent a reset link.",
  "اكتب بريدك": "Enter your email first.",
  "المساعد غير مفعّل": "The assistant is not enabled yet.",
  "عقد إيجار سكني": "Residential lease contract",
  "عقد بيع سيارة": "Car sale contract",
  "عقد إيجار شقة سكنية": "Residential apartment lease",
  المستأجر: "Tenant",
  المؤجر: "Landlord",
  المشتري: "Buyer",
  البائع: "Seller",
  مستأجر: "Tenant",
  مؤجر: "Landlord",
  مشتري: "Buyer",
  بائع: "Seller",
  "نص العقد (اختياري":
    "Contract text (optional — you can upload a file instead)",
  "ارفع ملف العقد أو الصق نصه للمتابعة":
    "Upload a contract file or paste its text to continue",
  "أكمل الحقول": "Please complete the required fields.",
  "الطرف الأول": "First party — full name, national ID and residence",
  "الطرف الثاني": "Second party — full name, national ID and residence",
  "السيارة - الماركة": "Car — make, model, year and color",
  "السيارة - رقم اللوحات":
    "Car — plates, license number and licensing authority",
  "السيارة - رقم الشاسيه": "Car — chassis and motor numbers",
  "السيارة - الثمن": "Car — total agreed price and payment method",
  "السيارة - تاريخ": "Car — handover date/time and possession transfer",
  "العقار - العنوان": "Property — detailed address, apartment and floor",
  "العقار - القيمة": "Property — monthly rent and due date",
  "العقار - مبلغ": "Property — cash security deposit",
  "العقار - تاريخ بدء": "Property — lease start date",
  "العقار - تاريخ انتهاء": "Property — lease end date and term",
  "القانون الواجب": "Governing law",
  "المحكمة المختصة": "Competent court",
  "أو الصق نص العقد": "Or paste the contract text",
  "شروط العقد":
    "Contract terms and details (term, consideration, special conditions)",
  "بيانات الطرف الأول": "First party details",
  "بيانات الطرف الثاني": "Second party details",
  "خدمة الترجمة": "The translation service is not enabled yet.",
  "جارٍ المعالجة": "Processing…",
  "تعذّر إرسال الطلب": "Could not send the request. Please try again.",
  "نوع العقد محل": "Contract type under consultation",
  "صفة السائل": "Asker’s role",
});
const EK = Object.keys(EN).sort((a, b) => b.length - a.length);

/**
 * Looks up an English translation for an Arabic string `x` using exact match first,
 * falling back to longest-prefix match (for keys longer than 5 characters).
 * @param {string} x Arabic source string.
 * @returns {string|undefined} Matching English string or undefined if not found.
 */
const look = (x) => {
  x = x.trim();
  if (EN[x]) return EN[x];
  const k = EK.find((k) => k.length > 5 && x.startsWith(k));
  return k && EN[k];
};

/**
 * Translates an Arabic UI string into English when `lang === "en"`, or returns the original Arabic string.
 * @param {string} x Arabic string key/text.
 * @returns {string} Localized string for the active language.
 */
const t = (x) => (lang === "en" && look(x)) || x;

/**
 * Walks all text nodes under root element `r` (or `document.body`), caching each node's original
 * Arabic text in `n.__o` and replacing it with the active language translation.
 * @param {Node} [r] Optional root DOM node to translate.
 * @returns {void}
 */
function tr(r) {
  const w = document.createTreeWalker(r || document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) continue;
    if (n.__o === undefined) n.__o = n.nodeValue;
    const o = n.__o,
      k = o.trim();
    if (!k) continue;
    const e = lang === "en" && look(k);
    n.nodeValue = e ? o.replace(k, () => e) : o;
  }
}
const PN = {
  ar: ["كلاسيكي", "زمردي", "عنابي", "رمادي", "ليلي"],
  en: ["Classic", "Emerald", "Burgundy", "Slate", "Night"],
};

/**
 * Applies the current language (`lang`) to document attributes (`lang`, `dir`), brand elements,
 * page title, palette tooltips, and quick-question chips.
 * @returns {void}
 */
function applyLang() {
  const en = lang === "en",
    h = document.documentElement;
  h.lang = lang;
  h.dir = en ? "ltr" : "rtl";
  tr(document.body);
  const nm = en ? CONFIG.nameEn : CONFIG.name;
  $$("[data-brand]").forEach((e) => (e.textContent = nm));
  $$(".mk").forEach((e) => (e.textContent = en ? "M" : "م"));
  document.title =
    nm + (en ? " — Arabic legal platform" : " — منصة قانونية عربية");
  $("#lg").textContent = en ? "عربي" : "EN";
  $("#cm").placeholder = t("اكتب سؤالك…");
  $$("#sw button").forEach((b, i) => (b.title = PN[lang][i]));
  chips();
}

/**
 * Toggles the interface language between Arabic (`"ar"`) and English (`"en"`), persists the choice
 * in `localStorage`, and refreshes any open report or service tab.
 * @returns {void}
 */
function setLang() {
  lang = lang === "ar" ? "en" : "ar";
  try {
    localStorage.setItem("mk-lang", lang);
  } catch (e) {}
  applyLang();
  APP_STATE.quiet = true;
  if (APP_STATE.data && !$("#rep").classList.contains("h")) render();
  APP_STATE.quiet = false;
  if (APP_STATE.tab && !$("#pOther").classList.contains("h")) {
    const v = $("#oT").value;
    tab(APP_STATE.tab);
    $("#oT").value = v;
  }
}
const _pick = pick;
pick = function (i) {
  _pick(i);
  tr($("#rd"));
};

/**
 * Activates a color palette (`classic`, `emerald`, `burgundy`, `slate`, or `night`), updates
 * `data-pal` and `data-theme` on `<html>`, and persists the selection in `localStorage`.
 * @param {string} p Palette identifier.
 * @returns {void}
 */
function setPal(p) {
  const h = document.documentElement;
  h.dataset.pal = p;
  h.dataset.theme = p === "night" ? "dark" : "light";
  try {
    localStorage.setItem("mk-pal", p);
  } catch (e) {}
  $$("#sw button").forEach((b) => b.classList.toggle("on", b.dataset.p === p));
}
$$("#sw button").forEach((b) => (b.onclick = () => setPal(b.dataset.p)));
let sp;
try {
  sp = localStorage.getItem("mk-pal");
} catch (e) {}
if (sp) setPal(sp);
else $("#sw button").classList.add("on");
APP_STATE.ca = "general";
APP_STATE.ck = "contract";
APP_STATE.hist = [];
