/* =========================================================================
 * ENJO Headless Store — Shared UI chrome
 * ========================================================================= */
(function () {
  const path = location.pathname.split("/").pop() || "index.html";

  const logo = `
    <a class="logo" href="index.html" aria-label="ENJO home">
      <span class="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="26" height="26">
          <g transform="translate(20,20)">
            <circle r="6.5" fill="#ffd21f"/>
            ${Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return `<line x1="${Math.cos(a) * 9}" y1="${Math.sin(a) * 9}" x2="${Math.cos(a) * 14}" y2="${Math.sin(a) * 14}" stroke="#ffd21f" stroke-width="3" stroke-linecap="round"/>`;
            }).join("")}
          </g>
        </svg>
      </span>
      <span class="logo__text">
        <strong>ENJO</strong>
        <em>clean the world</em>
      </span>
    </a>`;

  const nav = [
    ["index.html", "Home"],
    ["shop.html", "Shop"],
    ["shop.html?c=kitchen", "Kitchen"],
    ["shop.html?c=bathroom", "Bathroom"],
    ["shop.html?c=floors", "Floors"],
    ["shop.html?c=skin", "Skin Care"],
  ];

  function navLinks() {
    return nav.map(([href, label]) => {
      const active = href === path ? ' aria-current="page"' : "";
      return `<a href="${href}"${active}>${label}</a>`;
    }).join("");
  }

  const header = `
    <div class="bar">
      ${logo}
      <nav class="nav" aria-label="Primary">${navLinks()}</nav>
      <div class="bar__actions">
        <a class="cart-btn" href="cart.html" aria-label="Cart">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="10" cy="21" r="1.3" fill="currentColor"/><circle cx="18" cy="21" r="1.3" fill="currentColor"/>
          </svg>
          <span class="cart-btn__count" data-cart-count hidden>0</span>
        </a>
        <button class="menu-toggle" aria-label="Menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
    <div class="mobile-nav" hidden>${navLinks()}</div>`;

  const footer = `
    <div class="foot__grid">
      <div class="foot__brand">
        ${logo}
        <p>The fibre that only needs cold water. Effective, sustainable cleaning with high-quality Austrian fibres &amp; pure water — since 1990.</p>
        <span class="badge-row">
          <span class="badge">OEKO-TEX® Standard 100</span>
          <span class="badge">Made in Austria</span>
          <span class="badge">0 additional waste</span>
        </span>
      </div>
      <div>
        <h4>Shop</h4>
        <a href="shop.html?c=kitchen">Kitchen</a>
        <a href="shop.html?c=bathroom">Bathroom &amp; Sanitary</a>
        <a href="shop.html?c=floors">Floors</a>
        <a href="shop.html?c=windows">Windows &amp; Surfaces</a>
        <a href="shop.html?c=skin">Skin Care</a>
        <a href="shop.html">All products</a>
      </div>
      <div>
        <h4>About</h4>
        <a href="index.html#vision">Our vision</a>
        <a href="index.html#why">Why ENJO</a>
        <a href="index.html#lifecycle">Life cycle</a>
        <a href="index.html#recycle">Recycling</a>
      </div>
      <div>
        <h4>Prototype</h4>
        <span class="mode-pill" data-mode-pill>mock mode</span>
        <p class="foot__note">Wix Headless storefront prototype. Set a Wix Client ID in <code>config.js</code> to go live.</p>
      </div>
    </div>
    <div class="foot__base">
      <span>Prototype storefront · not affiliated with ENJO GmbH. Built on Wix Headless.</span>
      <span>Catalogue data &amp; visuals derived from the public ENJO brochure v7.2.</span>
    </div>`;

  function mount() {
    document.querySelectorAll("[data-enjo-header]").forEach((el) => {
      el.className = "site-header"; el.innerHTML = header;
    });
    document.querySelectorAll("[data-enjo-footer]").forEach((el) => {
      el.className = "site-footer"; el.innerHTML = footer;
    });

    // mobile menu
    const toggle = document.querySelector(".menu-toggle");
    const mnav = document.querySelector(".mobile-nav");
    if (toggle && mnav) {
      toggle.addEventListener("click", () => {
        const open = mnav.hasAttribute("hidden");
        if (open) mnav.removeAttribute("hidden"); else mnav.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.classList.toggle("is-open", open);
      });
    }

    // mode pill
    document.querySelectorAll("[data-mode-pill]").forEach((el) => {
      el.textContent = window.EnjoStore.mode === "live" ? "live · Wix" : "mock mode";
      el.classList.toggle("is-live", window.EnjoStore.mode === "live");
    });

    refreshBadge();
    window.EnjoStore.onChange(refreshBadge);
  }

  async function refreshBadge() {
    let n = 0;
    try { n = await window.EnjoStore.count(); } catch (e) {}
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = n;
      if (n > 0) el.removeAttribute("hidden"); else el.setAttribute("hidden", "");
    });
  }

  // Toast
  let toastEl;
  window.enjoToast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove("show"), 2200);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else { mount(); }
})();
