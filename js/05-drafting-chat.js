/**
 * 05-drafting-chat.js — Contract drafting form, "other" requests (research/translate/draft) and the knowledge chat (ask).
 */
/* exported sendOther */

/**
 * Field definitions for the Contract Drafting form (`[fieldName, arabicLabel, groupKey, inputType]`).
 * Group `"c"` is shown for car sale contracts; group `"p"` is shown for residential lease contracts.
 * @type {Array<[string, string, string, string?]>}
 */
const DF = [
  ["car_make_model", "السيارة - الماركة والموديل وسنة الصنع واللون", "c"],
  ["car_plates_license", "السيارة - رقم اللوحات ورقم الرخصة وجهة الترخيص", "c"],
  ["car_chassis_motor", "السيارة - رقم الشاسيه ورقم الموتور", "c"],
  [
    "car_price_payment",
    "السيارة - الثمن الإجمالي المتفق عليه وطريقة السداد",
    "c",
  ],
  [
    "car_handover_datetime",
    "السيارة - تاريخ وساعة تسليم السيارة ونقل الحيازة",
    "c",
  ],
  ["property_address", "العقار - العنوان التفصيلي ورقم الشقة والدور", "p"],
  [
    "property_rent_payment",
    "العقار - القيمة الإيجارية الشهرية وموعد السداد",
    "p",
  ],
  ["property_deposit", "العقار - مبلغ التأمين النقدي", "p"],
  ["property_start_date", "العقار - تاريخ بدء الإيجار", "p", "date"],
  ["property_end_duration", "العقار - تاريخ انتهاء الإيجار ومدة العقد", "p"],
  ["penalty_clause", "الشرط الجزائي", ""],
  ["governing_law", "القانون الواجب التطبيق", ""],
  ["competent_court", "المحكمة المختصة", ""],
];

/**
 * Builds an HTML snippet for a single drafting form field with all attributes and labels escaped via `esc()`.
 * @param {string} n Field identifier suffix (becomes `id="f_<n>"`).
 * @param {string} l Arabic label text.
 * @param {string} g Group key (`"c"` for car sale, `"p"` for lease, `""` for shared).
 * @param {string} [ty] HTML input type (defaults to `"text"`).
 * @returns {string} Sanitized HTML string for the form field.
 */
const fld = (n, l, g, ty) =>
  '<div data-g="' +
  esc(g) +
  '"><label class="lb">' +
  esc(l) +
  '</label><input type="' +
  esc(ty || "text") +
  '" id="f_' +
  esc(n) +
  '"></div>';

OT.draft = [
  "",
  "",
  '<label class="lb">نوع العقد</label><select id="dT" onchange="dSync()"><option value="عقد إيجار سكني">عقد إيجار سكني</option><option value="عقد بيع سيارة">عقد بيع سيارة</option></select><label class="lb">الطرف الأول - الاسم بالكامل والرقم القومي ومحل الإقامة</label><textarea id="d1" style="min-height:80px"></textarea><label class="lb">الطرف الثاني - الاسم بالكامل والرقم القومي ومحل الإقامة</label><textarea id="d2" style="min-height:80px"></textarea>' +
    DF.map((f) => fld(...f)).join("") +
    '<label class="chk" style="margin-top:12px"><input type="checkbox" id="xw" disabled><span>الاستعانة بمصادر خارجية عند الحاجة — غير متاح حاليًا (تُوسَم «مصدر خارجي — يحتاج تحققًا»).</span></label>',
];
OT.research = [
  "اكتب سؤالك القانوني",
  "مثال: ما مدة الإخطار اللازمة لإنهاء عقد إيجار سكني؟",
  '<label class="lb">نوع العقد محل الاستشارة</label><select id="rT"><option value="عقد إيجار شقة سكنية">عقد إيجار شقة سكنية</option><option value="عقد بيع سيارة">عقد بيع سيارة</option></select><label class="lb">صفة السائل</label><select id="rR"><option value="مستأجر">مستأجر</option><option value="مؤجر">مؤجر</option><option value="مشتري">مشتري</option><option value="بائع">بائع</option></select><label class="chk" style="margin-top:12px"><input type="checkbox" id="xw" disabled><span>الاستعانة بمصادر خارجية عند الحاجة — غير متاح حاليًا (تُوسَم «مصدر خارجي — يحتاج تحققًا»).</span></label>',
];

/**
 * Synchronizes visible drafting form fields based on the selected contract type (`#dT`).
 * Shows `[data-g="c"]` fields for car sales and `[data-g="p"]` fields for residential leases.
 * @returns {void}
 */
function dSync() {
  const car = $("#dT").value === "عقد بيع سيارة";
  $$('#oX [data-g="c"]').forEach((e) => e.classList.toggle("h", !car));
  $$('#oX [data-g="p"]').forEach((e) => e.classList.toggle("h", car));
}
const _tab = tab;

/**
 * Extended tab switcher that resets the output container (`#oR`) and synchronizes drafting fields when `k === "draft"`.
 * @param {"review"|"draft"|"research"|"translate"} k Target service tab key.
 * @returns {void}
 */
tab = function (k) {
  $("#oR").classList.add("h");
  $("#oR").dir = "";
  $("#oR").style.textAlign = "";
  $("#oR").replaceChildren();
  if (k === "review") {
    APP_STATE.tab = "review";
    $("#pReview").classList.remove("h");
    $("#pOther").classList.add("h");
    $$(".tab").forEach((b) => b.classList.toggle("on", b.dataset.t === k));
    return;
  }
  _tab(k);
  const isDraft = k === "draft";
  $("#oL").style.display = $("#oT").style.display = isDraft ? "none" : "";
  if (isDraft) dSync();
};

/**
 * Submits a request for the active non-review service tab (`translate`, `draft`, or `research`)
 * via `hookAsync()`, renders the response and citations into `#oR`, and records the item in history.
 * @returns {Promise<void>}
 */
async function sendOther() {
  const k = APP_STATE.tab,
    submitButton = $("#pOther button.btn"),
    outputElement = $("#oR"),
    requestText = $("#oT").value.trim();
  outputElement.dir = "";
  outputElement.style.textAlign = "";
  if (k === "translate") {
    if (!requestText && !APP_STATE.transFile)
      return toast("الصق نص العقد أو ارفع ملفًا أولًا.");
    const dir = ($("#trDir") || {}).value || "en";
    submitButton.disabled = true;
    outputElement.classList.remove("h");
    outputElement.style.whiteSpace = "pre-wrap";
    outputElement.textContent = t("جارٍ المعالجة…");
    try {
      let payload;
      if (APP_STATE.transFile) {
        payload = new FormData();
        payload.append("targetLanguage", dir);
        payload.append("text", requestText);
        payload.append("file", APP_STATE.transFile, APP_STATE.transFile.name);
      } else payload = { text: requestText, targetLanguage: dir };
      let translationResponse = await hookAsync(WH.translate, payload);
      try {
        translationResponse = JSON.parse(translationResponse);
      } catch (e) {}
      if (Array.isArray(translationResponse))
        translationResponse = translationResponse[0];
      const translatedText =
          translationResponse &&
          typeof translationResponse === "object" &&
          translationResponse.translation
            ? translationResponse.translation
            : rawTxt(translationResponse),
        validationResult =
          (translationResponse && translationResponse.validation) || {},
        invalidNumbers = [].concat(
          validationResult.missingNumbers || [],
          validationResult.missingVINs || [],
          validationResult.unexpectedNumbers || [],
        );
      outputElement.textContent = "";
      if (validationResult.isValid === false || invalidNumbers.length) {
        const w = document.createElement("div");
        w.dir = document.documentElement.dir;
        w.style.cssText =
          "margin-bottom:12px;color:#b45309;white-space:pre-wrap";
        w.textContent =
          t("تنبيه: راجع هذه الأرقام يدويًا قبل الاعتماد") +
          ": " +
          invalidNumbers.join("، ");
        outputElement.append(w);
      }
      const tb = document.createElement("div");
      tb.dir = dir === "en" ? "ltr" : "rtl";
      tb.style.textAlign = dir === "en" ? "left" : "right";
      tb.style.whiteSpace = "pre-wrap";
      tb.textContent = translatedText;
      outputElement.append(tb);
      const fresh = document.createElement("button");
      fresh.className = "btn o";
      fresh.style.marginTop = "14px";
      fresh.textContent = t("طلب جديد");
      fresh.onclick = () => {
        tab("translate");
        $("#tool").scrollIntoView({ behavior: "smooth", block: "start" });
      };
      outputElement.append(fresh);
    } catch (e) {
      console.error(e);
      outputElement.style.whiteSpace = "pre-wrap";
      outputElement.textContent =
        e && e.userMsg ? e.userMsg : t("تعذّر إرسال الطلب. حاول مرة أخرى.");
    } finally {
      submitButton.disabled = false;
    }
    return;
  }
  let url, payload;
  if (k === "draft") {
    const car = $("#dT").value === "عقد بيع سيارة",
      firstPartyInfo = $("#d1").value.trim(),
      secondPartyInfo = $("#d2").value.trim();
    if (
      !firstPartyInfo ||
      !secondPartyInfo ||
      !$("#f_" + (car ? "car_chassis_motor" : "property_address")).value.trim()
    )
      return toast("أكمل الحقول المطلوبة.");
    payload = {
      contract_type: $("#dT").value,
      first_party_info: firstPartyInfo,
      second_party_info: secondPartyInfo,
      drafting_prompt: requestText,
    };
    DF.forEach(([fieldName, , fieldGroup]) => {
      const fieldValue = $("#f_" + fieldName).value.trim();
      if (fieldValue && (!fieldGroup || (fieldGroup === "c") === car))
        payload[fieldName] = fieldValue;
    });
    url = WH.draft;
  } else {
    if (!requestText) return toast("اكتب النص أولًا.");
    url = WH.research;
    const rt = ($("#rT") || {}).value || "عقد إيجار شقة سكنية",
      rr = ($("#rR") || {}).value || "مستأجر";
    payload = {
      question: requestText,
      contract_type: rt,
      user_role: rr,
      "نوع العقد محل الاستشارة": rt,
      "صفة السائل": rr,
      "موضوع أو سؤال الاستشارة": requestText,
    };
  }
  submitButton.disabled = true;
  outputElement.classList.remove("h");
  outputElement.textContent = t("جارٍ المعالجة…");
  // البحث الخارجي لا يُضاف إلى الرد الداخلي تلقائيًا؛ زر البحث الخارجي يعرضه وحده.
  let webSearchPromise = null;
  const webSearchCheckbox = $("#xw") || {};
  if (webSearchCheckbox.checked && !webSearchCheckbox.disabled) {
    const webSearchQuery =
      k === "draft"
        ? (
            "القواعد والأحكام القانونية المصرية المتعلقة بـ " +
            payload.contract_type +
            " " +
            (requestText || "")
          ).trim()
        : requestText + " — " + payload.contract_type + " (القانون المصري)";
    webSearchPromise = hook(WH.web, {
      question: webSearchQuery,
      message: webSearchQuery,
      history: [],
      allow_web_search: true,
      contract_type: payload.contract_type,
      user_role: payload.user_role,
    });
    webSearchPromise.catch(function () {});
  }
  const addWeb = async () => {
    if (!webSearchPromise) return;
    const dv = document.createElement("div");
    dv.style.cssText =
      "margin-top:16px;padding-top:12px;border-top:1px solid rgba(128,128,128,.4);white-space:pre-wrap";
    dv.textContent = t("جارٍ البحث في مصادر خارجية…");
    outputElement.append(dv);
    try {
      const webSearchResponse = await webSearchPromise;
      showExternal(dv, webSearchResponse);
    } catch (e) {
      console.error(e);
      dv.textContent =
        e && e.userMsg
          ? e.userMsg
          : t("تعذّر إتمام البحث الخارجي الآن، حاول مرة أخرى.");
    }
  };
  try {
    const raw =
        k === "draft" || k === "research"
          ? await hookAsync(url, payload)
          : await hook(url, payload),
      outputText = rawTxt(raw);
    show(outputElement, outputText);
    addSources(outputElement, raw, outputText);
    saveH(
      k,
      k === "draft" ? payload.contract_type : requestText.slice(0, 80),
      payload,
      outputText,
    );
    submitButton.disabled = false;
    await addWeb();
    const fresh = document.createElement("button");
    fresh.className = "btn o";
    fresh.style.marginTop = "14px";
    fresh.textContent = t("طلب جديد");
    fresh.onclick = () => {
      tab(k);
      $("#tool").scrollIntoView({ behavior: "smooth", block: "start" });
    };
    outputElement.append(fresh);
  } catch (e) {
    console.error(e);
    outputElement.style.whiteSpace = "pre-wrap";
    outputElement.textContent =
      e && e.userMsg ? e.userMsg : t("تعذّر إرسال الطلب. حاول مرة أخرى.");
    submitButton.disabled = false;
    await addWeb();
  } finally {
    submitButton.disabled = false;
  }
}

/**
 * Renders a three-dot typing indicator inside a chat message bubble `el`.
 * @param {HTMLElement} el Chat bubble element.
 * @returns {void}
 */
const dots = (el) => {
  el.className = "m b typing";
  el.innerHTML = "<i></i><i></i><i></i>";
};

/**
 * Sends a user question to the Bayyena legal assistant (`WH.chat`), or to `WH.web` if external search
 * is enabled and not disabled, renders the response and source citations in `#msgs`, and saves to history.
 * @param {string} [q] Optional question text (defaults to the value of `#cm`).
 * @returns {Promise<void>}
 */
async function ask(q) {
  q = (q || $("#cm").value).trim();
  if (!q) return;
  $("#cm").value = "";
  add(q, "u");
  const recentHistory = APP_STATE.hist.slice(-8),
    chatSearchCheckbox = $("#cw") || {},
    web = !!chatSearchCheckbox.checked && !chatSearchCheckbox.disabled;
  const assistantMessage = add("", "b");
  dots(assistantMessage);
  try {
    const payload = {
      message: q,
      question: q,
      history: recentHistory,
      allow_web_search: web,
      audience: APP_STATE.ca,
      kind: APP_STATE.ck,
      lang,
    };
    // عند تفعيل البحث الخارجي نعرض نتيجة البحث الخارجي فقط، ولا نخلطها مع إجابة المكتبة الداخلية.
    if (web) {
      const webSearchResponse = await hook(WH.web, {
        question: q,
        message: q,
        history: recentHistory,
        allow_web_search: true,
      });
      showExternal(assistantMessage, webSearchResponse);
      saveH(
        "chat",
        q.slice(0, 80),
        { q, allow_web_search: true },
        rawTxt(webSearchResponse),
      );
    } else {
      const chatResponse = await hook(WH.chat, payload),
        answerText = extractPlainText(chatResponse);
      if (answerText) {
        assistantMessage.className = "m b";
        assistantMessage.textContent = answerText;
        addSources(assistantMessage, chatResponse, answerText);
        APP_STATE.hist.push({ q, answerText });
        saveH(
          "chat",
          q.slice(0, 80),
          { q, allow_web_search: false },
          answerText,
        );
      } else assistantMessage.remove();
    }
  } catch (e) {
    console.error(e);
    assistantMessage.className = "m b";
    assistantMessage.textContent =
      e && e.userMsg ? e.userMsg : t("تعذّر إرسال سؤالك. حاول مرة أخرى.");
  }
}

$("#cm").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    ask();
  }
});

// ===== نظام الحسابات (Supabase Auth): تسجيل جديد / دخول / خروج / استعادة كلمة السر =====
// المفتاح العام (anon/publishable) مصمَّم ليظهر في المتصفح ويحميه RLS. ممنوع وضع service_role هنا.
