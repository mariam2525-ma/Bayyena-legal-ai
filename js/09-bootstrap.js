/**
 * 09-bootstrap.js — start-up calls that depend on functions defined in earlier modules.
 * Kept in its own last file because classic scripts do not hoist functions across files.
 */
amSync(); // reflect the stored session in the account menu
uiAuth(); // show signed-in / signed-out UI (also loads tickets when signed in)
consumeRecoveryLink(); // handle the password-recovery link (#access_token=…&type=recovery)
