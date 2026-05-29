/* =========================================================================
 * ENJO Headless Store — Product detail page
 * ========================================================================= */
(function () {
  const S = window.EnjoStore;
  const root = document.getElementById("product-root");
  if (!root) return;

  const id = new URLSearchParams(location.search).get("id");

  function relatedCard(p) {
    const accent = S.accent(p.category);
    const media = p.media
      ? `<img src="${p.media}" alt="${p.name}" loading="lazy">`
      : window.enjoThumb(p, accent);
    return `
      <a class="mini" href="product.html?id=${encodeURIComponent(p.id)}" style="--accent:${accent}">
        <span class="mini__media">${media}</span>
        <span class="mini__name">${p.name}</span>
        <span class="mini__price">${S.money(p.price)}</span>
      </a>`;
  }

  function render(p, related) {
    const cat = S.category(p.category);
    const accent = cat ? cat.accent : "#2c6f7e";
    const media = p.media
      ? `<img src="${p.media}" alt="${p.name}">`
      : window.enjoThumb(p, accent);
    document.title = p.name + " · ENJO";
    root.style.setProperty("--accent", accent);
    root.innerHTML = `
      <nav class="crumbs">
        <a href="index.html">Home</a><span>/</span>
        <a href="shop.html">Shop</a><span>/</span>
        <a href="shop.html?c=${p.category}">${cat ? cat.name : ""}</a>
      </nav>
      <div class="pdp">
        <div class="pdp__media">${media}</div>
        <div class="pdp__info">
          <span class="pdp__cat">${cat ? cat.name : ""}</span>
          <h1>${p.name}</h1>
          <p class="pdp__art">Art.-No. ${p.id}</p>
          <p class="pdp__blurb">${p.blurb || ""}</p>
          <div class="pdp__price">${S.money(p.price)}</div>
          <div class="pdp__buy">
            <div class="qty">
              <button data-q="-1" aria-label="Decrease">−</button>
              <input id="pdp-qty" type="number" min="1" value="1" inputmode="numeric">
              <button data-q="1" aria-label="Increase">+</button>
            </div>
            <button class="btn btn--sun btn--lg" id="pdp-add">Add to cart</button>
          </div>
          ${p.caution ? `<div class="note note--warn"><strong>Good to know.</strong> ${p.caution}</div>` : ""}
          <ul class="pdp__usps">
            <li>Cleans with cold water only — no detergents</li>
            <li>Reusable for ~3 years, then 100% recyclable</li>
            <li>OEKO-TEX® Standard 100 · Made in Austria</li>
          </ul>
          ${(p.tags && p.tags.length) ? `<div class="tagrow">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
        </div>
      </div>
      ${related.length ? `
      <section class="related">
        <h2>More from ${cat ? cat.name : "ENJO"}</h2>
        <div class="related__row">${related.map(relatedCard).join("")}</div>
      </section>` : ""}
    `;

    const qtyEl = document.getElementById("pdp-qty");
    root.querySelectorAll("[data-q]").forEach((b) =>
      b.addEventListener("click", () => {
        const v = Math.max(1, (parseInt(qtyEl.value, 10) || 1) + parseInt(b.dataset.q, 10));
        qtyEl.value = v;
      }));

    document.getElementById("pdp-add").addEventListener("click", async (e) => {
      const qty = Math.max(1, parseInt(qtyEl.value, 10) || 1);
      e.target.disabled = true; e.target.textContent = "Adding…";
      try {
        await S.addToCart(p.id, qty);
        window.enjoToast(p.name + " × " + qty + " added");
      } catch (err) { window.enjoToast("Could not add — check Wix connection"); }
      e.target.disabled = false; e.target.textContent = "Add to cart";
    });
  }

  (async function init() {
    if (!id) { root.innerHTML = `<p class="empty">No product specified.</p>`; return; }
    root.innerHTML = `<p class="loading">Loading…</p>`;
    let p, all = [];
    try {
      p = await S.getProduct(id);
      all = await S.getProducts();
    } catch (e) {}
    if (!p) { root.innerHTML = `<p class="empty">Product not found. <a href="shop.html">Back to shop</a></p>`; return; }
    const related = all.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    render(p, related);
  })();
})();
