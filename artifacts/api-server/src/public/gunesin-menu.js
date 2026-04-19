/* Güneşin Sofrası — client menu script
   Served from /assets/gunesin-menu.js
   window.GS_INIT_ID is injected inline by the server before this script loads. */

document.addEventListener('DOMContentLoaded', function () {

  /* ── LOGO ── */
  const logoImg = document.getElementById('gsLogoImg');
  const brand   = document.getElementById('gsBrand');
  if (logoImg) {
    logoImg.onload  = () => { brand.style.display = 'none'; };
    logoImg.onerror = () => { logoImg.style.display = 'none'; brand.style.display = 'flex'; };
    if (logoImg.complete && logoImg.naturalWidth > 0) { brand.style.display = 'none'; }
    else if (logoImg.complete) { logoImg.style.display = 'none'; brand.style.display = 'flex'; }
  }

  /* ── MASA ── */
  const SESSION_KEY = 'gunesin_masa';
  const INIT_ID = window.GS_INIT_ID || '1';
  let _masaId = sessionStorage.getItem(SESSION_KEY) || INIT_ID;
  document.getElementById('gsMasaNum').textContent = _masaId;

  const masaBg    = document.getElementById('gsMasaBg');
  const masaSheet = document.getElementById('gsMasaSheet');
  function openMasa()  { masaBg.classList.add('open');    masaSheet.classList.add('open'); }
  function closeMasa() { masaBg.classList.remove('open'); masaSheet.classList.remove('open'); }
  document.getElementById('gsMasaBadge').addEventListener('click', openMasa);
  masaBg.addEventListener('click', closeMasa);
  document.getElementById('gsMasaCloseBtn').addEventListener('click', closeMasa);
  document.querySelectorAll('.gs-masa-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.num === String(_masaId));
    btn.addEventListener('click', () => {
      _masaId = btn.dataset.num;
      sessionStorage.setItem(SESSION_KEY, _masaId);
      document.getElementById('gsMasaNum').textContent = _masaId;
      document.querySelectorAll('.gs-masa-btn').forEach(b =>
        b.classList.toggle('selected', b.dataset.num === String(_masaId)));
      closeMasa();
      showToast('Masa ' + _masaId + ' seçildi ✓');
    });
  });

  /* ── TOAST ── */
  const toastEl = document.getElementById('gsToast');
  let _toastTmr = null;
  function showToast(msg) {
    clearTimeout(_toastTmr);
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    _toastTmr = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  /* ── CART ── */
  const cart = new Map();
  function updateCartUI() {
    const items = Array.from(cart.values());
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);
    const icon  = document.getElementById('gsCartIcon');
    icon.textContent  = count > 0 ? String(count) : '🍽️';
    icon.style.fontSize   = count > 0 ? '17px' : '20px';
    icon.style.fontWeight = count > 0 ? '800'  : 'normal';
    document.getElementById('gcTotal').textContent      = total.toLocaleString('tr-TR') + ' ₺';
    document.getElementById('gcOrderBtn').disabled      = count === 0;
    const listEl = document.getElementById('gcItemsList');
    if (!items.length) { listEl.innerHTML = '<p class="gc-empty">Henüz ürün eklenmedi.</p>'; return; }
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
    listEl.querySelectorAll('.gc-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (btn.dataset.action === 'inc') { cart.get(id).qty++; }
        else { const it = cart.get(id); if (--it.qty <= 0) cart.delete(id); }
        updateCartUI();
      });
    });
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.gs-add-btn');
    if (!btn) return;
    const { id, name, price } = btn.dataset;
    const p = parseInt(price, 10);
    if (!p) return;
    if (cart.has(id)) cart.get(id).qty++;
    else cart.set(id, { id, name, price: p, qty: 1 });
    updateCartUI();
    showToast(name + ' masaya eklendi ✓');
  });

  const cartBg     = document.getElementById('gsCartBg');
  const cartDrawer = document.getElementById('gsCartDrawer');
  function openCart()  { cartBg.classList.add('open');    cartDrawer.classList.add('open'); }
  function closeCart() { cartBg.classList.remove('open'); cartDrawer.classList.remove('open'); }
  document.getElementById('gsCartFab').addEventListener('click', openCart);
  document.getElementById('gcCloseBtn').addEventListener('click', closeCart);
  cartBg.addEventListener('click', closeCart);

  document.getElementById('gcOrderBtn').addEventListener('click', () => {
    const items = Array.from(cart.values());
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    console.log('[Güneşin Sofrası] 🍽 YENİ SİPARİŞ', {
      masa: _masaId,
      items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total: total + ' ₺',
      zaman: new Date().toLocaleTimeString('tr-TR'),
    });
    cart.clear(); updateCartUI(); closeCart();
    showToast('Siparişiniz iletildi ✓');
  });

  /* ── GARSON / HESAP ── */
  document.getElementById('gsGarsonBtn').addEventListener('click', () => {
    console.log('[Güneşin Sofrası] 🖐 GARSON ÇAĞRISI — Masa:', _masaId, new Date().toLocaleTimeString('tr-TR'));
    showToast('Garson çağrıldı ✓');
  });
  document.getElementById('gsHesapBtn').addEventListener('click', () => {
    console.log('[Güneşin Sofrası] 🧾 HESAP TALEBİ — Masa:', _masaId, new Date().toLocaleTimeString('tr-TR'));
    showToast('Hesap talebi iletildi ✓');
  });

  /* ── GURMEAI CHAT ── */
  const aiBg     = document.getElementById('gsAiBg');
  const aiDrawer = document.getElementById('gsAiDrawer');
  const aiMsgs   = document.getElementById('aiMsgs');
  const aiInput  = document.getElementById('aiInput');
  let _aiOpened      = false;
  let _aiLoading     = false;
  let _firstReply    = false;

  function openAi() {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    aiBg.classList.add('open'); aiDrawer.classList.add('open');
    if (!_aiOpened) {
      _aiOpened = true;
      appendAiMsg('assistant', "Hoş geldiniz. Güneşin Sofrası'na beklenirsiniz. İçecek olarak ne tercih edersiniz, rakı mı şarap mı?");
    }
    setTimeout(() => aiInput.focus(), 350);
  }
  function closeAi() {
    document.body.style.overflow = '';
    document.documentElement.style.overflowX = '';
    aiDrawer.style.height = '';
    aiDrawer.style.bottom = '0';
    aiBg.classList.remove('open'); aiDrawer.classList.remove('open');
  }

  function appendAiMsg(role, text) {
    const wrap = document.createElement('div');
    wrap.className = `ai-bubble-wrap ${role}`;
    if (role === 'assistant') {
      wrap.innerHTML = `<div class="ai-avatar">👨‍🍳</div><div class="ai-bubble assistant"></div>`;
      wrap.querySelector('.ai-bubble').textContent = text;
    } else {
      wrap.innerHTML = `<div class="ai-bubble user"></div>`;
      wrap.querySelector('.ai-bubble').textContent = text;
    }
    aiMsgs.appendChild(wrap);
    aiMsgs.scrollTop = aiMsgs.scrollHeight;
    return wrap;
  }

  function appendAiLoading() {
    const wrap = document.createElement('div');
    wrap.className = 'ai-bubble-wrap assistant';
    wrap.id = 'aiLoadingBubble';
    wrap.innerHTML = '<div class="ai-avatar">👨‍🍳</div><div class="ai-bubble loading">Yanıt yazılıyor</div>';
    aiMsgs.appendChild(wrap);
    aiMsgs.scrollTop = aiMsgs.scrollHeight;
    return wrap;
  }

  async function sendAiMsg() {
    const msg = aiInput.value.trim();
    if (!msg || _aiLoading) return;
    aiInput.value = '';
    aiInput.style.height = 'auto';
    appendAiMsg('user', msg);
    _aiLoading = true;
    const loadingEl = appendAiLoading();
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: 'gunesin-sofrasi', message: msg, tableNumber: _masaId }),
      });
      const json = await res.json();
      loadingEl.remove();
      if (!res.ok) {
        console.error('[GurmeAI] API error:', res.status, json);
        appendAiMsg('assistant', 'Üzgünüm, şu an yanıt veremiyorum. Lütfen birazdan tekrar deneyin.');
      } else {
        let reply = json?.data?.reply || json?.reply || json?.message || 'Yanıt alınamadı';
        if (!_firstReply) {
          _firstReply = true;
          reply = reply + '\n\nKaç kişilik sofra kuracağınızı söylerseniz size daha iyi öneri yapabilirim.';
        }
        appendAiMsg('assistant', reply);
      }
    } catch (err) {
      console.error('[GurmeAI] fetch error:', err);
      loadingEl.remove();
      appendAiMsg('assistant', 'Bağlantı hatası. Lütfen tekrar deneyin.');
    }
    _aiLoading = false;
  }

  document.getElementById('gsAiFab').addEventListener('click', openAi);
  document.getElementById('aiCloseBtn').addEventListener('click', closeAi);
  aiBg.addEventListener('click', closeAi);
  document.getElementById('aiSendBtn').addEventListener('click', sendAiMsg);
  aiInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMsg(); }
  });
  aiInput.addEventListener('input', () => {
    aiInput.style.height = 'auto';
    aiInput.style.height = Math.min(aiInput.scrollHeight, 80) + 'px';
  });

  /* ── CATEGORY NAV ── */
  const navEl   = document.getElementById('gsCatNav');
  const content = document.getElementById('gsContent');
  const pills   = Array.from(navEl.querySelectorAll('.gs-pill'));
  const sects   = Array.from(document.querySelectorAll('.gs-section[id]'));

  navEl.addEventListener('click', e => {
    const pill = e.target.closest('.gs-pill');
    if (!pill) return;
    const sec = document.getElementById(pill.dataset.cat);
    if (sec) content.scrollTo({ top: sec.offsetTop - 12, behavior: 'smooth' });
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
      es => { const v = es.filter(e => e.isIntersecting); if (v.length) setActivePill(v[0].target.id); },
      { root: content, rootMargin: '-10% 0px -60% 0px', threshold: 0 }
    );
    sects.forEach(s => io.observe(s));
  }

  /* ── FEEDBACK ── */
  let _fbRating = 0;
  const fbStarEls = document.querySelectorAll('.fb-star');
  const fbHigh    = document.getElementById('fbHigh');
  const fbLow     = document.getElementById('fbLow');

  function renderStars(val) {
    fbStarEls.forEach(s => s.classList.toggle('lit', Number(s.dataset.v) <= val));
  }

  fbStarEls.forEach(star => {
    star.addEventListener('mouseenter', () => renderStars(Number(star.dataset.v)));
    star.addEventListener('mouseleave', () => renderStars(_fbRating));
    star.addEventListener('click', () => {
      _fbRating = Number(star.dataset.v);
      renderStars(_fbRating);
      if (_fbRating >= 4) {
        fbHigh.classList.add('show'); fbLow.classList.remove('show');
      } else {
        fbLow.classList.add('show'); fbHigh.classList.remove('show');
        document.getElementById('fbSuccess').classList.remove('show');
        document.getElementById('fbSubmitBtn').disabled = false;
      }
    });
  });

  document.getElementById('fbSubmitBtn').addEventListener('click', async () => {
    const name = document.getElementById('fbName').value.trim();
    if (!name) { showToast('Ad Soyad zorunludur'); return; }
    const btn = document.getElementById('fbSubmitBtn');
    btn.disabled = true;
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: 'gunesin-sofrasi',
          tableNumber: _masaId,
          rating: _fbRating,
          guestName: name,
          phone: document.getElementById('fbPhone').value.trim() || undefined,
          comment: document.getElementById('fbMessage').value.trim() || undefined,
        }),
      });
      document.getElementById('fbSuccess').classList.add('show');
      document.getElementById('fbName').value = '';
      document.getElementById('fbPhone').value = '';
      document.getElementById('fbMessage').value = '';
    } catch {
      btn.disabled = false;
      showToast('Gönderim hatası, tekrar deneyin');
    }
  });

  /* ── RAKI SIZE TILES: click to add to cart ── */
  document.getElementById('gsContent').addEventListener('click', e => {
    const btn = e.target.closest('.rp-btn');
    if (!btn) return;
    const card = btn.closest('.gs-raki-card');
    if (!card) return;
    const id    = card.dataset.rakiId;
    const base  = card.dataset.rakiName || 'Rakı';
    const size  = btn.dataset.size || '';
    const price = parseInt(btn.dataset.price, 10) || 0;
    const name  = size ? `${base} (${size})` : base;
    const cartKey = `${id}-${size}`;
    if (cart.has(cartKey)) cart.get(cartKey).qty++;
    else cart.set(cartKey, { id: cartKey, name, price, qty: 1 });
    updateCartUI();
    showToast(name + ' masaya eklendi ✓');
    btn.classList.add('rp-added');
    setTimeout(() => btn.classList.remove('rp-added'), 700);
  });

  /* ── AI DRAWER: keep drawer above keyboard on mobile ── */
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (!aiDrawer || !aiDrawer.classList.contains('open')) return;
      const vvHeight    = window.visualViewport.height;
      const vvOffsetTop = window.visualViewport.offsetTop;
      const newBottom   = window.innerHeight - vvHeight - vvOffsetTop;
      const newHeight   = Math.round(vvHeight * 0.75);
      aiDrawer.style.bottom = newBottom > 0 ? `${newBottom}px` : '0';
      aiDrawer.style.height  = `${newHeight}px`;
    });
  }

});
