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

  const masaBg    = document.getElementById('gsMasaBg');
  const masaSheet = document.getElementById('gsMasaSheet');
  function openMasa()  { masaBg.classList.add('open');    masaSheet.classList.add('open'); }
  function closeMasa() { masaBg.classList.remove('open'); masaSheet.classList.remove('open'); }
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

  /* ── GARSON / HESAP (shared send function) ── */
  async function sendNotify(type) {
    showToast(type === 'garson' ? 'Garson çağrıldı ✓' : 'Hesap talebi iletildi ✓');
    try {
      await fetch('/api/order/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masaId: _masaId, restaurantId: 'gunesin-sofrasi', type }),
      });
    } catch (e) { console.error('[GS] notify error', e); }
  }
  document.getElementById('gsGarsonBtn').addEventListener('click',  () => sendNotify('garson'));
  document.getElementById('gsHesapBtn').addEventListener('click',   () => sendNotify('hesap'));
  document.getElementById('gsGarsonFab').addEventListener('click',  () => sendNotify('garson'));
  document.getElementById('gsHesapFab').addEventListener('click',   () => sendNotify('hesap'));

  /* ── GURMEAI CHAT ── */
  const aiBg     = document.getElementById('ai-overlay');
  const aiDrawer = document.getElementById('ai-drawer');
  const aiMsgs   = document.getElementById('ai-messages');
  const aiInput  = document.getElementById('ai-input');
  if (!aiBg || !aiDrawer || !aiMsgs || !aiInput) {
    console.error('[GurmeAI] Drawer elements not found:', { aiBg, aiDrawer, aiMsgs, aiInput });
  }
  let _aiOpened   = false;
  let _aiLoading  = false;
  const conversationHistory = [];

  function openAi() {
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    aiBg.classList.add('open'); aiDrawer.classList.add('open');
    if (!_aiOpened) {
      _aiOpened = true;
      appendAiMsg('assistant', 'Hoş geldiniz efendim. İçecek tercihiniz ne olur?');
    }
    setTimeout(() => aiInput.focus(), 350);
  }
  function closeAi() {
    document.body.style.position = '';
    document.body.style.width = '';
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
    conversationHistory.push({ role: 'user', content: msg });
    appendAiMsg('user', msg);
    _aiLoading = true;
    const loadingEl = appendAiLoading();
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: 'gunesin-sofrasi',
          tableNumber: _masaId,
          messages: conversationHistory,
        }),
      });
      const json = await res.json();
      loadingEl.remove();
      if (!res.ok) {
        console.error('[GurmeAI] API error:', res.status, json);
        appendAiMsg('assistant', 'Üzgünüm, şu an yanıt veremiyorum. Lütfen birazdan tekrar deneyin.');
      } else {
        const reply = json?.data?.reply || json?.reply || json?.message || 'Yanıt alınamadı';
        conversationHistory.push({ role: 'assistant', content: reply });
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
  document.getElementById('ai-send').addEventListener('click', sendAiMsg);
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

  /* ── DÜŞÜNCELERİNİZ MODAL ── */
  const dushBg    = document.getElementById('gsDushBg');
  const dushSheet = document.getElementById('gsDushSheet');
  function openDush()  { dushBg.classList.add('open');    dushSheet.classList.add('open'); }
  function closeDush() { dushBg.classList.remove('open'); dushSheet.classList.remove('open'); }

  document.getElementById('gsDushuncelerFab').addEventListener('click', openDush);
  document.getElementById('gsDushClose').addEventListener('click', closeDush);
  dushBg.addEventListener('click', closeDush);

  document.getElementById('dushSubmit').addEventListener('click', async () => {
    const name = document.getElementById('dushName').value.trim();
    if (!name) { showToast('Ad Soyad zorunludur'); return; }
    const btn = document.getElementById('dushSubmit');
    btn.disabled = true;
    try {
      await fetch('/api/feedback/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masaId: _masaId,
          name,
          phone: document.getElementById('dushPhone').value.trim() || undefined,
          message: document.getElementById('dushMsg').value.trim() || undefined,
        }),
      });
      showToast('Mesajınız iletildi, teşekkürler 🙏');
      document.getElementById('dushName').value  = '';
      document.getElementById('dushPhone').value = '';
      document.getElementById('dushMsg').value   = '';
      closeDush();
    } catch {
      showToast('Gönderim hatası, tekrar deneyin');
    } finally {
      btn.disabled = false;
    }
  });

  /* ── PUANLAMA MODAL ── */
  const ratingBg     = document.getElementById('gsRatingBg');
  const ratingSheet  = document.getElementById('gsRatingSheet');
  const starBtns     = Array.from(document.querySelectorAll('.gs-star-btn'));
  const ratingHint   = document.getElementById('gsRatingHint');
  const gmapsMsg     = document.getElementById('gsGmapsMsg');
  const ratingActions= document.getElementById('gsRatingActions');
  let _rating = 0;

  const RATING_HINTS = ['','Çok kötü','Kötü','Orta','İyi','Mükemmel'];

  function openRating()  { _rating = 0; renderRatingStars(0); gmapsMsg.classList.remove('show'); ratingActions.classList.remove('show'); ratingHint.textContent = 'Deneyiminizi değerlendirin'; ratingBg.classList.add('open'); ratingSheet.classList.add('open'); }
  function closeRating() { ratingBg.classList.remove('open'); ratingSheet.classList.remove('open'); }

  function renderRatingStars(val) {
    starBtns.forEach(s => s.classList.toggle('lit', Number(s.dataset.v) <= val));
  }

  document.getElementById('gsBiziBtn').addEventListener('click', openRating);
  document.getElementById('gsRatingClose').addEventListener('click', closeRating);
  ratingBg.addEventListener('click', closeRating);

  starBtns.forEach(star => {
    star.addEventListener('click', () => {
      _rating = Number(star.dataset.v);
      renderRatingStars(_rating);
      ratingHint.textContent = RATING_HINTS[_rating] || '';
      if (_rating >= 4) {
        gmapsMsg.classList.add('show');
        ratingActions.classList.add('show');
      } else {
        gmapsMsg.classList.remove('show');
        ratingActions.classList.remove('show');
        setTimeout(() => {
          closeRating();
          openDush();
        }, 420);
      }
    });
  });

  document.getElementById('gsRatingNo').addEventListener('click', closeRating);
  document.getElementById('gsRatingYes').addEventListener('click', () => {
    setTimeout(closeRating, 300);
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


});
