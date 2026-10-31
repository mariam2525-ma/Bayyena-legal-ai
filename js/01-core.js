/**
 * 01-core.js — Core helpers: DOM shortcuts ($, $$), HTML escaping (esc), toast notifications and global UI state (APP_STATE).
 */
/* exported POLICY_VER, CONFIG, $$, esc, toast, APP_STATE */
const POLICY_VER = "1.0";
const CONFIG = { name: "مُحكَم", nameEn: "Muhkam", apiBase: "" }; // الاسم من هنا فقط؛ apiBase = عنوان الخادم الوسيط
const $ = (selector) => document.querySelector(selector),
  $$ = (selector) => [...document.querySelectorAll(selector)];
/**
 * Escapes the five HTML-significant characters. ALWAYS use it before putting
 * user- or AI-provided text into innerHTML (XSS protection).
 * @param {*} value value to escape
 * @returns {string}
 */
const esc = (value) =>
  String(value).replace(
    /[&<>\"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[character],
  );
$("#yr").textContent = new Date().getFullYear();
/**
 * Shows a short non-blocking message (auto-hides after ~3.8s). Text is translated by t().
 * @param {string} messageKey Arabic message key/text
 */
function toast(messageKey) {
  const toastElement = $("#toast");
  toastElement.textContent = t(messageKey);
  toastElement.classList.add("on");
  clearTimeout(toast.i);
  toast.i = setTimeout(() => toastElement.classList.remove("on"), 3800);
}
const APP_STATE = {
  role: "المستأجر",
  type: "عقد إيجار سكني",
  status: "قبل التوقيع",
  file: null,
  transFile: null,
  web: false,
  risk: 0,
  data: null,
};
