// Automated Smoke, Security & Integration Test Suite for Muhkam (مُحكَم) v1.1.1
// Runs in Node.js (with jsdom when installed in CI, or built-in VM fallback locally).
const test = require("node:test");
const assert = require("node:assert");
const { readFileSync, readdirSync, existsSync } = require("fs");
const { createHash } = require("crypto");
const vm = require("node:vm");

let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require("jsdom"));
} catch {
  JSDOM = null;
}

function boot(htmlPath = "index.html") {
  let html = readFileSync(htmlPath, "utf8");
  const scriptPaths = [];
  html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, p) => {
    scriptPaths.push(p);
    return (
      "<script>" +
      readFileSync(p, "utf8").replace(/<\/script>/g, "<\\/script>") +
      "</script>"
    );
  });
  html = html.replace(/<link rel="stylesheet" href="css\/style.css">/, "");

  if (JSDOM) {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => errors.push(e.message));
    const dom = new JSDOM(html, {
      url: "http://localhost/",
      runScripts: "dangerously",
      pretendToBeVisual: true,
      virtualConsole: vc,
      beforeParse(w) {
        w.fetch = () => Promise.reject(new Error("network disabled in tests"));
      },
    });
    return { dom, errors, mode: "jsdom" };
  }

  // Zero-dependency fallback when jsdom is not installed locally
  const errors = [];
  const elementsById = {};
  const makeEl = (id = "") => {
    const el = {
      id,
      nodeName: "DIV",
      style: {},
      dataset: {},
      className: "",
      classList: {
        add() {},
        remove() {},
        toggle() {},
        contains() {
          return false;
        },
      },
      setAttribute() {},
      getAttribute() {
        return "";
      },
      removeAttribute() {},
      addEventListener() {},
      removeEventListener() {},
      appendChild(c) {
        this.children.push(c);
        this.childNodes.push(c);
      },
      append(...nodes) {
        for (const n of nodes) {
          this.children.push(n);
          this.childNodes.push(n);
        }
      },
      replaceChildren(...nodes) {
        this.children = [...nodes];
        this.childNodes = [...nodes];
        this.innerHTML = "";
        this.textContent = "";
      },
      insertAdjacentHTML() {},
      closest: () => null,
      prepend() {},
      remove() {},
      focus() {},
      click() {},
      scrollIntoView() {},
      getBoundingClientRect: () => ({
        top: 0,
        left: 0,
        width: 100,
        height: 40,
      }),
      querySelector: (s) => {
        if (s && s.startsWith("#")) return getById(s.slice(1));
        return makeEl();
      },
      querySelectorAll: () => [],
      children: [],
      childNodes: [],
      parentNode: { nodeName: "DIV" },
      innerHTML: "",
      textContent: "",
      value: "",
      checked: false,
      disabled: false,
    };
    return el;
  };
  const getById = (id) => {
    if (!elementsById[id]) {
      const el = makeEl(id);
      const tagMatch = new RegExp(`<[^>]*\\bid="${id}"[^>]*>`, "i").exec(html);
      if (tagMatch && /\bdisabled\b/i.test(tagMatch[0])) el.disabled = true;
      elementsById[id] = el;
    }
    return elementsById[id];
  };
  const docStub = {
    documentElement: {
      lang: /<html[^>]*\blang="([^"]+)"/.exec(html)?.[1] || "",
      dir: /<html[^>]*\bdir="([^"]+)"/.exec(html)?.[1] || "",
      dataset: {},
      style: { setProperty() {} },
      classList: {
        add() {},
        remove() {},
        toggle() {},
        contains() {
          return false;
        },
      },
      setAttribute(k, v) {
        this[k] = v;
      },
      getAttribute(k) {
        return this[k] || "";
      },
    },
    head: makeEl("head"),
    body: makeEl("body"),
    getElementById: (id) => getById(id),
    querySelector: (sel) => {
      if (sel && sel.startsWith("#")) return getById(sel.slice(1));
      return makeEl();
    },
    querySelectorAll: () => [],
    createElement: (tag) => {
      const e = makeEl();
      e.nodeName = String(tag || "DIV").toUpperCase();
      return e;
    },
    createTextNode: (t) => ({ nodeType: 3, nodeValue: t, textContent: t }),
    createTreeWalker: () => ({ nextNode: () => null }),
    addEventListener() {},
    removeEventListener() {},
  };
  const sandbox = {
    window: null,
    innerWidth: 1280,
    innerHeight: 800,
    document: docStub,
    DOMParser: function () {
      this.parseFromString = (str) => {
        const clean = String(str || "").replace(
          /<(script|style)[\s\APP_STATE]*?<\/\1>/gi,
          "",
        );
        return {
          body: {
            textContent: clean.replace(/<[^>]+>/g, ""),
            childNodes: [
              { nodeType: 3, nodeValue: clean.replace(/<[^>]+>/g, "") },
            ],
          },
        };
      };
    },
    NodeFilter: { SHOW_TEXT: 4, SHOW_ELEMENT: 1 },
    MutationObserver: function () {
      this.observe = () => {};
      this.disconnect = () => {};
    },
    ResizeObserver: function () {
      this.observe = () => {};
      this.disconnect = () => {};
    },
    IntersectionObserver: function () {
      this.observe = () => {};
      this.disconnect = () => {};
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: {
      userAgent: "node-test",
      clipboard: { writeText: async () => {} },
    },
    location: {
      href: "http://localhost/",
      hash: "",
      origin: "http://localhost",
      pathname: "/",
      search: "",
    },
    history: { replaceState() {}, pushState() {} },
    matchMedia: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: clearTimeout,
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    fetch: () => Promise.reject(new Error("network disabled in tests")),
    console,
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    clearInterval,
    URL,
    URLSearchParams,
    Blob: function () {},
    FormData: function () {
      this.append = () => {};
    },
    FileReader: function () {},
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    btoa: (bin) => Buffer.from(bin, "binary").toString("base64"),
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const sp of scriptPaths) {
    try {
      vm.runInContext(readFileSync(sp, "utf8"), sandbox, { filename: sp });
    } catch (e) {
      errors.push(e.message);
    }
  }
  const verifyDoc = {
    ...docStub,
    querySelector: (sel) => {
      if (sel.startsWith("#")) {
        const id = sel.slice(1);
        return html.includes(`id="${id}"`) ? getById(id) : null;
      }
      return makeEl();
    },
  };
  return {
    dom: {
      window: {
        document: verifyDoc,
        eval: (code) => vm.runInContext(code, sandbox),
      },
    },
    errors,
    mode: "vm-fallback",
  };
}

// 1. Original Test 1
test("app boots without uncaught errors", () => {
  const { errors } = boot();
  assert.deepStrictEqual(errors, []);
});

// 2. Original Test 2
test("page is Arabic RTL and has the main sections including trial banner", () => {
  const { dom } = boot();
  const d = dom.window.document;
  assert.strictEqual(d.documentElement.lang, "ar");
  assert.strictEqual(d.documentElement.dir, "rtl");
  for (const sel of ["#tool", "#trialBanner", "#toast", "#msgs", "#chips"])
    assert.ok(d.querySelector(sel), "missing " + sel);
});

// 3. Original Test 3
test("config exposes all webhook endpoints over https and publishable key only", () => {
  const { dom } = boot();
  const { WH, AUTH } = dom.window.eval("({WH, AUTH})");
  for (const k of [
    "review",
    "draft",
    "research",
    "chat",
    "web",
    "translate",
    "support",
  ])
    assert.match(WH[k], /^https:\/\//, "bad endpoint " + k);
  assert.match(
    AUTH.anon,
    /^sb_publishable_/,
    "frontend must only hold the publishable key",
  );
});

// 4. Original Test 4
test("esc() escapes HTML payloads (XSS guard)", () => {
  const { dom } = boot();
  assert.strictEqual(
    dom.window.eval('esc("<img src=x onerror=1>")'),
    "&lt;img src=x onerror=1&gt;",
  );
});

// 5. Original Test 5 (updated for 8 workflows including cleaned 08-web-search.json)
test("n8n directory contains all 8 workflows, excludes raw My workflow, and has zero pinData/JWT leaks", () => {
  const files = readdirSync("n8n")
    .filter((f) => f.endsWith(".json"))
    .sort();
  assert.strictEqual(files.length, 8, "Expected 8 workflows in n8n/");
  assert.ok(
    !files.some((f) => /my[_ ]workflow/i.test(f)),
    "Raw My workflow.json must not be present",
  );
  assert.ok(
    files.includes("08-web-search.json"),
    "08-web-search.json must be present",
  );
  const ingest = JSON.parse(
    readFileSync("n8n/07-knowledge-ingest.json", "utf8"),
  );
  assert.strictEqual(
    ingest.name,
    "Legal AI - Full Cloud Workflow (Gemini Flash OCR) - Fixed",
  );
  assert.strictEqual(
    ingest.nodes.length,
    14,
    "Fixed knowledge ingest workflow must have 14 nodes",
  );
  for (const f of files) {
    const raw = readFileSync("n8n/" + f, "utf8");
    const wf = JSON.parse(raw);
    assert.deepStrictEqual(
      wf.pinData || {},
      {},
      f + " must have empty pinData",
    );
    assert.ok(
      !/eyJ[A-Za-z0-9_-]{20,}/.test(raw),
      f + " must not contain any JWT",
    );
    const workflowEmails =
      raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    assert.ok(
      workflowEmails.every(
        (email) => email.toLowerCase() === "support@muhkam.local",
      ),
      f + " must not contain non-placeholder email addresses",
    );
  }
});

// 6. Delivery inventory: Supabase code/schema only, no exported row data.
test("database delivery includes SQL code/schema and excludes exported row data", () => {
  for (const path of [
    "database/01-schema.sql",
    "database/02-fix-stuck-jobs.sql",
    "database/04-retention.sql",
  ]) {
    assert.ok(existsSync(path), "Missing " + path);
  }
  assert.ok(
    !existsSync("database/03-bayyena_knowledge_rows.sql"),
    "Exported knowledge rows must not be included in code-only delivery",
  );
});

// 7. DOM XSS Test 1: render() and pick() keep all risk fields as text and block unsafe links.
test("render() and pick() keep untrusted risk fields inert in the DOM (XSS guard)", () => {
  const { dom } = boot();
  const out = dom.window.eval(`
    APP_STATE.quiet = true;
    APP_STATE.data = {
      risks: [{
        level: 'h"><img src=x onerror=alert(1)>',
        lv: '<script>evil()</script>',
        title: '<b>Bad Title</b>',
        ref: '<svg onload=1>',
        quote: '<iframe src="javascript:alert(1)">',
        why: '<img src=x onerror=2>',
        impact: '<script>impact()</script>',
        before: '<a href="javascript:evil()">click</a>',
        after: '<a href="javascript:evil2()">click</a>',
        src: '<script>src()</script>',
        src_url: 'javascript:alert(9)'
      }]
    };
    _render();
    pick(0);
    (() => {
      const rl = $("#rl"), rd = $("#rd");
      return {
        levelText: rl.querySelector(".lv")?.textContent || "",
        levelClass: rl.querySelector(".lv")?.className || "",
        rlImages: rl.querySelectorAll("img").length,
        rlScripts: rl.querySelectorAll("script").length,
        rlHandlers: rl.querySelectorAll("[onerror], [onload], [onclick]").length,
        quoteText: rd.querySelector("blockquote")?.textContent || "",
        rdIframes: rd.querySelectorAll("iframe").length,
        rdScripts: rd.querySelectorAll("script").length,
        rdHandlers: rd.querySelectorAll("[onerror], [onload], [onclick]").length,
        javascriptLinks: [...rd.querySelectorAll("a")].filter((a) =>
          /^javascript:/i.test(a.getAttribute("href") || ""),
        ).length,
      };
    })()
  `);
  assert.ok(
    out.levelText === "<script>evil()</script>",
    "r.lv markup must remain literal text",
  );
  assert.ok(
    out.levelClass === "lv ",
    "r.level must be restricted to the supported CSS classes",
  );
  assert.ok(
    out.rlImages === 0 && out.rlScripts === 0 && out.rlHandlers === 0,
    "risk-list fields must not create executable DOM nodes",
  );
  assert.ok(
    out.quoteText.includes("<iframe") && out.quoteText.includes("javascript:"),
    "r.quote markup and URL text must remain text",
  );
  assert.ok(
    out.rdIframes === 0 && out.rdScripts === 0 && out.rdHandlers === 0,
    "risk-detail fields must not create executable DOM nodes",
  );
  assert.strictEqual(
    out.javascriptLinks,
    0,
    "javascript: URLs must not become anchor href attributes",
  );
});

// 8. innerHTML / DOM XSS Test 2: fld() and show() sanitize untrusted markup
test("fld() escapes attribute injections and show() strips <script> tags", () => {
  const { dom } = boot();
  const res = dom.window.eval(`
    const html = fld('x" onfocus="alert(1)', '<img src=x onerror=1>', 'g" onload="1', 'text" onclick="1');
    const box = document.createElement("div");
    show(box, "<p>Safe text</p><script>window.__xss = 1;</script>");
    ({ html, xss: !!window.__xss });
  `);
  assert.ok(
    !res.html.includes('onfocus="alert(1)"') || res.html.includes("&quot;"),
    "fld() must escape quotes in attributes",
  );
  assert.ok(
    res.html.includes("&lt;img src=x onerror=1&gt;"),
    "fld() must escape label HTML",
  );
  assert.strictEqual(res.xss, false, "show() must never execute <script> tags");
});

// 9. External web search disabled & no unverified 30-day retention promise + Policy integrity
test("archived source search controls are disabled, retention is honest, and policy.pdf is unchanged", () => {
  const html = readFileSync("index.html", "utf8");
  const i18n = readFileSync("js/03-i18n.js", "utf8");
  const tool = readFileSync("js/02-tool.js", "utf8");
  const draft = readFileSync("js/05-drafting-chat.js", "utf8");

  assert.match(
    html,
    /<input type="checkbox" id="web" disabled>/,
    "archived source must disable #web",
  );
  assert.match(
    html,
    /<input type="checkbox" id="cw" disabled>/,
    "archived source must disable #cw",
  );
  assert.match(
    draft,
    /<input type="checkbox" id="xw" disabled>/,
    "archived source must disable #xw",
  );
  assert.ok(
    html.includes("غير متاح حاليًا") && tool.includes("غير متاح حاليًا"),
    "archived source labels its disabled search controls clearly",
  );
  assert.ok(
    !html.includes("تُحذف السجلات تلقائيًا بعد ٣٠ يومًا") &&
      !i18n.includes("تُحذف السجلات تلقائيًا بعد ٣٠ يومًا"),
    "UI and i18n must not promise automatic 30-day deletion without owner approval",
  );

  const policyHash = createHash("sha256")
    .update(readFileSync("assets/policy.pdf"))
    .digest("hex");
  assert.strictEqual(
    policyHash,
    "4c139e22748b1d4da3efd8ac7d1021498a2a74d7eb36760ceb4e4116a570f148",
    "assets/policy.pdf SHA-256 must remain 100% unchanged",
  );
  const { dom } = boot();
  assert.strictEqual(
    dom.window.eval("POLICY_VER"),
    "1.0",
    "POLICY_VER must remain 1.0",
  );
});
