/* Güneşin Sofrası — client menu script
   window.GS_INIT_ID injected by server before this script loads. */

document.addEventListener('DOMContentLoaded', function () {

  /* ─── CONFIG ─── */
  const RESTAURANT_ID = 'gunesin-sofrasi';
  const SESSION_KEY   = 'gunesin_masa';
  const INIT_ID       = String(window.GS_INIT_ID || '1');

  /* ─── STATE ─── */
  let masaId   = sessionStorage.getItem(SESSION_KEY) || INIT_ID;
  const cart   = new Map();
  let aiOpened  = false;
  let aiLoading = false;
  const aiHistory = [];

  /* ─── HELPERS ─── */
  const $       = id => document.getElementById(id);
  const toastEl = $('gsToast');
  let _toastTimer;

  function showToast(msg) {
    clearTimeout(_toastTimer);
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    _toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  function postJSON(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  /* ─── 1. LOGO FALLBACK ─── */
  const logoImg = $('gsLogoImg');
  const brand   = $('gsBrand');
  if (logoImg) {
    const showBrand = () => { logoImg.style.display = 'none'; brand.style.display = 'flex'; };
    const hideBrand = () => { brand.style.display  = 'none'; };
    if (logoImg.complete) logoImg.naturalWidth > 0 ? hideBrand() : showBrand();
    else { logoImg.onload = hideBrand; logoImg.onerror = showBrand; }
  }

  /* ─── 2. MASA SELECTOR ─── */
  const masaBg    = $('gsMasaBg');
  const masaSheet = $('gsMasaSheet');
  const openMasa  = () => { masaBg.classList.add('open');    masaSheet.classList.add('open'); };
  const closeMasa = () => { masaBg.classList.remove('open'); masaSheet.classList.remove('open'); };

  masaBg.addEventListener('click', closeMasa);
  $('gsMasaCloseBtn').addEventListener('click', closeMasa);

  document.querySelectorAll('.gs-masa-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.num === masaId);
    btn.addEventListener('click', () => {
      masaId = btn.dataset.num;
      sessionStorage.setItem(SESSION_KEY, masaId);
      document.querySelectorAll('.gs-masa-btn').forEach(b =>
        b.classList.toggle('selected', b.dataset.num === masaId));
      closeMasa();
      showToast('Masa ' + masaId + ' seçildi ✓');
    });
  });

  /* ─── 3. CART ─── */
  function updateCartBadge() {
    const count = [...cart.values()].reduce((s, i) => s + i.qty, 0);
    const icon  = $('gsCartIcon');
    icon.textContent      = count > 0 ? String(count) : '🍽️';
    icon.style.fontSize   = count > 0 ? '17px' : '20px';
    icon.style.fontWeight = count > 0 ? '800'  : 'normal';
  }

  function renderCartItems() {
    const items = [...cart.values()];
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    $('gcTotal').textContent = total.toLocaleString('tr-TR') + ' ₺';
    $('gcOrderBtn').disabled = items.length === 0;
    const listEl = $('gcItemsList');
    if (!items.length) {
      listEl.innerHTML = '<p class="gc-empty">Henüz ürün eklenmedi.</p>';
      return;
    }
    listEl.innerHTML = items.map(item => `
      <div class="gc-item">
        <span class="gc-item-name">${item.name}</span>
        <span class="gc-item-price">${(item.price * item.qty).toLocaleString('tr-TR')} ₺</span>
        <div class="gc-item-qty">
          <button class="gc-qty-btn" data-action="dec" data-id="${item.id}">−</button>
          <span class="gc-qty-num">${item.qty}</span>
          <button class="gc-qty-btn" data-action="inc" data-id="${item.id}">+</button>
        </div>
      </div>`).join('');
    listEl.querySelectorAll('.gc-qty-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        const it = cart.get(btn.dataset.id);
        if (btn.dataset.action === 'inc') it.qty++;
        else if (--it.qty <= 0) cart.delete(btn.dataset.id);
        renderCartItems();
        updateCartBadge();
      }));
  }

  function addToCart(id, name, price) {
    if (cart.has(id)) cart.get(id).qty++;
    else cart.set(id, { id, name, price, qty: 1 });
    updateCartBadge();
    showToast(name + ' masaya eklendi ✓');
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.gs-add-btn');
    if (!btn) return;
    const p = parseInt(btn.dataset.price, 10);
    if (!p) return;
    addToCart(btn.dataset.id, btn.dataset.name, p);
  });

  /* ─── 4. CART FAB + DRAWER ─── */
  const cartBg     = $('gsCartBg');
  const cartDrawer = $('gsCartDrawer');
  const openCart   = () => { renderCartItems(); cartBg.classList.add('open');    cartDrawer.classList.add('open'); };
  const closeCart  = () => { cartBg.classList.remove('open'); cartDrawer.classList.remove('open'); };

  $('gsCartFab').addEventListener('click', openCart);
  $('gcCloseBtn').addEventListener('click', closeCart);
  cartBg.addEventListener('click', closeCart);

  /* ─── 5. ORDER SUBMIT → POST /api/order/notify ─── */
  $('gcOrderBtn').addEventListener('click', async () => {
    const items = [...cart.values()];
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    try {
      await postJSON('/api/order/notify', {
        masaId,
        restaurantId: RESTAURANT_ID,
        type: 'siparis',
        items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        total: total + ' ₺',
      });
    } catch (e) { console.error('[GS] order error', e); }
    cart.clear();
    updateCartBadge();
    renderCartItems();
    closeCart();
    showToast('Siparişiniz iletildi ✓');
  });

  /* ─── 6. GARSON / HESAP → POST /api/order/notify ─── */
  async function sendNotify(type) {
    showToast(type === 'garson' ? 'Garson çağrıldı ✓' : 'Hesap talebi iletildi ✓');
    try {
      await postJSON('/api/order/notify', { masaId, restaurantId: RESTAURANT_ID, type });
    } catch (e) { console.error('[GS] notify error', e); }
  }

  $('gsGarsonBtn').addEventListener('click', () => sendNotify('garson'));
  $('gsHesapBtn').addEventListener('click',  () => sendNotify('hesap'));

  /* ─── 7. AI GURME CHAT ─── */
  const aiBg     = $('ai-overlay');
  const aiDrawer = $('ai-drawer');
  const aiMsgs   = $('ai-messages');
  const aiInput  = $('ai-input');

  function aiAppend(role, text) {
    const wrap = document.createElement('div');
    wrap.className = 'ai-bubble-wrap ' + role;
    if (role === 'assistant') {
      wrap.innerHTML = '<div class="ai-avatar">👨‍🍳</div><div class="ai-bubble assistant"></div>';
    } else {
      wrap.innerHTML = '<div class="ai-bubble user"></div>';
    }
    wrap.querySelector('.ai-bubble').textContent = text;
    aiMsgs.appendChild(wrap);
    aiMsgs.scrollTop = aiMsgs.scrollHeight;
    return wrap;
  }

  function aiLoaderEl() {
    const wrap = document.createElement('div');
    wrap.className = 'ai-bubble-wrap assistant';
    wrap.id = 'aiLoader';
    wrap.innerHTML = '<div class="ai-avatar">👨‍🍳</div><div class="ai-bubble loading">Yanıt yazılıyor</div>';
    aiMsgs.appendChild(wrap);
    aiMsgs.scrollTop = aiMsgs.scrollHeight;
    return wrap;
  }

  function openAi() {
    document.body.style.position = 'fixed';
    document.body.style.width    = '100%';
    aiBg.classList.add('open');
    aiDrawer.classList.add('open');
    if (!aiOpened) {
      aiOpened = true;
      aiAppend('assistant', 'Hoş geldiniz efendim. İçecek tercihiniz ne olur?');
    }
    setTimeout(() => aiInput.focus(), 350);
  }

  function closeAi() {
    document.body.style.position = '';
    document.body.style.width    = '';
    aiBg.classList.remove('open');
    aiDrawer.classList.remove('open');
  }

  async function sendAiMsg() {
    const msg = aiInput.value.trim();
    if (!msg || aiLoading) return;
    aiInput.value = '';
    aiInput.style.height = 'auto';
    aiHistory.push({ role: 'user', content: msg });
    aiAppend('user', msg);
    aiLoading = true;
    const loader = aiLoaderEl();
    try {
      const res  = await postJSON('/api/chat', {
        restaurantId: RESTAURANT_ID,
        tableNumber: masaId,
        messages: aiHistory,
      });
      loader.remove();
      if (res.ok) {
        const json  = await res.json();
        const reply = json?.data?.reply || json?.reply || json?.message || 'Yanıt alınamadı';
        aiHistory.push({ role: 'assistant', content: reply });
        aiAppend('assistant', reply);
      } else {
        aiAppend('assistant', 'Üzgünüm, şu an yanıt veremiyorum. Lütfen birazdan tekrar deneyin.');
      }
    } catch {
      loader.remove();
      aiAppend('assistant', 'Bağlantı hatası. Lütfen tekrar deneyin.');
    }
    aiLoading = false;
  }

  $('gsAiFab').addEventListener('click', openAi);
  $('aiCloseBtn').addEventListener('click', closeAi);
  aiBg.addEventListener('click', closeAi);
  $('ai-send').addEventListener('click', sendAiMsg);
  aiInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMsg(); }
  });
  aiInput.addEventListener('input', () => {
    aiInput.style.height = 'auto';
    aiInput.style.height = Math.min(aiInput.scrollHeight, 80) + 'px';
  });

  /* ─── 8. CATEGORY NAV (click + IntersectionObserver) ─── */
  const navEl  = $('gsCatNav');
  const mainEl = $('gsContent');
  const pills  = [...navEl.querySelectorAll('.gs-pill')];
  const sects  = [...document.querySelectorAll('.gs-section[id]')];

  navEl.addEventListener('click', e => {
    const pill = e.target.closest('.gs-pill');
    if (!pill) return;
    const sec = document.getElementById(pill.dataset.cat);
    if (sec) mainEl.scrollTo({ top: sec.offsetTop - 12, behavior: 'smooth' });
    pills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    pill.scrollIntoView({ inline: 'center', behavior: 'smooth' });
  });

  function setActivePill(id) {
    pills.forEach(p => p.classList.toggle('active', p.dataset.cat === id));
    const ap = pills.find(p => p.dataset.cat === id);
    if (ap) ap.scrollIntoView({ inline: 'nearest', behavior: 'smooth' });
  }

  if (sects.length && window.IntersectionObserver) {
    const io = new IntersectionObserver(
      entries => {
        const vis = entries.filter(e => e.isIntersecting);
        if (vis.length) setActivePill(vis[0].target.id);
      },
      { root: mainEl, rootMargin: '-10% 0px -60% 0px', threshold: 0 }
    );
    sects.forEach(s => io.observe(s));
  }

  /* ─── 9. DÜŞÜNCELERİNİZ MODAL ─── */
  const dushBg    = $('gsDushBg');
  const dushSheet = $('gsDushSheet');
  const openDush  = () => { dushBg.classList.add('open');    dushSheet.classList.add('open'); };
  const closeDush = () => { dushBg.classList.remove('open'); dushSheet.classList.remove('open'); };

  $('gsDushuncelerFab').addEventListener('click', openDush);
  $('gsDushClose').addEventListener('click', closeDush);
  dushBg.addEventListener('click', closeDush);

  $('dushSubmit').addEventListener('click', async () => {
    const name = $('dushName').value.trim();
    if (!name) { showToast('Ad Soyad zorunludur'); return; }
    const submitBtn = $('dushSubmit');
    submitBtn.disabled = true;
    try {
      await postJSON('/api/feedback/form', {
        masaId,
        name,
        phone:   $('dushPhone').value.trim() || undefined,
        message: $('dushMsg').value.trim()   || undefined,
      });
      showToast('Mesajınız iletildi, teşekkürler 🙏');
      $('dushName').value = $('dushPhone').value = $('dushMsg').value = '';
      closeDush();
    } catch {
      showToast('Gönderim hatası, tekrar deneyin');
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ─── 10. PUANLAMA MODAL: 4-5 → Google, 1-3 → form ─── */
  const ratingBg      = $('gsRatingBg');
  const ratingSheet   = $('gsRatingSheet');
  const starBtns      = [...document.querySelectorAll('.gs-star-btn')];
  const ratingHint    = $('gsRatingHint');
  const gmapsMsg      = $('gsGmapsMsg');
  const ratingActions = $('gsRatingActions');
  const HINTS = ['', 'Çok kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];
  let rating = 0;

  function openRating() {
    rating = 0;
    starBtns.forEach(s => s.classList.remove('lit'));
    ratingHint.textContent = 'Deneyiminizi değerlendirin';
    gmapsMsg.classList.remove('show');
    ratingActions.classList.remove('show');
    ratingBg.classList.add('open');
    ratingSheet.classList.add('open');
  }
  const closeRating = () => { ratingBg.classList.remove('open'); ratingSheet.classList.remove('open'); };

  $('gsBiziBtn').addEventListener('click', openRating);
  $('gsRatingClose').addEventListener('click', closeRating);
  ratingBg.addEventListener('click', closeRating);

  starBtns.forEach(star => star.addEventListener('click', () => {
    rating = Number(star.dataset.v);
    starBtns.forEach(s => s.classList.toggle('lit', Number(s.dataset.v) <= rating));
    ratingHint.textContent = HINTS[rating] || '';
    if (rating >= 4) {
      gmapsMsg.classList.add('show');
      ratingActions.classList.add('show');
    } else {
      gmapsMsg.classList.remove('show');
      ratingActions.classList.remove('show');
      setTimeout(() => { closeRating(); openDush(); }, 420);
    }
  }));

  $('gsRatingNo').addEventListener('click', closeRating);
  $('gsRatingYes').addEventListener('click', () => setTimeout(closeRating, 300));

  /* ─── 11. RAKI SIZE TILES ─── */
  mainEl.addEventListener('click', e => {
    const btn = e.target.closest('.rp-btn');
    if (!btn) return;
    const card  = btn.closest('.gs-raki-card');
    if (!card) return;
    const id    = card.dataset.rakiId;
    const base  = card.dataset.rakiName || 'Rakı';
    const size  = btn.dataset.size  || '';
    const price = parseInt(btn.dataset.price, 10) || 0;
    const name  = size ? `${base} (${size})` : base;
    const key   = `${id}-${size}`;
    if (cart.has(key)) cart.get(key).qty++;
    else cart.set(key, { id: key, name, price, qty: 1 });
    updateCartBadge();
    showToast(name + ' masaya eklendi ✓');
    btn.classList.add('rp-added');
    setTimeout(() => btn.classList.remove('rp-added'), 700);
  });

});
