/**
 * 04-api-analysis.js — Chat chips, webhook client (hook / hookAsync), result normalisation and the analyze() flow.
 */
/* exported add, hookAsync, analyze, readTxt, txt */
const CHAT_EXAMPLES = {
  general: {
    contract: "هل يحق للمؤجر الاحتفاظ بمبلغ التأمين؟",
    research: "ما الذي يجب التأكد منه قبل شراء سيارة مستعملة؟",
  },
  legal: {
    contract: "ما أثر غياب مهلة الإخطار في بند التجديد التلقائي؟",
    research: "ما سلطة القاضي في تخفيض التعويض الاتفاقي؟",
  },
};
function chips() {
  const q = CHAT_EXAMPLES[APP_STATE.ca][APP_STATE.ck],
    b = document.createElement("button");
  b.className = "chip";
  b.textContent = t(q);
  b.onclick = () => ask(t(q));
  $("#chips").replaceChildren(b);
}
$$("#cA button,#cK button").forEach((b) => b.addEventListener("click", chips));
function add(x, c) {
  const d = document.createElement("div");
  d.className = "m " + c;
  d.textContent = x;
  $("#msgs").append(d);
  $("#msgs").scrollTop = 1e5;
  return d;
}
// ملاحظة: مسار web ثابت في الـ Webhook node، ويلزم تفعيل (Active) الـ workflow
// ===== ربط الواجهة بـ n8n (كل الطلبات عبر Webhooks فقط — لا توجد مفاتيح API في الكود) =====
// Webhook endpoints and the single authentication header used by every backend request.
// AUTH_HEADERS: see config.js
// WH (webhook endpoints): see config.js
// Unified webhook POST helper: use the signed-in Supabase session token when available.
/**
 * POSTs to an n8n webhook with the signed-in user's Supabase access token.
 * - Sends JSON, or multipart when `body` is a FormData (file uploads).
 * - Aborts after `ms` (default 90s).
 * - Errors carry a user-friendly Arabic `userMsg` (network / 401 / 403 / 404 / other).
 * @param {string} url  webhook endpoint (see WH in config.js)
 * @param {object|FormData} body request payload
 * @param {number} [ms] timeout in milliseconds
 * @returns {Promise<object|string>} parsed JSON when possible, otherwise raw text
 */
async function hook(url, body, ms) {
  const abortController = new AbortController(),
    timeoutHandle = setTimeout(() => abortController.abort(), ms || 90000);
  try {
    const tok = await getTok();
    if (!tok) {
      openAuth("انتهت الجلسة، سجّل الدخول من جديد.");
      throw new Error("auth");
    }
    const headers = Object.assign({}, AUTH_HEADERS, {
      Authorization: "Bearer " + tok,
    });
    const requestOptions = {
      method: "POST",
      signal: abortController.signal,
      headers,
    };
    if (body instanceof FormData) requestOptions.body = body;
    else {
      requestOptions.headers["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(body);
    }
    let response;
    try {
      response = await fetch(url, requestOptions);
    } catch (e) {
      console.error("hook fetch failed", url, e);
      const networkError = new Error("net");
      networkError.userMsg =
        e && e.name === "AbortError"
          ? "الخدمة لم ترد في الوقت المحدد. حاول مرة أخرى بعد قليل. "
          : "تعذّر الاتصال بالخدمة. تحقق من الإنترنت وحاول مرة أخرى. ";
      throw networkError;
    }
    const responseText = await response.text();
    if (!response.ok) {
      console.error(
        "hook HTTP",
        response.status,
        url,
        responseText.slice(0, 300),
      );
      const httpError = new Error("HTTP " + response.status);
      httpError.userMsg =
        response.status === 404
          ? "الخدمة غير متاحة حاليًا. حاول لاحقًا. "
          : response.status === 401
            ? "انتهت الجلسة. سجّل الدخول من جديد. "
            : response.status === 403
              ? "لا تملك صلاحية تنفيذ هذا الطلب. "
              : "حدث خطأ في الخدمة. حاول مرة أخرى. ";
      throw httpError;
    }
    try {
      return JSON.parse(responseText);
    } catch (e) {
      return responseText;
    }
  } finally {
    clearTimeout(timeoutHandle);
  }
}
// استخراج نص الرد من أي شكل يرجعه n8n
const rawTxt = (responseData) => {
  if (Array.isArray(responseData)) responseData = responseData[0];
  if (responseData == null) return "";
  const responseValue =
    typeof responseData === "string"
      ? responseData
      : responseData.final_answer ||
        responseData.answer ||
        responseData.output ||
        responseData.text ||
        responseData.message ||
        responseData.response ||
        responseData.result;
  return typeof responseValue === "string"
    ? responseValue
    : JSON.stringify(responseData, null, 2);
};
const isH = (v) => /<[a-z][\s\APP_STATE]*>/i.test(v);
const extractPlainText = (responseData) => {
  let v = rawTxt(responseData);
  if (isH(v)) {
    v = v
      .replace(/<(style|script)[\s\APP_STATE]*?<\/\1>/gi, "")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/(p|div|h[1-6]|li|tr|ul|ol|table)>|<br\s*\/?>/gi, "\n");
    v = new DOMParser()
      .parseFromString(v, "text/html")
      .body.textContent.replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return v;
};
const OKT =
  /^(H[1-6]|P|UL|OL|LI|STRONG|B|EM|I|BR|TABLE|THEAD|TBODY|TR|TD|TH|DIV|SPAN|PRE|BLOCKQUOTE|HR)$/;
function cln(n, o) {
  n.childNodes.forEach((c) => {
    if (c.nodeType === 3) o.append(c.nodeValue);
    else if (c.nodeType === 1) {
      if (/^(SCRIPT|STYLE|HEAD|TITLE)$/.test(c.nodeName)) return;
      if (OKT.test(c.nodeName)) {
        const e = document.createElement(c.nodeName);
        cln(c, e);
        o.append(e);
      } else cln(c, o);
    }
  });
}
function show(el, v) {
  el.replaceChildren();
  const h = isH(v);
  el.style.whiteSpace = h ? "normal" : "pre-wrap";
  if (h) cln(new DOMParser().parseFromString(v, "text/html").body, el);
  else el.textContent = v;
}

// طلب غير متزامن عام: ينشئ مهمة في Supabase، يرسل الطلب (الرد فوري)، ثم يسحب النتيجة
/**
 * Long-running job pattern (review / research / draft / translate):
 *  1. INSERT a row in `review_jobs` (status=pending) → its id becomes `job_id`.
 *  2. POST the payload (+ job_id) to the webhook; n8n acknowledges immediately.
 *  3. Poll `review_jobs` every 4s (max 10 min) until status is `done` (returns report) or `error`.
 * @param {string} url webhook endpoint
 * @param {object|FormData} body payload
 * @returns {Promise<string>} the finished report (HTML/text)
 */
async function hookAsync(url, body) {
  const jobId = crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
        const randomNibble = (Math.random() * 16) | 0;
        return (
          character === "x" ? randomNibble : (randomNibble & 3) | 8
        ).toString(16);
      });
  const accessToken = await getTok();
  if (!accessToken) {
    openAuth("انتهت الجلسة، سجّل الدخول من جديد.");
    const authError = new Error("auth");
    authError.userMsg = "سجّل الدخول أولًا ثم أعد المحاولة.";
    throw authError;
  }
  const response = await fetch(AUTH.url + "/rest/v1/review_jobs", {
    method: "POST",
    headers: {
      apikey: AUTH.anon,
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ jobId, status: "pending" }),
  });
  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch (e) {}
    console.error("review_jobs insert failed", response.status, errorBody);
    const insertError = new Error("job");
    insertError.userMsg =
      response.status === 404
        ? "الخدمة غير متاحة حاليًا. حاول لاحقًا. "
        : "تعذّر بدء الطلب. ";
    throw insertError;
  }
  if (body instanceof FormData) body.append("job_id", jobId);
  else body = Object.assign({}, body, { job_id: jobId });
  await hook(url, body, 60000);
  const pollingStartedAt = Date.now();
  while (Date.now() - pollingStartedAt < 600000) {
    await new Promise((x) => setTimeout(x, 4000));
    let rows = [];
    try {
      rows = await rest(
        "GET",
        "review_jobs?id=eq." + jobId + "&select=status,report,error",
      );
    } catch (e) {
      continue;
    }
    const jobRow = rows && rows[0];
    if (!jobRow) continue;
    if (jobRow.status === "done" && jobRow.report) return jobRow.report;
    if (jobRow.status === "error") {
      const jobError = new Error("job");
      jobError.userMsg = jobRow.error || "تعذّر إكمال الطلب.";
      throw jobError;
    }
  }
  const timeoutError = new Error("timeout");
  timeoutError.userMsg = "الطلب أخذ وقتًا أطول من المتوقع. حاول مرة أخرى.";
  throw timeoutError;
}
// 1) مراجعة عقد: multipart/form-data بالحقول contract_type / user_role / contract_text / contract_file
async function analyze() {
  // 1) أنشئ مهمة في Supabase  2) أرسل الطلب (الرد فوري)  3) اسحب التقرير لحد ما يجهز
  const jobId = crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
        const randomNibble = (Math.random() * 16) | 0;
        return (
          character === "x" ? randomNibble : (randomNibble & 3) | 8
        ).toString(16);
      });
  {
    const accessToken = await getTok();
    if (!accessToken) {
      openAuth("انتهت الجلسة، سجّل الدخول من جديد.");
      const er = new Error("auth");
      er.userMsg = "سجّل الدخول أولًا ثم أعد المحاولة.";
      throw er;
    }
    const response = await fetch(AUTH.url + "/rest/v1/review_jobs", {
      method: "POST",
      headers: {
        apikey: AUTH.anon,
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ jobId, status: "pending" }),
    });
    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch (e) {}
      console.error("review_jobs insert failed", response.status, errorBody);
      const insertError = new Error("job");
      insertError.userMsg =
        response.status === 404
          ? "الخدمة غير متاحة حاليًا. حاول لاحقًا. "
          : response.status === 401 || response.status === 403
            ? "انتهت الجلسة أو لا تملك صلاحية. سجّل الدخول من جديد. "
            : "تعذّر بدء المراجعة. ";
      throw insertError;
    }
  }
  const formData = new FormData();
  formData.append("job_id", jobId);
  formData.append("contract_type", APP_STATE.type);
  formData.append("user_role", APP_STATE.role);
  formData.append("allow_web_search", APP_STATE.web ? "true" : "false");
  formData.append("contract_text", $("#ct").value.trim());
  if (APP_STATE.file)
    formData.append("file", APP_STATE.file, APP_STATE.file.name);
  await hook(WH.review, formData, 60000);
  const pollingStartedAt = Date.now();
  while (Date.now() - pollingStartedAt < 600000) {
    await new Promise((r) => setTimeout(r, 4000));
    let rows = [];
    try {
      rows = await rest(
        "GET",
        "review_jobs?id=eq." + jobId + "&select=status,report,error",
      );
    } catch (e) {
      continue;
    }
    const jobRow = rows && rows[0];
    if (!jobRow) continue;
    if (jobRow.status === "done" && jobRow.report)
      return { text: jobRow.report };
    if (jobRow.status === "error") {
      const jobError = new Error("job");
      jobError.userMsg = jobRow.error || "تعذّر إكمال المراجعة.";
      throw jobError;
    }
  }
  const timeoutError = new Error("timeout");
  timeoutError.userMsg = "المراجعة أخذت وقتًا أطول من المتوقع. حاول مرة أخرى.";
  throw timeoutError;
}
// زر البدء يعتمد على نص العقد (الـ workflow يقرأ النص المكتوب؛ ملفات PDF/الصور تُستلم فقط)
function goSync() {
  const on = !!$("#ct").value.trim() || !!APP_STATE.file;
  $("#go").disabled = !on;
  $("#go").textContent = on
    ? "ابدأ مراجعة العقد"
    : "ارفع ملف العقد أو الصق نصه للمتابعة";
  tr($("#go"));
}
function readTxt(f) {
  if (!/\.txt$/i.test(f.name)) return;
  const r = new FileReader();
  r.onload = () => {
    $("#ct").value = String(r.result).slice(0, 60000);
    goSync();
  };
  r.readAsText(f);
}
$("#ct").addEventListener("input", goSync);
// الدور يتبع نوع العقد: مستأجر/مؤجر للإيجار، مشتري/بائع للسيارة
function syncRole() {
  const lease = APP_STATE.type === "عقد إيجار سكني",
    ok = lease ? ["المستأجر", "المؤجر"] : ["المشتري", "البائع"];
  if (!ok.includes(APP_STATE.role)) APP_STATE.role = ok[0];
  $$('.seg[data-k="role"] button').forEach((b) => {
    b.disabled = !ok.includes(b.dataset.v);
    b.classList.toggle("on", b.dataset.v === APP_STATE.role);
  });
}
$$('.seg[data-k="type"] button').forEach((b) =>
  b.addEventListener("click", syncRole),
);
syncRole();
// عرض الرد النصي من n8n (بـ textContent لمنع أي حقن HTML)
const _render = render;
render = function () {
  const reportData = APP_STATE.data;
  if (!reportData.text) return _render();
  $("#prog").classList.add("h");
  const reportElement = $("#rep");
  reportElement.classList.remove("h");
  reportElement.innerHTML =
    '<div class="bar"><div><h3>تقرير مراجعة العقد</h3><p></p></div><span class="pill">مراجعة أولية — ليست استشارة قانونية</span></div><div class="card rich" id="rt"></div><button class="btn o" style="margin-top:18px" onclick="again()">راجع عقدًا آخر</button>';
  reportElement.querySelector("p").textContent = t(APP_STATE.type);
  tr(reportElement);
  if (/<html[\s>]/i.test(reportData.text)) {
    const f = document.createElement("iframe");
    f.setAttribute("sandbox", "allow-same-origin");
    f.style.cssText =
      "width:100%;border:0;min-height:480px;background:#fff;border-radius:12px";
    f.srcdoc = reportData.text;
    f.onload = () => {
      try {
        f.style.height =
          f.contentDocument.documentElement.scrollHeight + 24 + "px";
      } catch (e) {}
    };
    $("#rt").replaceChildren(f);
  } else show($("#rt"), reportData.text);
  if (!APP_STATE.quiet) reportElement.scrollIntoView({ behavior: "smooth" });
};

// 2) و3) صياغة عقد + بحث قانوني: حقول إضافية في الواجهة

// ===== صياغة عقد: الحقول بنفس أسماء (fieldName) في Form الـ n8n =====
