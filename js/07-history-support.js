/**
 * 07-history-support.js — History (Supabase REST), source rendering, support tickets and ticket list.
 */
/* exported saveH, addSources, sendSupport, tkToggle */
// ===== السجل: يُحفظ في جدول history بـ Supabase بصلاحيات المستخدم نفسه (RLS: كل مستخدم يرى سجله فقط) =====
/**
 * Minimal Supabase PostgREST client. Runs with the USER's token, so Row Level
 * Security decides what is visible. Throws 0 when signed out or on non-2xx.
 * @param {"GET"|"POST"|"PATCH"|"DELETE"} method
 * @param {string} path table + query, e.g. "history?select=*&order=created_at.desc"
 * @param {object} [body] JSON body for writes
 */
async function rest(method, path, body) {
  const accessToken = await getTok();
  if (!accessToken) throw 0;
  const r = await fetch(AUTH.url + "/rest/v1/" + path, {
    method,
    headers: {
      apikey: AUTH.anon,
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw 0;
  return method === "GET" ? r.json() : null;
}
async function saveH(kind, title, input, output) {
  if (!SES || !AUTH.anon) return;
  try {
    await rest("POST", "history", {
      kind,
      title: String(title || "").slice(0, 120),
      input,
      output: String(output || "").slice(0, 200000),
    });
    loadH();
  } catch (e) {}
}
async function loadH() {
  const historyList = $("#hl");
  if (!SES) return;
  APP_STATE.H = APP_STATE.H || [];
  try {
    APP_STATE.H = await rest(
      "GET",
      "history?select=id,kind,title,output,created_at&order=created_at.desc&limit=50",
    );
    drawH();
  } catch (e) {
    historyList.textContent = t("تعذّر تحميل السجل.");
  }
}
const HK = {
  review: ["مراجعة", "Review"],
  draft: ["صياغة", "Draft"],
  research: ["بحث", "Research"],
  chat: ["محادثة", "Chat"],
};
function drawH() {
  const historyList = $("#hl"),
    historyFilter = APP_STATE.hf || "all",
    en = lang === "en";
  historyList.replaceChildren();
  const historyItems = (APP_STATE.H || []).filter(
    (historyItem) =>
      historyFilter === "all" || historyItem.kind === historyFilter,
  );
  if (!historyItems.length) {
    historyList.textContent = t("لا توجد سجلات بعد.");
    return;
  }
  historyItems.forEach((historyEntry) => {
    const itemElement = document.createElement("div"),
      headerElement = document.createElement("div"),
      typePill = document.createElement("span"),
      titleElement = document.createElement("b"),
      dateElement = document.createElement("small"),
      viewButton = document.createElement("button"),
      deleteButton = document.createElement("button"),
      bodyElement = document.createElement("div");
    itemElement.className = "hi2";
    headerElement.className = "hh";
    typePill.className = "pill";
    typePill.textContent = (HK[historyEntry.kind] || [
      historyEntry.kind,
      historyEntry.kind,
    ])[en ? 1 : 0];
    titleElement.textContent = historyEntry.title || "";
    dateElement.textContent = new Date(historyEntry.created_at).toLocaleString(
      en ? "en-GB" : "ar-EG",
    );
    viewButton.className = deleteButton.className = "mini";
    viewButton.textContent = en ? "View" : "عرض";
    deleteButton.textContent = en ? "Delete" : "حذف";
    bodyElement.className = "hb rich h";
    viewButton.onclick = () => {
      if (bodyElement.classList.contains("h")) {
        show(bodyElement, historyEntry.output || "");
        bodyElement.classList.remove("h");
        viewButton.textContent = en ? "Hide" : "إخفاء";
      } else {
        bodyElement.classList.add("h");
        viewButton.textContent = en ? "View" : "عرض";
      }
    };
    deleteButton.onclick = async () => {
      if (
        !confirm(
          en ? "Delete this item permanently?" : "حذف هذا السجل نهائيًا؟",
        )
      )
        return;
      try {
        await rest(
          "DELETE",
          "history?id=eq." + encodeURIComponent(historyEntry.id),
        );
        APP_STATE.H = APP_STATE.H.filter((y) => y.id !== historyEntry.id);
        drawH();
      } catch (e) {
        toast("تعذّر إرسال الطلب. حاول مرة أخرى.");
      }
    };
    headerElement.append(
      typePill,
      titleElement,
      dateElement,
      viewButton,
      deleteButton,
    );
    itemElement.append(headerElement, bodyElement);
    historyList.append(itemElement);
  });
}
$$("#hs button").forEach((b) => b.addEventListener("click", drawH));
// ===== الدعم + عرض المصادر =====
// WH.support: see config.js
function addSources(el, data, txtv) {
  let sourceData = Array.isArray(data) ? data[0] : data,
    sourceEntries =
      sourceData && typeof sourceData === "object"
        ? sourceData.sources ||
          sourceData.references ||
          sourceData.citations ||
          sourceData.results ||
          sourceData.links ||
          []
        : [];
  let items = (Array.isArray(sourceEntries) ? sourceEntries : []).map((it) =>
    typeof it === "string"
      ? { title: it }
      : {
          title: it.title || it.name || it.source || it.file || "",
          url: sourceLink(it.url || it.link || it.href || ""),
          note: it.article || it.snippet || it.description || "",
        },
  );
  const text = String(txtv || ""),
    seen = new Set(items.map((i) => i.url).filter(Boolean));
  [...text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)].forEach((m) => {
    if (!seen.has(m[2])) {
      seen.add(m[2]);
      items.push({ title: m[1], url: m[2] });
    }
  });
  [...text.matchAll(/https?:\/\/[^\s)\]،؛]+/g)].forEach((m) => {
    const sourceUrl = m[0].replace(/[.,]+$/, "");
    if (!seen.has(sourceUrl)) {
      seen.add(sourceUrl);
      let hostname = sourceUrl;
      try {
        hostname = new URL(sourceUrl).hostname;
      } catch (e) {}
      items.push({ title: hostname, url: sourceUrl });
    }
  });
  items = items.filter((i) => i.title || i.url);
  if (!items.length) return;
  const box = document.createElement("div");
  box.className = "ext-sources";
  const sourcesHeading = document.createElement("strong");
  sourcesHeading.textContent = t("المصادر المستند إليها");
  box.append(sourcesHeading);
  items.forEach((it, i) => {
    const row = document.createElement("div");
    row.className = "ext-source";
    const sourceUrl = sourceLink(it.url || "");
    let sourceLinkElement;
    if (sourceUrl) {
      sourceLinkElement = document.createElement("a");
      sourceLinkElement.href = sourceUrl;
      sourceLinkElement.target = "_blank";
      sourceLinkElement.rel = "noopener noreferrer";
      sourceLinkElement.textContent = i + 1 + ". " + (it.title || sourceUrl);
    } else {
      sourceLinkElement = document.createElement("b");
      sourceLinkElement.textContent = i + 1 + ". " + sourceLabel(it.title);
    }
    row.append(sourceLinkElement);
    if (it.note) {
      const sourceNoteElement = document.createElement("small");
      sourceNoteElement.textContent = it.note;
      row.append(sourceNoteElement);
    }
    box.append(row);
  });
  el.append(box);
}
async function sendSupport() {
  const showStatus = (x, ok) => {
    const e = $("#sMsg");
    e.textContent = x ? t(x) : "";
    e.className = "msg" + (ok ? " ok" : "");
  };
  if (needAuth()) return;
  const subject = $("#sS").value.trim(),
    message = $("#sM").value.trim(),
    category = $("#sC").value;
  if (!subject || message.length < 10)
    return showStatus("اكتب الموضوع ورسالة لا تقل عن ١٠ أحرف.");
  const b = $("#sB");
  b.disabled = true;
  showStatus("");
  try {
    const accessToken = await getTok();
    if (!accessToken) throw new Error("auth");
    let jobs = [];
    try {
      jobs = await rest(
        "GET",
        "review_jobs?select=id,status,error&order=created_at.desc&limit=5",
      );
    } catch (e) {
      try {
        jobs = await rest("GET", "review_jobs?select=id,status,error&limit=5");
      } catch (e2) {}
    }
    const context = {
      lang,
      theme: document.documentElement.dataset.theme || "",
      screen: innerWidth + "x" + innerHeight,
      tab: APP_STATE.tab || "review",
      contract_type: APP_STATE.type,
      recent_errors: ERRLOG.slice(),
      recent_jobs: jobs,
    };
    const row = {
      category,
      subject,
      message,
      email: SES.email,
      page_url: location.href.split("#")[0],
      user_agent: navigator.userAgent,
      context,
    };
    const r = await fetch(AUTH.url + "/rest/v1/support_tickets", {
      method: "POST",
      headers: {
        apikey: AUTH.anon,
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
    });
    if (!r.ok) throw new Error("ticket " + r.status);
    const ticketRecord = ((await r.json()) || [])[0] || {};
    try {
      await hook(
        WH.support,
        {
          ticket_id: ticketRecord.id,
          category,
          subject,
          message,
          email: SES.email,
          name: SES.name,
          page_url: row.page_url,
          context,
        },
        30000,
      );
    } catch (e) {
      console.warn("support webhook failed");
    }
    $("#sS").value = "";
    $("#sM").value = "";
    showStatus("تم إرسال رسالتك إلى الدعم، وسنرد عليك على بريدك.", true);
    loadTk();
  } catch (e) {
    console.error(e);
    showStatus("تعذّر إرسال الرسالة. حاول مرة أخرى.");
  } finally {
    b.disabled = false;
  }
}
function tkToggle(h, id) {
  const ticketList = $("#" + (id || "sL"));
  if (!ticketList) return;
  const off = ticketList.classList.toggle("tkoff");
  h.classList.toggle("off", off);
  h.setAttribute("aria-expanded", off ? "false" : "true");
}
var TK = {
  open: ["مفتوحة", "Open"],
  in_progress: ["قيد المعالجة", "In progress"],
  resolved: ["تم الحل", "Resolved"],
  closed: ["مغلقة", "Closed"],
};
async function loadTk() {
  const ticketsList = $("#sL");
  if (!ticketsList) return;
  const ticketCountElement = $("#tkc"),
    en = lang === "en";
  if (ticketCountElement) ticketCountElement.textContent = "";
  if (!SES) {
    ticketsList.textContent = t("سجّل الدخول لمتابعة تذاكرك.");
    return;
  }
  try {
    const tickets = await rest(
      "GET",
      "support_tickets?select=id,subject,status,admin_reply,created_at&order=created_at.desc&limit=10",
    );
    ticketsList.replaceChildren();
    if (!tickets.length) {
      const e = document.createElement("div");
      e.className = "tkempty";
      e.textContent = t("لا توجد تذاكر بعد.");
      ticketsList.append(e);
      return;
    }
    if (ticketCountElement)
      ticketCountElement.textContent = String(tickets.length);
    tickets.forEach((ticket) => {
      const ticketElement = document.createElement("div"),
        ticketHeader = document.createElement("div"),
        statusPill = document.createElement("span"),
        subjectElement = document.createElement("b"),
        dateElement = document.createElement("small");
      ticketElement.className = "hi2 tk tk-" + ticket.status;
      ticketHeader.className = "hh";
      statusPill.className = "pill";
      statusPill.textContent = (TK[ticket.status] || [
        ticket.status,
        ticket.status,
      ])[en ? 1 : 0];
      subjectElement.textContent = ticket.subject;
      dateElement.textContent = new Date(ticket.created_at).toLocaleDateString(
        en ? "en-GB" : "ar-EG",
      );
      if (ticket.status !== "open") ticketHeader.append(statusPill);
      ticketHeader.append(subjectElement, dateElement);
      if (ticket.admin_reply) {
        const replyButton = document.createElement("button"),
          replyElement = document.createElement("div"),
          replyLabel = document.createElement("span"),
          replyText = document.createElement("span");
        replyButton.className = "mini";
        replyButton.textContent = en ? "View reply" : "عرض الرد";
        replyElement.className = "tkr h";
        replyLabel.className = "tkl";
        replyLabel.textContent = en ? "Support reply" : "رد الدعم";
        replyText.textContent = ticket.admin_reply;
        replyElement.append(replyLabel, replyText);
        replyButton.onclick = () => {
          const hid = replyElement.classList.toggle("h");
          replyButton.textContent = hid
            ? en
              ? "View reply"
              : "عرض الرد"
            : en
              ? "Hide reply"
              : "إخفاء الرد";
        };
        ticketHeader.append(replyButton);
        ticketElement.append(ticketHeader, replyElement);
      } else ticketElement.append(ticketHeader);
      ticketsList.append(ticketElement);
    });
  } catch (e) {
    ticketsList.textContent = t("تعذّر تحميل التذاكر.");
  }
}
Object.assign(EN, {
  "أوافق على شروط الاستخدام (": "I accept the Terms of Use (",
  "أقرّ بأنني": "I acknowledge that I have read the Privacy Policy.",
  "يلزم قبول شروط":
    "You must accept the Terms of Use and acknowledge the Privacy Policy.",
  "سياسة الخصوصية وشروط": "Privacy Policy and Terms of Use",
  "بإرسال الرسالة فأنت تطّلع على":
    "By sending this message you acknowledge the",
  الدعم: "Support",
  "تواصل مع فريق الدعم": "Contact our support team",
  "اكتب مشكلتك":
    "Describe your issue or feedback and we will reply by email. We attach basic technical details to help us fix it faster.",
  "نوع المشكلة": "Issue type",
  الموضوع: "Subject",
  رسالتك: "Your message",
  "إرسال إلى الدعم": "Send to support",
  تذاكري: "My tickets",
  "سجّل الدخول لمتابعة تذاكرك": "Sign in to follow your tickets.",
  "لا توجد تذاكر": "No tickets yet.",
  "تعذّر تحميل التذاكر": "Could not load your tickets.",
  "تم إرسال رسالتك":
    "Your message was sent to support. We will reply by email.",
  "تعذّر إرسال الرسالة": "Could not send the message. Please try again.",
  "اكتب الموضوع": "Enter a subject and a message of at least 10 characters.",
  "المصادر المستند": "Sources used",
  "مراجعة العقود": "Contract review",
  "الحساب وتسجيل الدخول": "Account and sign-in",
  أخرى: "Other",
  "البحث القانوني": "Legal research",
  الترجمة: "Translation",
  المصدر: "Source",
  "عقد إيجار وحدة سكنية": "Residential lease contract",
  "قانون حماية المستهلك": "Consumer Protection Law",
  "كتاب المرشدي في صياغة العقود": "Al-Murshidi, contract drafting handbook",
  "المكتبة القانونية الداخلية": "Internal legal library",
  "الاستعانة بمصادر خارجية عند الحاجة":
    "Use external sources when needed — currently unavailable (labelled “External source — needs verification”).",
  "ملف الترجمة (اختياري)": "Translation file (optional)",
  "اسحب ملفًا هنا": "Drag a file here",
  "PDF أو DOCX أو TXT — حتى ٢٠ ميجابايت": "PDF, DOCX or TXT — up to 20 MB",
  "تأكيد كلمة السر الجديدة": "Confirm new password",
  "حفظ كلمة السر الجديدة": "Save new password",
  "استعادة كلمة السر": "Reset password",
  "أنشئ كلمة سر جديدة لحسابك.": "Create a new password for your account.",
});
EK.length = 0;
Object.keys(EN)
  .sort((a, b) => b.length - a.length)
  .forEach((k) => EK.push(k));
loadTk();

document.querySelectorAll("nav a").forEach(function (a) {
  a.addEventListener("click", function () {
    document.querySelector("nav").classList.remove("open");
  });
});
