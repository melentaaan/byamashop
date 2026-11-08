/* BYAMASHOP — logique de la boutique (pas besoin de modifier ce fichier) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => n.toLocaleString("fr-FR").replace(/ | /g, " ") + " " + SHOP.currency;
  const catOf = id => CATEGORIES.find(c => c.id === id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const waURL = text => `https://wa.me/${SHOP.whatsapp}${text ? "?text=" + encodeURIComponent(text) : ""}`;

  /* ---------- Visuel par défaut quand il n'y a pas de photo ---------- */
  function placeholder(p) {
    const c = catOf(p.cat) || { colors: ["#7C3AED", "#FF6FB5"], emoji: "🛍️" };
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c.colors[0]}'/><stop offset='1' stop-color='${c.colors[1]}'/></linearGradient></defs>
      <rect width='400' height='400' fill='url(#g)'/>
      <circle cx='330' cy='70' r='90' fill='#fff' opacity='.12'/><circle cx='60' cy='360' r='110' fill='#fff' opacity='.10'/>
      <text x='200' y='225' font-size='130' text-anchor='middle'>${c.emoji}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  const imgOf = p => p.image || placeholder(p);

  /* ---------- Infos boutique ---------- */
  $("#waText").textContent = SHOP.phone;
  $("#phoneText").textContent = SHOP.phone;
  $("#addrText").textContent = SHOP.address;
  $("#waLink").href = waURL("Bonjour Byamashop 👋");
  $("#waFloat").href = waURL("Bonjour Byamashop 👋, j'ai une question.");
  $("#phoneLink").href = "tel:" + SHOP.phone.replace(/\s/g, "");
  $("#wholesaleBtn").href = waURL("Bonjour Byamashop, je souhaite un devis pour une commande en gros.");
  $("#igLink").href = SHOP.instagram; $("#tkLink").href = SHOP.tiktok; $("#fbLink").href = SHOP.facebook;
  $("#year").textContent = new Date().getFullYear();
  [$("#waLink"), $("#waFloat"), $("#wholesaleBtn")].forEach(a => { a.target = "_blank"; a.rel = "noopener"; });

  /* ---------- Catégories ---------- */
  let activeCat = "all", query = "", sort = "default";

  $("#catGrid").innerHTML = CATEGORIES.map(c => {
    const n = PRODUCTS.filter(p => p.cat === c.id).length;
    return `<button class="cat-card" data-cat="${c.id}" style="--c1:${c.colors[0]};--c2:${c.colors[1]}">
      <span class="cat-emoji">${c.emoji}</span><strong>${esc(c.name)}</strong><small>${n} article${n > 1 ? "s" : ""}</small></button>`;
  }).join("");

  $("#filters").innerHTML = `<button class="chip active" data-cat="all">Tout</button>` +
    CATEGORIES.map(c => `<button class="chip" data-cat="${c.id}">${c.emoji} ${esc(c.name)}</button>`).join("");

  $("#footerCats").innerHTML = CATEGORIES.map(c => `<a href="#boutique" data-cat="${c.id}">${esc(c.name)}</a>`).join("");

  function setCat(cat, scroll) {
    activeCat = cat;
    $$("#filters .chip").forEach(b => b.classList.toggle("active", b.dataset.cat === cat));
    render();
    if (scroll) $("#boutique").scrollIntoView({ behavior: "smooth" });
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    e.preventDefault();
    setCat(b.dataset.cat, !b.closest("#filters"));
  });

  $("#searchInput").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); render(); });
  $("#sortSelect").addEventListener("change", e => { sort = e.target.value; render(); });

  /* ---------- Produits ---------- */
  function render() {
    let list = PRODUCTS.filter(p =>
      (activeCat === "all" || p.cat === activeCat) &&
      (!query || (p.name + " " + p.desc + " " + (catOf(p.cat)?.name || "")).toLowerCase().includes(query)));
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));

    $("#emptyMsg").hidden = list.length > 0;
    $("#productGrid").innerHTML = list.map(p => `
      <article class="product">
        <button class="product-img" data-view="${p.id}" aria-label="Voir ${esc(p.name)}">
          <img src="${imgOf(p)}" alt="${esc(p.name)}">
          ${p.tag ? `<span class="tag tag-${p.tag.toLowerCase().replace(/[^a-z]/g, "")}">${esc(p.tag)}</span>` : ""}
        </button>
        <div class="product-body">
          <small class="product-cat">${esc(catOf(p.cat)?.name || "")}</small>
          <h3 data-view="${p.id}">${esc(p.name)}</h3>
          <div class="price">${fmt(p.price)} ${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : ""}</div>
          <button class="btn btn-primary btn-sm btn-block" data-add="${p.id}">Ajouter au panier</button>
        </div>
      </article>`).join("");
  }

  $("#productGrid").addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    const view = e.target.closest("[data-view]");
    if (add) {
      const p = PRODUCTS.find(x => x.id == add.dataset.add);
      if (p.sizes && p.sizes.length > 1) return openProduct(p.id);
      addToCart(p.id, p.sizes?.[0] || "", 1);
    } else if (view) openProduct(+view.dataset.view);
  });

  /* ---------- Modales ---------- */
  function openModal(m) { m.classList.add("open"); m.setAttribute("aria-hidden", "false"); document.body.classList.add("locked"); }
  function closeModal(m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); if (!$(".modal.open") && !$("#cartDrawer.open")) document.body.classList.remove("locked"); }
  $$(".modal").forEach(m => m.addEventListener("click", e => { if (e.target === m || e.target.closest("[data-close]")) closeModal(m); }));
  document.addEventListener("keydown", e => { if (e.key === "Escape") { $$(".modal.open").forEach(closeModal); closeCart(); } });

  function openProduct(id) {
    const p = PRODUCTS.find(x => x.id === id);
    const c = catOf(p.cat);
    $("#productContent").innerHTML = `
      <div class="pm">
        <img src="${imgOf(p)}" alt="${esc(p.name)}">
        <div>
          <small class="product-cat">${c ? c.emoji + " " + esc(c.name) : ""}</small>
          <h3>${esc(p.name)}</h3>
          <div class="price big">${fmt(p.price)} ${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : ""}</div>
          <p>${esc(p.desc)}</p>
          ${p.sizes && p.sizes.length ? `<div class="opt-label">Taille</div><div class="sizes">${p.sizes.map((s, i) => `<label><input type="radio" name="size" value="${esc(s)}" ${i === 0 ? "checked" : ""}><span>${esc(s)}</span></label>`).join("")}</div>` : ""}
          <div class="opt-label">Quantité</div>
          <div class="qty"><button type="button" data-q="-1">−</button><input id="pmQty" type="number" value="1" min="1"><button type="button" data-q="1">+</button></div>
          <button class="btn btn-primary btn-block" id="pmAdd">Ajouter au panier</button>
          <a class="btn btn-ghost btn-block" target="_blank" rel="noopener" href="${waURL(`Bonjour Byamashop, je suis intéressé(e) par : ${p.name} (${fmt(p.price)})`)}">Poser une question sur WhatsApp</a>
        </div>
      </div>`;
    const qty = $("#pmQty");
    $$("[data-q]", $("#productContent")).forEach(b => b.onclick = () => qty.value = Math.max(1, (+qty.value || 1) + +b.dataset.q));
    $("#pmAdd").onclick = () => {
      const size = $("input[name=size]:checked", $("#productContent"))?.value || "";
      addToCart(p.id, size, Math.max(1, +qty.value || 1));
      closeModal($("#productModal"));
    };
    openModal($("#productModal"));
  }

  /* ---------- Panier ---------- */
  const KEY = "byamashop_cart";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch { cart = []; }
  cart = cart.filter(i => PRODUCTS.some(p => p.id === i.id));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {} };
  const subtotal = () => cart.reduce((s, i) => s + PRODUCTS.find(p => p.id === i.id).price * i.qty, 0);

  function addToCart(id, size, qty) {
    const ex = cart.find(i => i.id === id && i.size === size);
    ex ? ex.qty += qty : cart.push({ id, size, qty });
    save(); renderCart(); toast("Ajouté au panier ✓");
    const b = $("#cartBtn"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  }

  function renderCart() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    $("#cartCount").textContent = count;
    $("#cartCount").hidden = count === 0;
    $("#cartFoot").hidden = cart.length === 0;
    $("#cartSubtotal").textContent = fmt(subtotal());
    $("#cartItems").innerHTML = cart.length ? cart.map((i, idx) => {
      const p = PRODUCTS.find(x => x.id === i.id);
      return `<div class="cart-item">
        <img src="${imgOf(p)}" alt="">
        <div class="ci-info"><strong>${esc(p.name)}</strong>${i.size ? `<small>Taille : ${esc(i.size)}</small>` : ""}<span>${fmt(p.price)}</span>
          <div class="qty sm"><button data-ci="${idx}" data-d="-1">−</button><span>${i.qty}</span><button data-ci="${idx}" data-d="1">+</button></div></div>
        <button class="icon-btn rm" data-rm="${idx}" aria-label="Retirer">🗑</button></div>`;
    }).join("") : `<div class="cart-empty"><span>🛍️</span><p>Votre panier est vide</p><a href="#boutique" class="btn btn-primary btn-sm" id="shopNow">Voir la boutique</a></div>`;
  }

  $("#cartItems").addEventListener("click", e => {
    const d = e.target.closest("[data-d]"), rm = e.target.closest("[data-rm]");
    if (d) { const it = cart[+d.dataset.ci]; it.qty += +d.dataset.d; if (it.qty < 1) cart.splice(+d.dataset.ci, 1); }
    else if (rm) cart.splice(+rm.dataset.rm, 1);
    else if (e.target.id === "shopNow") closeCart();
    else return;
    save(); renderCart();
  });

  const openCart = () => { $("#cartDrawer").classList.add("open"); $("#overlay").classList.add("show"); document.body.classList.add("locked"); };
  function closeCart() { $("#cartDrawer").classList.remove("open"); $("#overlay").classList.remove("show"); if (!$(".modal.open")) document.body.classList.remove("locked"); }
  $("#cartBtn").onclick = openCart;
  $("#closeCart").onclick = closeCart;
  $("#overlay").onclick = closeCart;
  $("#clearCart").onclick = () => { if (confirm("Vider le panier ?")) { cart = []; save(); renderCart(); } };

  /* ---------- Commande ---------- */
  const zoneSel = $("#zoneSelect");
  zoneSel.innerHTML = SHOP.zones.map((z, i) => `<option value="${i}">${esc(z.name)} — ${z.fee ? fmt(z.fee) : "gratuit"}</option>`).join("");
  function renderSummary() {
    const fee = SHOP.zones[+zoneSel.value].fee;
    $("#checkoutSummary").innerHTML = `
      <div class="row"><span>Sous-total</span><span>${fmt(subtotal())}</span></div>
      <div class="row"><span>Livraison</span><span>${fee ? fmt(fee) : "Gratuit"}</span></div>
      <div class="row total"><span>Total</span><strong>${fmt(subtotal() + fee)}</strong></div>`;
  }
  zoneSel.onchange = renderSummary;
  $("#checkoutBtn").onclick = () => { closeCart(); renderSummary(); openModal($("#checkoutModal")); };

  $("#checkoutForm").addEventListener("submit", e => {
    e.preventDefault();
    if (!cart.length) return toast("Votre panier est vide");
    const f = Object.fromEntries(new FormData(e.target));
    const zone = SHOP.zones[+f.zone];
    const total = subtotal() + zone.fee;
    const lines = cart.map(i => {
      const p = PRODUCTS.find(x => x.id === i.id);
      return `• ${i.qty} × ${p.name}${i.size ? ` (${i.size})` : ""} — ${fmt(p.price * i.qty)}`;
    });
    const msg = [
      `🛍️ *Nouvelle commande Byamashop*`, ``,
      ...lines, ``,
      `Sous-total : ${fmt(subtotal())}`,
      `Livraison (${zone.name}) : ${zone.fee ? fmt(zone.fee) : "Gratuit"}`,
      `*Total : ${fmt(total)}*`, ``,
      `👤 ${f.nom}`, `📞 ${f.telephone}`, `📍 ${f.adresse}`, `💳 ${f.paiement}`,
      f.note ? `📝 ${f.note}` : ""
    ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");

    // Enregistre aussi la commande dans Netlify Forms (si déployé sur Netlify)
    try {
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ "form-name": "commande", nom: f.nom, telephone: f.telephone, zone: zone.name, adresse: f.adresse, paiement: f.paiement, note: f.note || "", details: lines.join("\n"), total: fmt(total) }).toString() }).catch(() => {});
    } catch {}

    window.open(waURL(msg), "_blank");
    cart = []; save(); renderCart();
    closeModal($("#checkoutModal"));
    e.target.reset();
    toast("Commande envoyée sur WhatsApp 🎉");
  });

  /* ---------- Divers ---------- */
  let tt;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2200); }

  $("#menuBtn").onclick = () => $("#nav").classList.toggle("open");
  $$("#nav a").forEach(a => a.onclick = () => $("#nav").classList.remove("open"));
  window.addEventListener("scroll", () => $(".header").classList.toggle("scrolled", scrollY > 10), { passive: true });

  render(); renderCart();
})();
