/* =========================================================================
 * ENJO Headless Store — Cart page
 * ========================================================================= */
(function () {
  const S = window.EnjoStore;
  const root = document.getElementById("cart-root");
  if (!root) return;

  function line(i) {
    const p = i.product;
    const accent = p ? S.accent(p.category) : "#2c6f7e";
    const media = p && p.media
      ? `<img src="${p.media}" alt="${i.name}">`
      : (p ? window.enjoThumb(p, accent) : "");
    const href = p ? `product.html?id=${encodeURIComponent(p.id)}` : "#";
    return `
      <div class="cart-line" data-id="${i.id}" style="--accent:${accent}">
        <a class="cart-line__media" href="${href}">${media}</a>
        <div class="cart-line__main">
          <a class="cart-line__name" href="${href}">${i.name}</a>
          <span class="cart-line__unit">${S.money(i.price)} each</span>
        </div>
        <div class="qty qty--sm">
          <button data-q="-1" aria-label="Decrease">−</button>
          <span class="qty__val">${i.qty}</span>
          <button data-q="1" aria-label="Increase">+</button>
        </div>
        <span class="cart-line__sum">${S.money(i.price * i.qty)}</span>
        <button class="cart-line__rm" data-rm aria-label="Remove">×</button>
      </div>`;
  }

  function render(cart) {
    if (!cart.items.length) {
      root.innerHTML = `
        <div class="cart-empty">
          <h1>Your cart is empty</h1>
          <p>Start your switch to cold-water cleaning.</p>
          <a class="btn btn--sun btn--lg" href="shop.html">Browse the shop</a>
        </div>`;
      return;
    }
    const shipping = cart.subtotal >= 50 ? 0 : 4.9;
    root.innerHTML = `
      <h1 class="cart-title">Your cart</h1>
      <div class="cart-layout">
        <div class="cart-lines">${cart.items.map(line).join("")}</div>
        <aside class="cart-summary">
          <h2>Summary</h2>
          <div class="row"><span>Subtotal</span><span>${S.money(cart.subtotal)}</span></div>
          <div class="row"><span>Shipping</span><span>${shipping === 0 ? "Free" : S.money(shipping)}</span></div>
          ${shipping > 0 ? `<p class="hint">Free shipping over ${S.money(50)}.</p>` : ""}
          <div class="row row--total"><span>Total</span><span>${S.money(cart.subtotal + shipping)}</span></div>
          <button class="btn btn--sun btn--lg btn--block" id="checkout">Checkout</button>
          <a class="cart-cont" href="shop.html">← Continue shopping</a>
          <p class="cart-summary__note">${S.mode === "live"
            ? "Checkout opens a secure Wix-hosted payment page."
            : "Demo cart. Connect Wix Headless to enable real checkout."}</p>
        </aside>
      </div>`;

    root.querySelectorAll(".cart-line").forEach((el) => {
      const id = el.dataset.id;
      el.querySelectorAll("[data-q]").forEach((b) =>
        b.addEventListener("click", async () => {
          const item = cart.items.find((x) => x.id === id);
          const next = item.qty + parseInt(b.dataset.q, 10);
          await S.setQty(id, next);
          refresh();
        }));
      el.querySelector("[data-rm]").addEventListener("click", async () => {
        await S.removeFromCart(id);
        refresh();
      });
    });

    document.getElementById("checkout").addEventListener("click", async (e) => {
      e.target.disabled = true; e.target.textContent = "Preparing…";
      try {
        const res = await S.checkout();
        if (res.ok && res.url) { window.location.href = res.url; return; }
        window.enjoToast(res.message || "Checkout unavailable in demo mode");
      } catch (err) { window.enjoToast("Checkout failed — check Wix connection"); }
      e.target.disabled = false; e.target.textContent = "Checkout";
    });
  }

  async function refresh() {
    try { render(await S.getCart()); }
    catch (e) { root.innerHTML = `<p class="empty">Couldn't load your cart.</p>`; }
  }

  root.innerHTML = `<p class="loading">Loading cart…</p>`;
  refresh();
})();
