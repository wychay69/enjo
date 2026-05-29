/* =========================================================================
 * ENJO Headless Store — Runtime configuration
 * -------------------------------------------------------------------------
 * Leave WIX_CLIENT_ID empty ("") to run the prototype in MOCK mode using the
 * brochure-derived catalogue in data.js (no backend required — perfect for a
 * GitHub Pages prototype).
 *
 * To go live against a real Wix Stores backend (Wix Headless):
 *   1. Create a Wix project, add the "eCommerce" / "Stores" business solution.
 *   2. Create an OAuth app in the project's Headless Settings and copy its
 *      Client ID.
 *   3. Paste it below. The data layer in store.js will automatically switch
 *      from mock data to live Wix APIs — no other code changes required.
 * ========================================================================= */
window.ENJO_CONFIG = {
  // Paste your Wix Headless OAuth Client ID here to enable live mode:
  WIX_CLIENT_ID: "",

  // Standard Wix Stores app id (do not change unless Wix updates it).
  WIX_STORES_APP_ID: "1380b703-ce81-ff05-f115-39571d94dfcd",

  // ESM CDN used to load the Wix SDK in the browser (no build step needed).
  SDK_CDN: "https://esm.sh",

  // Display currency for the prototype. Prices in data.js are ILLUSTRATIVE
  // placeholders only (the brochure lists no prices).
  CURRENCY: "EUR",
  CURRENCY_SYMBOL: "€",
  LOCALE: "de-AT",
};
