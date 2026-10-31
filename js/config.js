/**
 * config.js — all deployment-specific settings in ONE place.
 * Loaded before every other script. Edit this file when you change n8n or Supabase projects.
 */
/* exported AUTH_HEADERS, AUTH */
/** Extra headers added to every backend request (none by default). */
const AUTH_HEADERS = {};

/** n8n webhook endpoints used by the UI. Every workflow must be ACTIVE in n8n. */
const WH = {
  review: "https://maryamabo.app.n8n.cloud/webhook/legal-ai/review",
  draft: "https://maryamabo.app.n8n.cloud/webhook/legal-ai/draft",
  research: "https://maryamabo.app.n8n.cloud/webhook/legal-ai/research",
  chat: "https://maryamabo.app.n8n.cloud/webhook/legal-ai/chat",
  web: "https://maryamabo.app.n8n.cloud/webhook/legal-ai/web-search",
  translate:
    "https://maryamabo.app.n8n.cloud/webhook/translate-contract-hybrid",
};

/**
 * Supabase project settings.
 * `anon` is the PUBLISHABLE key: it is designed to be public and is protected by Row Level Security.
 * NEVER put a service_role / secret key here.
 */
const AUTH = {
  url: "https://dcuowxwpihkvqxbkpsxp.supabase.co",
  anon: "sb_publishable_VbaS7EioE3CRn0nkSvw_nA_96zAoSdu",
};

WH.support = "https://maryamabo.app.n8n.cloud/webhook/legal-ai/support";
