/**
 * 06-auth.js — Supabase Auth: sign up / sign in / sign out / password recovery and session handling.
 */
/* exported getTok, acct, authForgot, updatePassword, consumeRecoveryLink, out */
// AUTH (Supabase url + publishable key): see config.js
let SES = null;
try {
  SES = JSON.parse(localStorage.getItem("mk-ses"));
} catch (e) {}
const saveS = () => {
  try {
    SES
      ? localStorage.setItem("mk-ses", JSON.stringify(SES))
      : localStorage.removeItem("mk-ses");
  } catch (e) {}
};
/**
 * POST helper for Supabase Auth (/auth/v1/<path>). Throws the error JSON on non-2xx.
 * @param {string} path e.g. "token?grant_type=password"
 * @param {object} [body] JSON body
 * @param {string} [tok] optional user token (for authenticated endpoints)
 */
async function sb(path, body, tok) {
  const response = await fetch(AUTH.url + "/auth/v1/" + path, {
    method: "POST",
    headers: Object.assign(
      { apikey: AUTH.anon, "Content-Type": "application/json" },
      tok ? { Authorization: "Bearer " + tok } : {},
    ),
    body: JSON.stringify(body || {}),
  });
  let responseData = {};
  try {
    responseData = await response.json();
  } catch (e) {}
  if (!response.ok) throw responseData;
  return responseData;
}
function setSes(authResponse) {
  const userData = authResponse.user || {};
  SES = {
    access: authResponse.access_token,
    refresh: authResponse.refresh_token,
    exp: Date.now() + (authResponse.expires_in || 3600) * 1000,
    name:
      (userData.user_metadata && userData.user_metadata.full_name) ||
      (SES && SES.name) ||
      "",
    email: userData.email || (SES && SES.email) || "",
  };
  saveS();
  uiAuth();
}
/**
 * Returns a valid access token, refreshing it when it expires in < 60s.
 * On refresh failure the session is cleared and the login UI is shown.
 * @returns {Promise<string|null>} JWT or null when signed out
 */
async function getTok() {
  if (!SES) return null;
  if (SES.exp - Date.now() < 60000) {
    try {
      setSes(
        await sb("token?grant_type=refresh_token", {
          refresh_token: SES.refresh,
        }),
      );
    } catch (e) {
      SES = null;
      saveS();
      uiAuth();
      return null;
    }
  }
  return SES.access;
}
function uiAuth() {
  const a = $("#ab");
  a.textContent = SES ? SES.name || SES.email.split("@")[0] : "تسجيل الدخول";
  tr(a);
  $("#ao").classList.toggle("h", !SES);
  $("#hist").classList.toggle("h", !SES);
  $("#nh").classList.toggle("h", !SES);
  if (!SES) APP_STATE.H = null;
  else if (!APP_STATE.H) loadH();
  loadTk();
}
function amSync() {
  const up = APP_STATE.am === "up";
  $("#af").classList.toggle("h", up);
  $$('[data-s="up"]').forEach((e) => e.classList.toggle("h", !up));
  $("#as").textContent = up ? "إنشاء الحساب" : "دخول";
  tr($("#as"));
  $("#ap").autocomplete = up ? "new-password" : "current-password";
  msg("");
}
function msg(x, ok) {
  const m = $("#am");
  m.textContent = x ? t(x) : "";
  m.className = "msg" + (ok ? " ok" : "");
}
function normalAuth() {
  $('.seg[data-k="am"]').classList.remove("h");
  $$('[data-s="up"]').forEach((e) =>
    e.classList.toggle("h", APP_STATE.am !== "up"),
  );
  $("#ae").previousElementSibling?.classList.remove("h");
  $("#ae").classList.remove("h");
  $("#ap").previousElementSibling?.classList.remove("h");
  $("#ap").classList.remove("h");
  $("#as").classList.remove("h");
  $("#af").classList.remove("h");
  $("#resetBox").classList.add("h");
  $("#amT").textContent = t("الدخول إلى حسابك");
}
function openAuth(note) {
  normalAuth();
  $("#aN").textContent = note ? t(note) : "";
  $("#ov").classList.add("on");
  setTimeout(() => $("#ae").focus(), 50);
}
function closeAuth() {
  $("#ov").classList.remove("on");
  msg("");
}
function acct() {
  if (!SES) openAuth();
}
function needAuth() {
  if (SES) return false;
  openAuth("سجّل الدخول للمتابعة.");
  return true;
}
function errAr(e) {
  const m = String(
    e.msg || e.error_description || e.message || "",
  ).toLowerCase();
  if (m.includes("invalid login")) return "البريد أو كلمة السر غير صحيحة.";
  if (m.includes("already")) return "هذا البريد مسجّل بالفعل، سجّل الدخول.";
  if (m.includes("not confirmed"))
    return "فعّل بريدك أولًا من الرسالة التي وصلتك.";
  if (m.includes("password"))
    return "كلمة السر ضعيفة، استخدم 8 أحرف على الأقل.";
  if (
    e.code === 429 ||
    e.error_code === "over_request_rate_limit" ||
    m.includes("rate") ||
    m.includes("security purposes")
  )
    return "محاولات كثيرة، انتظر قليلًا.";
  console.error("auth error", e);
  return (
    "تعذّر إتمام العملية. [" +
    String(e.msg || e.error_description || e.message || e.error_code || "") +
    "]"
  );
}
function authRedirect() {
  return location.origin + location.pathname;
}
async function authGo() {
  const isSignUp = APP_STATE.am === "up",
    email = $("#ae").value.trim(),
    password = $("#ap").value,
    fullName = $("#an").value.trim(),
    submitButton = $("#as");
  if (!AUTH.anon) return msg("لم يُضبط مفتاح Supabase العام بعد.");
  if (!email || !password || (isSignUp && !fullName))
    return msg("أكمل الحقول المطلوبة.");
  if (isSignUp && password.length < 8)
    return msg("كلمة السر 8 أحرف على الأقل.");
  if (isSignUp && (!$("#ct1").checked || !$("#ct2").checked))
    return msg(
      "يلزم قبول شروط الاستخدام والإقرار بالاطلاع على سياسة الخصوصية.",
    );
  submitButton.disabled = true;
  try {
    if (isSignUp) {
      const j = await sb(
        "signup?redirect_to=" + encodeURIComponent(authRedirect()),
        {
          email: email,
          password: password,
          data: {
            full_name: fullName,
            terms_accepted_at: new Date().toISOString(),
            privacy_ack_at: new Date().toISOString(),
            policy_version: POLICY_VER,
          },
        },
      );
      if (j.access_token) {
        setSes(j);
        closeAuth();
      } else msg("تم إنشاء الحساب. افتح بريدك لتأكيده ثم سجّل الدخول.", 1);
    } else {
      setSes(
        await sb("token?grant_type=password", {
          email: email,
          password: password,
        }),
      );
      closeAuth();
    }
  } catch (e) {
    msg(errAr(e));
  }
  submitButton.disabled = false;
  $("#ap").value = "";
}
async function authForgot() {
  const email = $("#ae").value.trim();
  if (!AUTH.anon) return msg("لم يُضبط مفتاح Supabase العام بعد.");
  if (!email) return msg("اكتب بريدك أولًا.");
  if (location.protocol === "file:")
    return msg(
      "افتح الموقع من رابط (https) وليس من ملف على الجهاز، وإلا لن يعمل رابط الاستعادة.",
    );
  const redirectUrl = authRedirect();
  try {
    const response = await fetch(
      AUTH.url +
        "/auth/v1/recover?redirect_to=" +
        encodeURIComponent(redirectUrl),
      {
        method: "POST",
        headers: { apikey: AUTH.anon, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      },
    );
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {}
      console.error("recover failed", response.status, errorData);
      const errorMessage = String(
        errorData.msg || errorData.message || errorData.error_description || "",
      );
      if (
        response.status === 429 ||
        /rate|security purposes/i.test(errorMessage)
      )
        return msg(
          "تم الوصول للحد المسموح لإرسال الرسائل. حاول مرة أخرى بعد قليل.",
        );
      return msg(
        "تعذّر إرسال الرسالة: " + (errorMessage || "HTTP " + response.status),
      );
    }
  } catch (e) {
    console.error(e);
    return msg("تعذّر الاتصال بـ Supabase. تأكدي من الإنترنت.");
  }
  msg(
    "أرسلنا رابط إعادة التعيين إلى بريدك إن كان مسجّلًا. افتح الرابط من نفس الموقع لإنشاء كلمة سر جديدة. تفقّدي الـ Spam أيضًا.",
    1,
  );
}
function resetMsg(x, ok) {
  const m = $("#rm");
  m.textContent = x ? t(x) : "";
  m.className = "msg" + (ok ? " ok" : "");
}
function openReset() {
  $("#aN").textContent = t("أنشئ كلمة سر جديدة لحسابك.");
  $("#amT").textContent = t("استعادة كلمة السر");
  $('.seg[data-k="am"]').classList.add("h");
  $$('[data-s="up"]').forEach((e) => e.classList.add("h"));
  $("#ae").closest("label")?.classList.add("h");
  $("#ae").classList.add("h");
  $("#ap").previousElementSibling?.classList.add("h");
  $("#ap").classList.add("h");
  $("#as").classList.add("h");
  $("#af").classList.add("h");
  $("#resetBox").classList.remove("h");
  $("#ov").classList.add("on");
  setTimeout(() => $("#rp1").focus(), 50);
}
async function updatePassword() {
  const newPassword = $("#rp1").value,
    passwordConfirmation = $("#rp2").value;
  if (!newPassword || newPassword.length < 8)
    return resetMsg("كلمة السر 8 أحرف على الأقل.");
  if (newPassword !== passwordConfirmation)
    return resetMsg("كلمتا السر غير متطابقتين.");
  const token = SES && SES.access;
  if (!token) return resetMsg("انتهت صلاحية الرابط. اطلب رابطًا جديدًا.");
  const btn = $("#ru");
  btn.disabled = true;
  try {
    const r = await fetch(AUTH.url + "/auth/v1/user", {
      method: "PUT",
      headers: {
        apikey: AUTH.anon,
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!r.ok) throw await r.json().catch(() => ({}));
    resetMsg("تم تغيير كلمة السر بنجاح. يمكنك تسجيل الدخول بها الآن.", 1);
    history.replaceState({}, "", location.pathname);
    setTimeout(() => {
      closeAuth();
      location.reload();
    }, 1200);
  } catch (e) {
    resetMsg(errAr(e));
  } finally {
    btn.disabled = false;
  }
}
function consumeRecoveryLink() {
  const p = new URLSearchParams(location.hash.replace(/^#/, "") || "");
  if (p.get("type") !== "recovery" || !p.get("access_token")) return;
  SES = {
    access: p.get("access_token"),
    refresh: p.get("refresh_token") || "",
    exp: Date.now() + Number(p.get("expires_in") || 3600) * 1000,
  };
  saveS();
  openReset();
}
async function out() {
  const accessToken = SES && SES.access;
  SES = null;
  saveS();
  uiAuth();
  try {
    await sb("logout", {}, accessToken);
  } catch (e) {}
  APP_STATE.hist = [];
  APP_STATE.data = null;
  $("#rep").classList.add("h");
  $("#oR").classList.add("h");
  $("#setup").classList.remove("h");
  $$("#msgs .m").forEach((x, i) => {
    if (i) x.remove();
  });
  toast("تم تسجيل الخروج.");
}
// لا تعمل الأدوات إلا بعد تسجيل الدخول
const _run = run;
run = function () {
  if (needAuth()) return;
  return _run();
};
const _so = sendOther;
sendOther = function () {
  if (needAuth()) return;
  return _so();
};
const _ask = ask;
ask = function (q) {
  if (needAuth()) return;
  return _ask(q);
};
APP_STATE.am = "in";
$$('.seg[data-k="am"] button').forEach((b) =>
  b.addEventListener("click", amSync),
);
$("#ax").onclick = closeAuth;
$("#ov").addEventListener("click", (e) => {
  if (e.target.id === "ov") closeAuth();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAuth();
});
["#ae", "#ap", "#an"].forEach((x) =>
  $(x).addEventListener("keydown", (e) => {
    if (e.key === "Enter") authGo();
  }),
);
// (initial auth UI sync moved to 09-bootstrap.js: it needs functions defined in later modules)
