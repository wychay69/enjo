/* =========================================================================
 * ENJO Headless Store — Procedural product thumbnails
 * -------------------------------------------------------------------------
 * Generates a clean, on-brand SVG for each product using its category accent
 * and a simple icon for its "form". This avoids reproducing the brochure's
 * copyrighted product photography while keeping the prototype visually rich.
 * In live Wix mode, real product media replaces these automatically.
 * ========================================================================= */
(function () {
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Minimal icon path per product form, drawn on a 120x120 canvas centred ~ (60,60).
  const ICONS = {
    glove:  '<path d="M44 38h22a6 6 0 0 1 6 6v18l8-6 6 7-14 16v9H44V38z" fill="#fff" opacity=".92"/><path d="M50 46h10M50 54h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".5"/>',
    cloth:  '<rect x="36" y="40" width="48" height="40" rx="5" fill="#fff" opacity=".92"/><path d="M44 50h32M44 60h32M44 70h22" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".45"/>',
    fil:    '<path d="M40 44l40 6-2 30-36-4z" fill="#fff" opacity=".92"/><path d="M46 54l30 4M45 64l31 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".4"/>',
    towel:  '<rect x="38" y="38" width="44" height="44" rx="4" fill="#fff" opacity=".92"/><path d="M38 50h44M38 58h44M38 66h44M38 74h44" stroke="currentColor" stroke-width="1.6" opacity=".4"/>',
    sponge: '<rect x="36" y="46" width="48" height="30" rx="8" fill="#fff" opacity=".92"/><circle cx="48" cy="58" r="2.4" fill="currentColor" opacity=".4"/><circle cx="60" cy="65" r="2.4" fill="currentColor" opacity=".4"/><circle cx="72" cy="56" r="2.4" fill="currentColor" opacity=".4"/>',
    floor:  '<rect x="34" y="48" width="52" height="20" rx="5" fill="#fff" opacity=".92"/><path d="M40 56h40M40 62h40" stroke="currentColor" stroke-width="2" opacity=".4"/><rect x="56" y="34" width="8" height="16" rx="3" fill="#fff" opacity=".7"/>',
    tool:   '<rect x="56" y="32" width="8" height="40" rx="4" fill="#fff" opacity=".9"/><path d="M44 72c8-6 24-6 32 0" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".92"/>',
    pad:    '<circle cx="60" cy="60" r="22" fill="#fff" opacity=".92"/><circle cx="60" cy="60" r="13" fill="none" stroke="currentColor" stroke-width="2" opacity=".4"/>',
    bottle: '<path d="M54 32h12v8l4 6v32a4 4 0 0 1-4 4H54a4 4 0 0 1-4-4V46l4-6z" fill="#fff" opacity=".92"/><rect x="53" y="54" width="14" height="14" rx="2" fill="currentColor" opacity=".22"/>',
    bag:    '<path d="M42 46h36l-3 36H45z" fill="#fff" opacity=".92"/><path d="M50 46c0-8 4-12 10-12s10 4 10 12" stroke="currentColor" stroke-width="2.5" fill="none" opacity=".5"/>',
  };

  // Brand "sun" rays mark, drawn faintly in the corner.
  function sunMark(color) {
    let rays = "";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      rays += `<line x1="${Math.cos(a) * 7}" y1="${Math.sin(a) * 7}" x2="${Math.cos(a) * 12}" y2="${Math.sin(a) * 12}" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>`;
    }
    return `<g transform="translate(102,18)" opacity=".85"><circle r="5" fill="${color}"/>${rays}</g>`;
  }

  window.enjoThumb = function (product, accent) {
    const a = accent || "#2c6f7e";
    const light = shade(a, 60), dark = shade(a, -36);
    const icon = ICONS[product.form] || ICONS.cloth;
    const id = "g" + product.id;
    return `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${product.name}" style="color:${dark}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${light}"/>
      <stop offset="1" stop-color="${a}"/>
    </linearGradient>
    <radialGradient id="${id}b" cx=".3" cy=".25" r=".9">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".35"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="120" height="120" rx="14" fill="url(#${id})"/>
  <rect width="120" height="120" rx="14" fill="url(#${id}b)"/>
  <circle cx="92" cy="96" r="34" fill="#ffffff" opacity=".10"/>
  <circle cx="24" cy="30" r="16" fill="#ffffff" opacity=".08"/>
  ${icon}
  ${sunMark("#ffd21f")}
</svg>`.trim();
  };
})();
