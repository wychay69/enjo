/* =========================================================================
 * ENJO Headless Store — Shop / catalogue page
 * ========================================================================= */
(function () {
  const S = window.EnjoStore;
  const grid = document.getElementById("shop-grid");
  const filters = document.getElementById("shop-filters");
  const heading = document.getElementById("shop-heading");
  const tagline = document.getElementById("shop-tagline");
  const countEl = document.getElementById("shop-count");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  let active = params.get("c") || "all";
  let query = (params.get("q") || "").toLowerCase();
  let all = [];

  function card(p) {
    const cat = S.category(p.category);
    const accent = cat ? cat.accent : "#2c6f7e";
    const media = p.media
      ? `<img src="${p.media}" alt="${p.name}" loading="lazy">`
      : window.enjoThumb(p, accent);
    return `
      <article class="card" style="--accent:${accent}">
        <a class="card__media" href="product.html?id=${encodeURIComponent(p.id)}">
          ${media}
          <span class="card__cat">${cat ? cat.name : ""}</span>
        </a>
        <div class="card__body">
          <h3><a href="product.html?id=${encodeURIComponent(p.id)}">${p.name}</a></h3>
          <p>${p.blurb || ""}</p>
          <div class="card__foot">
            <span class="price">${S.money(p.price)}</span>
            <button class="btn btn--sun" data-add="${p.id}">Add</button>
          </div>
        </div>
      </article>`;
  }

  function visible() {
    return all.filter((p) => {
      const okCat = active === "all" || p.category === active;
      const okQ = !query ||
        (p.name + " " + (p.blurb || "") + " " + (p.tags || []).join(" "))
          .toLowerCase().includes(query);
      return okCat && okQ;
    });
  }

  function renderFilters() {
    const cats = S.categories();
    const chip = (slug, name, accent) =>
      `<button class="chip${slug === active ? " is-active" : ""}" data-cat="${slug}"
        style="--accent:${accent || "#2c6f7e"}">${name}</button>`;
    filters.innerHTML =
      chip("all", "All", "#2c6f7e") +
      cats.map((c) => chip(c.slug, c.name, c.accent)).join("");
  }

  function renderGrid() {
    const items = visible();
    const cat = active === "all" ? null : S.category(active);
    heading.textContent = cat ? cat.name : "All products";
    tagline.textContent = cat ? cat.tagline : "Everything you need to clean your whole home with cold water.";
    countEl.textContent = items.length + (items.length === 1 ? " product" : " products");
    grid.innerHTML = items.length
      ? items.map(card).join("")
      : `<p class="empty">No products match your search.</p>`;
  }

  function syncUrl() {
    const u = new URLSearchParams();
    if (active !== "all") u.set("c", active);
    if (query) u.set("q", query);
    history.replaceState(null, "", "shop.html" + (u.toString() ? "?" + u : ""));
  }

  filters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    active = b.dataset.cat;
    renderFilters(); renderGrid(); syncUrl();
    window.scrollTo({ top: filters.offsetTop - 90, behavior: "smooth" });
  });

  grid.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    b.disabled = true; b.textContent = "Adding…";
    try {
      await S.addToCart(b.dataset.add, 1);
      const p = all.find((x) => x.id === b.dataset.add);
      window.enjoToast((p ? p.name : "Item") + " added to cart");
    } catch (err) { window.enjoToast("Could not add — check Wix connection"); }
    b.disabled = false; b.textContent = "Add";
  });

  const search = document.getElementById("shop-search");
  if (search) {
    search.value = query;
    search.addEventListener("input", () => {
      query = search.value.toLowerCase();
      renderGrid(); syncUrl();
    });
  }

  (async function init() {
    grid.innerHTML = `<p class="loading">Loading catalogue…</p>`;
    try { all = await S.getProducts(); }
    catch (e) { grid.innerHTML = `<p class="empty">Couldn't load products.</p>`; return; }
    renderFilters();
    renderGrid();
  })();
})();
