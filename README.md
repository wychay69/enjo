# ENJO — Wix Headless Storefront (Prototype)

A custom, **headless** e-commerce front end for the ENJO cleaning range, built from
the public ENJO brochure (catalogue v7.2). It is a **static site** — plain HTML, CSS
and vanilla JS, no build step — so it deploys straight to **GitHub Pages**, while being
architected to plug into a real **Wix Stores** backend via **Wix Headless**.

> Prototype only — not affiliated with ENJO GmbH. Product copy is condensed and
> rewritten; thumbnails are generated (no brochure photography is reproduced);
> prices are illustrative placeholders.

---

## How it works

The whole app talks to a single data/cart abstraction, `EnjoStore` (in
`assets/js/store.js`), which has **two interchangeable backends**:

| Mode     | Trigger                                  | Catalogue            | Cart                         | Checkout                     |
|----------|------------------------------------------|----------------------|------------------------------|------------------------------|
| **Mock** | `WIX_CLIENT_ID` empty (default)          | `assets/js/data.js`  | `localStorage`               | Demo message                 |
| **Live** | `WIX_CLIENT_ID` set in `config.js`       | Wix Stores API       | Wix eCom `currentCart`       | Wix-hosted checkout redirect |

Pages never know which mode is active — they only call `EnjoStore.getProducts()`,
`EnjoStore.addToCart()`, `EnjoStore.checkout()`, etc. Switching to live is a
**one-line change**.

```
enjo-headless-store/
├── index.html            # Landing: hero, USPs, categories, featured, savings, lifecycle, CTA
├── shop.html             # Catalogue: search + per-category filter chips + grid
├── product.html          # Product detail (?id=ART-NO): qty, add-to-cart, related
├── cart.html             # Cart: qty edit, remove, summary, checkout handoff
├── assets/
│   ├── css/styles.css     # Design system (petrol + sun palette, per-category accents)
│   └── js/
│       ├── config.js      # ← put your Wix Client ID + currency here
│       ├── data.js        # Brochure-derived catalogue (mock mode)
│       ├── store.js        # Data + cart layer: live Wix OR mock, one API
│       ├── thumb.js        # Procedural on-brand SVG product thumbnails
│       ├── ui.js           # Shared header/footer/nav, cart badge, toast
│       ├── home.js / shop.js / product.js / cart.js
├── .github/workflows/deploy.yml   # GitHub Pages CI
└── .nojekyll              # Serve asset folders verbatim on Pages
```

---

## Run locally

ES module imports (used only when going live) require a server, so don't open the
files via `file://`. Use any static server:

```bash
# Python
python3 -m http.server 8080
# or Node
npx serve .
```

Then open <http://localhost:8080>. It runs immediately in **mock mode** — full
catalogue, search, filtering, cart and quantity editing all work with no backend.

---

## Deploy to GitHub Pages

1. Create a repo and push these files (`main` branch).
2. **Settings → Pages → Source → "GitHub Actions"**.
3. Push — the included workflow (`.github/workflows/deploy.yml`) publishes the site.
   Your prototype goes live at `https://<user>.github.io/<repo>/`.

(`.nojekyll` is included so the `assets/` folders are served as-is.)

---

## Connect a real Wix Stores backend (go live)

1. In Wix, create a **Headless project** and add the **eCommerce / Stores** business
   solution. Add your products (use the brochure Art.-No. as the SKU if you like).
2. Create an **OAuth app** in the project's *Headless Settings* and copy its
   **Client ID** (Headless OAuth needs only a client ID — no secret).
3. Set the redirect/allowed domains to your GitHub Pages URL (and `localhost` for dev).
4. Paste the Client ID into `assets/js/config.js`:

   ```js
   window.ENJO_CONFIG = {
     WIX_CLIENT_ID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
     // ...
   };
   ```

That's it. On reload, `store.js` lazy-loads the Wix SDK from an ESM CDN
(`@wix/sdk`, `@wix/stores`, `@wix/ecom`, `@wix/redirects`), creates an
`OAuthStrategy` client, pulls the live catalogue, manages a visitor cart, and routes
**Checkout** to the secure Wix-hosted payment flow.

> The live code paths follow Wix's documented Headless eCommerce pattern. The Wix SDK
> evolves, so if a method signature has changed, check the current
> [Wix Headless eCommerce docs](https://dev.wix.com/docs/sdk) and adjust the thin
> wrappers in `store.js` — the rest of the app is unaffected.

### Optional: bundle the SDK instead of CDN
For production you may prefer to `npm i @wix/sdk @wix/stores @wix/ecom @wix/redirects`
and bundle (Vite/Astro/Next). The `EnjoStore` API stays identical; only the imports
in `store.js` change from CDN URLs to package names.

---

## Customise

- **Catalogue:** edit `assets/js/data.js` (mock) or manage products in Wix (live).
- **Currency:** `CURRENCY` / `CURRENCY_SYMBOL` / `LOCALE` in `config.js` (default EUR).
- **Brand:** colour tokens and per-category accents live at the top of `styles.css`
  and in `ENJO_CATEGORIES` in `data.js`.

---

## Notes & disclaimers

- Prices are **illustrative placeholders**; the brochure lists none.
- Product thumbnails are **generated SVGs**, not brochure photos.
- "Free shipping over €50" and similar are demo rules in the UI only.
