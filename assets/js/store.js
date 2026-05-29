/* =========================================================================
 * ENJO Headless Store — Data & cart layer
 * -------------------------------------------------------------------------
 * One API, two backends:
 *   • MOCK  (no Wix Client ID) → catalogue from data.js, cart in localStorage.
 *   • LIVE  (Wix Client ID set) → Wix Stores catalogue + Wix eCom cart +
 *           Wix-hosted checkout redirect.
 *
 * Pages only ever call EnjoStore.* — they never need to know which mode is on.
 * The Wix SDK is loaded on demand from an ESM CDN, so there is NO build step.
 * ========================================================================= */
(function () {
  const CFG = window.ENJO_CONFIG;
  const LIVE = !!(CFG && CFG.WIX_CLIENT_ID && CFG.WIX_CLIENT_ID.trim());
  const CART_KEY = "enjo_cart_v1";
  const TOKENS_KEY = "enjo_wix_tokens_v1";

  /* ---- shared helpers --------------------------------------------------- */
  function emit() {
    window.dispatchEvent(new CustomEvent("enjo:cart"));
  }
  function money(n) {
    try {
      return new Intl.NumberFormat(CFG.LOCALE || "en", {
        style: "currency", currency: CFG.CURRENCY || "EUR",
      }).format(n);
    } catch (e) {
      return (CFG.CURRENCY_SYMBOL || "€") + Number(n).toFixed(2);
    }
  }

  /* =======================================================================
   * MOCK BACKEND
   * ===================================================================== */
  const Mock = {
    products() { return Promise.resolve(window.ENJO_PRODUCTS.slice()); },
    product(id) {
      return Promise.resolve(window.ENJO_PRODUCTS.find((p) => p.id === id) || null);
    },
    readCart() {
      try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
      catch (e) { return []; }
    },
    writeCart(lines) {
      try { localStorage.setItem(CART_KEY, JSON.stringify(lines)); } catch (e) {}
      emit();
    },
    cart() {
      const lines = Mock.readCart();
      const byId = Object.fromEntries(window.ENJO_PRODUCTS.map((p) => [p.id, p]));
      const items = lines
        .map((l) => {
          const p = byId[l.id];
          if (!p) return null;
          return { id: p.id, name: p.name, price: p.price, qty: l.qty, product: p };
        })
        .filter(Boolean);
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      return Promise.resolve({ items, subtotal });
    },
    add(id, qty) {
      const lines = Mock.readCart();
      const ex = lines.find((l) => l.id === id);
      if (ex) ex.qty += qty; else lines.push({ id, qty });
      Mock.writeCart(lines);
      return Promise.resolve();
    },
    setQty(id, qty) {
      let lines = Mock.readCart();
      if (qty <= 0) lines = lines.filter((l) => l.id !== id);
      else { const ex = lines.find((l) => l.id === id); if (ex) ex.qty = qty; }
      Mock.writeCart(lines);
      return Promise.resolve();
    },
    remove(id) { return Mock.setQty(id, 0); },
    checkout() {
      return Promise.resolve({
        ok: false,
        message:
          "Demo checkout. Connect a Wix Headless Client ID in assets/js/config.js " +
          "to enable real Wix-hosted checkout.",
      });
    },
  };

  /* =======================================================================
   * LIVE BACKEND (Wix Headless)
   * ===================================================================== */
  const Live = (function () {
    let clientPromise = null;

    async function getClient() {
      if (clientPromise) return clientPromise;
      clientPromise = (async () => {
        const base = CFG.SDK_CDN || "https://esm.sh";
        const [{ createClient, OAuthStrategy }, stores, ecom, redirects] =
          await Promise.all([
            import(base + "/@wix/sdk"),
            import(base + "/@wix/stores"),
            import(base + "/@wix/ecom"),
            import(base + "/@wix/redirects"),
          ]);

        let tokens;
        try { tokens = JSON.parse(localStorage.getItem(TOKENS_KEY)); } catch (e) {}

        const client = createClient({
          modules: {
            products: stores.products,
            currentCart: ecom.currentCart,
            redirects: redirects.redirects,
          },
          auth: OAuthStrategy({ clientId: CFG.WIX_CLIENT_ID, tokens }),
        });

        // Establish / refresh an anonymous visitor session so the cart persists.
        try {
          const t = await client.auth.generateVisitorTokens(tokens || undefined);
          localStorage.setItem(TOKENS_KEY, JSON.stringify(t));
        } catch (e) { /* a fresh session will be created on demand */ }

        return client;
      })();
      return clientPromise;
    }

    // Map a Wix Stores product to the shape the UI expects.
    function mapProduct(p) {
      const price = p.priceData ? p.priceData.price
        : p.price ? p.price.price : 0;
      return {
        id: p._id,
        slug: p.slug,
        name: p.name,
        category: (p.collectionIds && p.collectionIds[0]) || "kitchen",
        form: "cloth",
        price: price || 0,
        blurb: (p.description || "").replace(/<[^>]+>/g, "").slice(0, 200),
        media: p.media && p.media.mainMedia && p.media.mainMedia.image
          ? p.media.mainMedia.image.url : null,
        _wix: p,
      };
    }

    return {
      async products() {
        const client = await getClient();
        const res = await client.products.queryProducts().limit(100).find();
        return res.items.map(mapProduct);
      },
      async product(id) {
        const client = await getClient();
        try {
          const res = await client.products.getProduct(id);
          return mapProduct(res.product || res);
        } catch (e) {
          const all = await Live.products();
          return all.find((p) => p.id === id || p.slug === id) || null;
        }
      },
      async cart() {
        const client = await getClient();
        let cart;
        try { cart = await client.currentCart.getCurrentCart(); }
        catch (e) { return { items: [], subtotal: 0 }; }
        const items = (cart.lineItems || []).map((li) => ({
          id: li._id,
          name: li.productName ? li.productName.translated : "Item",
          price: li.price ? Number(li.price.amount) : 0,
          qty: li.quantity,
          _wix: li,
        }));
        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
        return { items, subtotal };
      },
      async add(id, qty) {
        const client = await getClient();
        await client.currentCart.addToCurrentCart({
          lineItems: [{
            catalogReference: {
              appId: CFG.WIX_STORES_APP_ID,
              catalogItemId: id,
            },
            quantity: qty,
          }],
        });
        emit();
      },
      async setQty(lineId, qty) {
        const client = await getClient();
        if (qty <= 0) {
          await client.currentCart.removeLineItemsFromCurrentCart([lineId]);
        } else {
          await client.currentCart.updateCurrentCartLineItemQuantity([
            { _id: lineId, quantity: qty },
          ]);
        }
        emit();
      },
      async remove(lineId) { return Live.setQty(lineId, 0); },
      async checkout() {
        const client = await getClient();
        const { checkoutId } = await client.currentCart.createCheckoutFromCurrentCart({
          channelType: "WEB",
        });
        const { redirectSession } = await client.redirects.createRedirectSession({
          ecomCheckout: { checkoutId },
          callbacks: {
            postFlowUrl: window.location.origin,
            thankYouPageUrl: window.location.origin + "/index.html",
          },
        });
        return { ok: true, url: redirectSession.fullUrl };
      },
    };
  })();

  const B = LIVE ? Live : Mock;

  /* =======================================================================
   * PUBLIC API
   * ===================================================================== */
  window.EnjoStore = {
    mode: LIVE ? "live" : "mock",
    money,
    categories() { return window.ENJO_CATEGORIES.slice(); },
    category(slug) { return window.ENJO_CATEGORIES.find((c) => c.slug === slug); },
    accent(slug) { const c = this.category(slug); return c ? c.accent : "#2c6f7e"; },
    getProducts() { return B.products(); },
    getProduct(id) { return B.product(id); },
    getCart() { return B.cart(); },
    addToCart(id, qty) { return B.add(id, qty || 1); },
    setQty(lineId, qty) { return B.setQty(lineId, qty); },
    removeFromCart(lineId) { return B.remove(lineId); },
    checkout() { return B.checkout(); },
    async count() {
      const c = await B.cart();
      return c.items.reduce((s, i) => s + i.qty, 0);
    },
    onChange(fn) { window.addEventListener("enjo:cart", fn); },
  };
})();
