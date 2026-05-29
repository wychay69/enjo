/* =========================================================================
 * ENJO Headless Store — Home page dynamic sections
 * ========================================================================= */
(function () {
  const S = window.EnjoStore;
  const catWrap = document.getElementById("home-categories");
  const featWrap = document.getElementById("home-featured");

  if (catWrap) {
    catWrap.innerHTML = S.categories().map((c) => `
      <a class="cat-tile" href="shop.html?c=${c.slug}" style="--accent:${c.accent}">
        <span class="cat-tile__name">${c.name}</span>
        <span class="cat-tile__tag">${c.tagline}</span>
        <span class="cat-tile__go" aria-hidden="true">→</span>
      </a>`).join("");
  }

  function card(p) {
    const accent = S.accent(p.category);
    const media = p.media
      ? `<img src="${p.media}" alt="${p.name}" loading="lazy">`
      : window.enjoThumb(p, accent);
    return `
      <article class="card" style="--accent:${accent}">
        <a class="card__media" href="product.html?id=${encodeURIComponent(p.id)}">
          ${media}
          <span class="card__cat">${S.category(p.category) ? S.category(p.category).name : ""}</span>
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

  if (featWrap) {
    const picks = ["50000", "50100", "51000", "50600", "50404", "52002", "50226", "50700"];
    (async function () {
      featWrap.innerHTML = `<p class="loading">Loading favourites…</p>`;
      let all = [];
      try { all = await S.getProducts(); } catch (e) {}
      let feat = all.filter((p) => picks.includes(p.id));
      if (feat.length < 4) feat = all.slice(0, 8);
      featWrap.innerHTML = feat.map(card).join("");
      featWrap.addEventListener("click", async (e) => {
        const b = e.target.closest("[data-add]");
        if (!b) return;
        b.disabled = true; b.textContent = "Adding…";
        try {
          await S.addToCart(b.dataset.add, 1);
          const p = all.find((x) => x.id === b.dataset.add);
          window.enjoToast((p ? p.name : "Item") + " added to cart");
        } catch (err) { window.enjoToast("Could not add"); }
        b.disabled = false; b.textContent = "Add";
      });
    })();
  }

  // simple scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
})();
