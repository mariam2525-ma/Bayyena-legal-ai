/**
 * 02-tool.js — Main tool panel: tab switching, file upload, running a request, rendering review/research/draft results.
 */
/* exported go, run, showExternal, again */

/**
 * Configuration map for non-review service tabs (draft, research, translate).
 * Each entry holds: [labelText, placeholderText, extraControlsHtml].
 * @type {Record<string, [string, string, string]>}
 */
const OT = {
  draft: [
    "صِف العقد الذي تحتاجه (النوع، الأطراف، المدة، الشروط الخاصة)",
    "مثال: عقد إيجار شقة سكنية لمدة سنة بين فردين…",
    "",
  ],
  research: [
    "اكتب سؤالك القانوني",
    "مثال: ما مدة الإخطار اللازمة لإنهاء عقد إيجار سكني؟",
    '<label class="chk"><input type="checkbox" disabled><span>فعّل البحث الخارجي عند عدم كفاية المصادر الداخلية (غير متاح حاليًا).</span></label>',
  ],
  translate: [
    "ألصق نص العقد المراد ترجمته",
    "الصق النص هنا…",
    '<label class="lb">ملف الترجمة (اختياري)</label><div class="drop" id="tdrop"><strong id="tfn">اسحب ملفًا هنا</strong><span>PDF أو DOCX أو TXT — حتى ٢٠ ميجابايت</span><br><input id="tf" type="file" class="h" accept=".pdf,.docx,.txt"><label for="tf" class="btn o" id="tfBtn" style="margin-top:12px">اختيار ملف</label></div><label class="lb">اتجاه الترجمة</label><select id="trDir"><option value="en">من العربية إلى الإنجليزية</option><option value="ar">من الإنجليزية إلى العربية</option></select>',
  ],
};

/**
 * Switches the active service tab in the `#tool` section and initializes its form controls.
 * @param {"review"|"draft"|"research"|"translate"} k Target service tab key.
 * @returns {void}
 */
function tab(tabKey) {
  $$(".tab").forEach((b) => b.classList.toggle("on", b.dataset.t === tabKey));
  const isReviewTab = tabKey === "review";
  $("#pReview").classList.toggle("h", !isReviewTab);
  $("#pOther").classList.toggle("h", isReviewTab);
  if (!isReviewTab) {
    $("#oL").textContent = t(OT[tabKey][0]);
    $("#oT").placeholder = t(OT[tabKey][1]);
    $("#oT").value = "";
    $("#oX").innerHTML = OT[tabKey][2];
    tr($("#oX"));
    if (tabKey === "translate") bindTranslateFile();
    APP_STATE.tab = tabKey;
  }
}

/**
 * Navigates to a service tab or scrolls smoothly to the `#chat` assistant section.
 * @param {"review"|"draft"|"research"|"translate"|"chat"} k Target section or service key.
 * @returns {void}
 */
function go(k) {
  if (k === "chat") {
    const chatElement = $("#chat");
    if (chatElement)
      chatElement.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  tab(k);
  $("#tool").scrollIntoView({ behavior: "smooth" });
}
$$(".tab").forEach((b) => (b.onclick = () => tab(b.dataset.t)));
$$(".seg").forEach((g) =>
  g.querySelectorAll("button").forEach(
    (b) =>
      (b.onclick = () => {
        g.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        APP_STATE[g.dataset.k] = b.dataset.v;
      }),
  ),
);
$("#web").onchange = (e) =>
  (APP_STATE.web = !e.target.disabled && !!e.target.checked);

/**
 * Attaches file input change and drag-and-drop listeners for the translation file uploader (`#tdrop`).
 * @returns {void}
 */
function bindTranslateFile() {
  const translateInput = $("#tf"),
    dropZone = $("#tdrop");
  if (!translateInput || !dropZone) return;
  translateInput.onchange = (e) => setTranslateFile(e.target.files[0]);
  ["dragenter", "dragover"].forEach((v) =>
    dropZone.addEventListener(v, (e) => {
      e.preventDefault();
      dropZone.classList.add("d");
    }),
  );
  ["dragleave", "drop"].forEach((v) =>
    dropZone.addEventListener(v, (e) => {
      e.preventDefault();
      dropZone.classList.remove("d");
      if (v === "drop") setTranslateFile(e.dataTransfer.files[0]);
    }),
  );
}

/**
 * Validates and stores a file selected for contract translation (max 20 MB; PDF, DOCX, or TXT).
 * Automatically populates `#oT` when a plain-text (`.txt`) file is provided.
 * @param {File|undefined} f Uploaded File object from input or drag-and-drop.
 * @returns {void}
 */
function setTranslateFile(f) {
  if (!f) return;
  if (f.size > 20 * 1048576) return toast("حجم الملف أكبر من ٢٠ ميجابايت.");
  if (!/\.(pdf|docx|txt)$/i.test(f.name))
    return toast("صيغة الملف غير مدعومة.");
  APP_STATE.transFile = f;
  const n = $("#tfn");
  if (n) n.textContent = f.name;
  if (/\.txt$/i.test(f.name)) {
    const r = new FileReader();
    r.onload = () => {
      $("#oT").value = String(r.result).slice(0, 60000);
    };
    r.readAsText(f);
  }
}

/**
 * Validates and stores a contract file selected for review (max 20 MB; PDF, DOC, DOCX, JPG, JPEG, PNG).
 * @param {File|undefined} f Uploaded File object from `#fi` or drag-and-drop on `#drop`.
 * @returns {void}
 */
function setFile(f) {
  if (!f) return;
  if (f.size > 20 * 1048576) return toast("حجم الملف أكبر من ٢٠ ميجابايت.");
  if (!/\.(pdf|docx?|jpe?g|png)$/i.test(f.name))
    return toast("صيغة الملف غير مدعومة.");
  APP_STATE.file = f;
  $("#fn").textContent = f.name;
  readTxt(f);
  goSync();
  $("#drop").classList.remove("d");
}
$("#fi").onchange = (e) => setFile(e.target.files[0]);
$("#contractFileBtn").onclick = () => $("#fi").click();
["dragenter", "dragover"].forEach((v) =>
  $("#drop").addEventListener(v, (e) => {
    e.preventDefault();
    $("#drop").classList.add("d");
  }),
);
["dragleave", "drop"].forEach((v) =>
  $("#drop").addEventListener(v, (e) => {
    e.preventDefault();
    $("#drop").classList.remove("d");
    if (v === "drop") setFile(e.dataTransfer.files[0]);
  }),
);

/**
 * Executes the asynchronous contract review workflow (`analyze()`), displays step-by-step
 * progress indicators in `#pl`, renders the resulting report via `render()`, and saves the entry to user history.
 * @returns {Promise<void>}
 */
async function run() {
  $("#setup").classList.add("h");
  $("#rep").classList.add("h");
  $("#prog").classList.remove("h");
  const progressSteps = [
    "رفع الملف",
    "قراءة البنود",
    "فحص المصادر",
    "إعداد التقرير",
  ];
  $("#pl").innerHTML = progressSteps
    .map((s) => "<li>" + esc(s) + "</li>")
    .join("");
  tr($("#pl"));
  const progressItems = $$("#pl li");
  let progressIndex = 0;
  const progressTimer = setInterval(() => {
    progressItems.forEach(
      (l, j) =>
        (l.className =
          j < progressIndex ? "ok" : j === progressIndex ? "go" : ""),
    );
    if (progressIndex < progressSteps.length) progressIndex++;
  }, 800);
  try {
    const d = await analyze();
    clearInterval(progressTimer);
    progressItems.forEach((l) => (l.className = "ok"));
    APP_STATE.data = d;
    APP_STATE.sel = 0;
    render();
    saveH(
      "review",
      APP_STATE.type + " — " + APP_STATE.role,
      { contract_type: APP_STATE.type, user_role: APP_STATE.role },
      d.text || JSON.stringify(d.risks),
    );
  } catch (e) {
    clearInterval(progressTimer);
    $("#prog").classList.add("h");
    $("#setup").classList.remove("h");
    console.error(e);
    toast(e && e.userMsg ? e.userMsg : "تعذّر إكمال المراجعة. حاول مرة أخرى.");
  }
}

/**
 * Normalizes internal knowledge-base document filenames/identifiers into readable Arabic source titles.
 * @param {string} src Raw source identifier or filename returned by the backend.
 * @returns {string} Human-readable Arabic label for the source.
 */
function sourceLabel(src) {
  const original = String(src || "").trim();
  if (!original) return "المكتبة القانونية الداخلية";
  const normalizedSource = original.toLowerCase(),
    base = original.split(/[\\/]/).pop().replace(/\?.*$/, "");
  if (/مرشدي|المرشدي|al.?murshidi|murshidi/i.test(original))
    return "كتاب المرشدي في صياغة العقود";
  if (/new[ _-]?1|نيو[ _-]?1/.test(normalizedSource))
    return "عقد إيجار وحدة سكنية";
  if (/new[ _-]?2|نيو[ _-]?2/.test(normalizedSource)) return "عقد بيع سيارة";
  if (/new[ _-]?3|نيو[ _-]?3/.test(normalizedSource))
    return "قانون حماية المستهلك";
  if (/consumer|حماية المستهلك/.test(normalizedSource))
    return "قانون حماية المستهلك";
  if (/lease|إيجار/.test(normalizedSource)) return "عقد إيجار وحدة سكنية";
  if (/sale|car|سيارة/.test(normalizedSource)) return "عقد بيع سيارة";
  // أظهر اسم الملف الحقيقي بدل أسماء عامة مثل file new one.
  return (
    base
      .replace(/\.(pdf|docx?|txt|md)$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || original
  );
}

/**
 * Validates that a candidate citation URL uses `http:` or `https:` protocol (preventing `javascript:` or `data:` URLs).
 * @param {string} url Raw URL string to validate.
 * @returns {string} Sanitized absolute HTTP(APP_STATE) URL or empty string if invalid.
 */
function sourceLink(url) {
  try {
    const parsedUrl = new URL(url, location.href);
    return /^https?:$/.test(parsedUrl.protocol) ? parsedUrl.href : "";
  } catch (e) {
    return "";
  }
}

/**
 * Extracts normalized summary text and an array of external source items from a web-search webhook response.
 * @param {object|Array|string} data Raw response payload from `WH.web`.
 * @returns {{text: string, items: Array<object>}} Normalized text and source objects.
 */
function externalSources(data) {
  let normalizedData = data;
  if (typeof normalizedData === "string")
    return { text: normalizedData, items: [] };
  if (Array.isArray(normalizedData)) normalizedData = normalizedData[0] || {};
  const text = rawTxt(normalizedData),
    items =
      normalizedData &&
      (normalizedData.sources ||
        normalizedData.results ||
        normalizedData.references ||
        normalizedData.citations ||
        normalizedData.links ||
        []);
  return { text, items: Array.isArray(items) ? items : [] };
}

/**
 * Renders external web search results inside a target DOM element using safe DOM node creation (`textContent`),
 * clearly labelling them with the verification warning («مصادر خارجية — يحتاج تحققًا»).
 * @param {HTMLElement} el Container element to populate.
 * @param {object|Array|string} data Raw external search response payload.
 * @returns {void}
 */
function showExternal(el, data) {
  const externalResult = externalSources(data);
  el.replaceChildren();
  el.className = "m b external-result";
  const head = document.createElement("strong");
  head.textContent = t("مصادر خارجية — يحتاج تحققًا");
  el.append(head);
  if (externalResult.text) {
    const body = document.createElement("div");
    body.style.whiteSpace = "pre-wrap";
    body.style.marginTop = "6px";
    body.textContent = externalResult.text;
    el.append(body);
  }
  if (externalResult.items.length) {
    const box = document.createElement("div");
    box.className = "ext-sources";
    externalResult.items.forEach((it, i) => {
      const title = it.title || it.name || "مصدر خارجي " + (i + 1),
        url = it.url || it.link || it.href || "",
        sn = it.snippet || it.description || it.summary || "";
      const row = document.createElement("div");
      row.className = "ext-source";
      const a = document.createElement("a");
      a.textContent = title;
      a.href = sourceLink(url) || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      row.append(a);
      if (sn) {
        const sm = document.createElement("small");
        sm.textContent = sn;
        row.append(sm);
      }
      box.append(row);
    });
    el.append(box);
  } else {
    const md = [
      ...String(externalResult.text || "").matchAll(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      ),
    ].map((m) => ({ title: m[1], url: m[2] }));
    const urls = md.length
      ? md
      : [
          ...String(externalResult.text || "").matchAll(/https?:\/\/[^\s)]+/g),
        ].map((m, i) => ({
          title: "رابط المصدر " + (i + 1),
          url: m[0].replace(/[.,؛،]+$/, ""),
        }));
    if (urls.length) {
      const box = document.createElement("div");
      box.className = "ext-sources";
      urls.forEach((it) => {
        const a = document.createElement("a");
        a.textContent = it.title;
        a.href = sourceLink(it.url) || "#";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        box.append(a);
      });
      el.append(box);
    }
  }
}

/**
 * Renders the structured contract review report (`APP_STATE.data.risks`) into `#rep`.
 * Every dynamic value interpolated into `innerHTML` is sanitized via `esc()`.
 * @returns {void}
 */
function render() {
  const reportData = APP_STATE.data;
  const levelClass = { hi: "hi", md: "md", lo: "lo" };
  $("#prog").classList.add("h");
  const reportElement = $("#rep");
  reportElement.classList.remove("h");
  reportElement.innerHTML =
    '<div class="bar"><div><h3>تقرير مراجعة العقد</h3><p>' +
    esc(t(APP_STATE.type)) +
    " · " +
    esc(t(APP_STATE.status)) +
    '</p></div><span class="pill">مراجعة أولية — ليست استشارة قانونية</span></div>' +
    (reportData.sample
      ? '<div class="note" style="margin:0 0 16px"><span>ℹ️</span><span>هذه عيّنة توضيحية لشكل التقرير؛ لم يُحلَّل الملف المرفوع في هذه النسخة.</span></div>'
      : "") +
    '<div class="rep"><div id="rl"></div><div class="card" id="rd"></div></div><button class="btn o" style="margin-top:18px" onclick="again()">راجع عقدًا آخر</button>';
  $("#rl").innerHTML = (reportData.risks || [])
    .map(
      (r, i) =>
        '<button class="rk" data-i="' +
        i +
        '"><span class="lv ' +
        (levelClass[r.level] || "") +
        '">' +
        esc(r.lv) +
        "</span><strong>" +
        esc(r.title) +
        "</strong><small>" +
        esc(r.ref) +
        "</small></button>",
    )
    .join("");
  $$(".rk").forEach((b) => (b.onclick = () => pick(+b.dataset.i)));
  tr(reportElement);
  pick(APP_STATE.sel || 0);
  if (!APP_STATE.quiet) reportElement.scrollIntoView({ behavior: "smooth" });
}

/**
 * Displays the detailed explanation, practical impact, suggested amendment, and source citation
 * for the selected risk item at index `i` inside `#rd`. All dynamic fields pass through `esc()`.
 * @param {number} i Zero-based index into `APP_STATE.data.risks`.
 * @returns {void}
 */
function pick(i) {
  APP_STATE.sel = i;
  const risk = APP_STATE.data.risks[i],
    isAfterSigning = APP_STATE.status === "بعد التوقيع";
  if (!risk) return;
  $$(".rk").forEach((b, j) => b.classList.toggle("on", j === i));
  $("#rd").innerHTML =
    "<h3>" +
    esc(t(risk.ref)) +
    " — " +
    esc(t(risk.title)) +
    "</h3><blockquote>" +
    esc(risk.quote) +
    '</blockquote><div class="dg"><div><label>لماذا ظهر كخطر؟</label>' +
    esc(risk.why) +
    "</div><div><label>الأثر العملي</label>" +
    esc(risk.impact) +
    '</div><div class="f"><label>' +
    (isAfterSigning ? "ما الذي تفعله الآن؟" : "التعديل المقترح للتفاوض") +
    "</label>" +
    esc(isAfterSigning ? risk.after : risk.before) +
    '<br><span class="src' +
    (risk.external ? " x" : "") +
    '">' +
    (risk.external
      ? "مصدر خارجي — يحتاج تحققًا"
      : t("المصدر") +
        ": " +
        ((risk.src_url || risk.url) && sourceLink(risk.src_url || risk.url)
          ? '<a href="' +
            esc(sourceLink(risk.src_url || risk.url)) +
            '" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">' +
            esc(sourceLabel(risk.src)) +
            "</a>"
          : esc(sourceLabel(risk.src)))) +
    "</span></div></div>";
}

/**
 * Resets the contract review state and form controls so the user can start a fresh review without reloading.
 * @returns {void}
 */
function again() {
  // ابدأ مراجعة جديدة دون الحاجة إلى تحديث الصفحة.
  $("#rep").classList.add("h");
  $("#prog").classList.add("h");
  $("#setup").classList.remove("h");
  APP_STATE.file = null;
  APP_STATE.data = null;
  APP_STATE.sel = 0;
  APP_STATE.role = "المستأجر";
  APP_STATE.type = "عقد إيجار سكني";
  APP_STATE.status = "قبل التوقيع";
  APP_STATE.web = false;
  $("#fi").value = "";
  $("#ct").value = "";
  $("#fn").textContent = t("اسحب الملف إلى هنا");
  $("#fh").textContent = t("PDF أو Word أو صورة — حتى ٢٠ ميجابايت");
  $("#web").checked = false;
  $$('.seg[data-k="role"] button').forEach((b) =>
    b.classList.toggle("on", b.dataset.v === "المستأجر"),
  );
  $$('.seg[data-k="type"] button').forEach((b) =>
    b.classList.toggle("on", b.dataset.v === "عقد إيجار سكني"),
  );
  $$('.seg[data-k="status"] button').forEach((b) =>
    b.classList.toggle("on", b.dataset.v === "قبل التوقيع"),
  );
  syncRole();
  goSync();
  $("#tool").scrollIntoView({ behavior: "smooth", block: "start" });
}
