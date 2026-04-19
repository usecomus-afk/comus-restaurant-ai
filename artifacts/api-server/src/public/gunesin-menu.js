/* Güneşin Sofrası — menu client v20260419j
   Requires: window.GS_TABLE injected by server */

document.addEventListener('DOMContentLoaded', () => {

  const TABLE = String(window.GS_TABLE ?? '1');
  const RID   = 'gunesin-sofrasi';
  const cart  = new Map();
  let aiOpened = false, aiLoading = false;
  const aiHistory = [];

  /* ── helpers ── */
  const $   = id => document.getElementById(id);
  const post = (url, body) => fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });

  let _tt;
  function toast(msg) {
    clearTimeout(_tt);
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    _tt = setTimeout(() => el.classList.remove('show'), 2800);
  }

  /* ── 1. LOGO FALLBACK ── */
  (() => {
    const logo = $('gsLogo'), brand = $('gsBrand');
    if (!logo) return;
    const show = () => { logo.style.display = 'none'; brand.style.display = 'flex'; };
    const hide = () => { brand.style.display = 'none'; };
    if (logo.complete) logo.naturalWidth > 0 ? hide() : show();
    else { logo.onload = hide; logo.onerror = show; }
  })();

  /* ── 2. CATEGORY NAV (click + IntersectionObserver) ── */
  (() => {
    const nav   = $('catNav');
    const main  = $('menuContent');
    const pills = [...nav.querySelectorAll('.gs-pill')];
    const sects = [...document.querySelectorAll('.gs-section')];

    nav.addEventListener('click', e => {
      const pill = e.target.closest('.gs-pill');
      if (!pill) return;
      const sec = document.getElementById(pill.dataset.cat);
      if (sec) main.scrollTo({ top: sec.offsetTop - 12, behavior: 'smooth' });
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      pill.scrollIntoView({ inline: 'center', behavior: 'smooth' });
    });

    if (sects.length && window.IntersectionObserver) {
      const io = new IntersectionObserver(entries => {
        const vis = entries.filter(e => e.isIntersecting);
        if (!vis.length) return;
        const id = vis[0].target.id;
        pills.forEach(p => p.classList.toggle('active', p.dataset.cat === id));
        const ap = pills.find(p => p.dataset.cat === id);
        if (ap) ap.scrollIntoView({ inline: 'nearest', behavior: 'smooth' });
      }, { root: main, rootMargin: '-10% 0px -60% 0px', threshold: 0 });
      sects.forEach(s => io.observe(s));
    }
  })();

  /* ── 3. CART STATE ── */
  function updateBadge() {
    const count = [...cart.values()].reduce((s, i) => s + i.qty, 0);
    const b = $('cartBadge');
    b.textContent      = count > 0 ? String(count) : '🍽️';
    b.style.fontSize   = count > 0 ? '17px' : '20px';
    b.style.fontWeight = count > 0 ? '800' : 'normal';
  }

  function renderCart() {
    const items = [...cart.values()];
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    $('cartTotal').textContent = total.toLocaleString('tr-TR') + ' ₺';
    $('orderBtn').disabled = !items.length;
    const el = $('cartItems');
    if (!items.length) { el.innerHTML = '<p class="c-empty">Henüz ürün eklenmedi.</p>'; return; }
    el.innerHTML = items.map(it => `
      <div class="c-item">
        <span class="c-name">${it.name}</span>
        <span class="c-price">${(it.price * it.qty).toLocaleString('tr-TR')} ₺</span>
        <div class="c-qty">
          <button class="c-btn" data-id="${it.id}" data-a="dec">−</button>
          <span>${it.qty}</span>
          <button class="c-btn" data-id="${it.id}" data-a="inc">+</button>
        </div>
      </div>`).join('');
    el.querySelectorAll('.c-btn').forEach(btn => btn.addEventListener('click', () => {
      const it = cart.get(btn.dataset.id);
      if (!it) return;
      if (btn.dataset.a === 'inc') it.qty++;
      else if (--it.qty <= 0) cart.delete(btn.dataset.id);
      renderCart(); updateBadge();
    }));
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.gs-add-btn');
    if (!btn) return;
    const p = parseInt(btn.dataset.price, 10);
    if (!p) return;
    const id = btn.dataset.id;
    if (cart.has(id)) cart.get(id).qty++;
    else cart.set(id, { id, name: btn.dataset.name, price: p, qty: 1 });
    updateBadge();
    toast(btn.dataset.name + ' masaya eklendi ✓');
  });

  /* ── 4. SEPET DRAWER ── */
  const openCart  = () => { renderCart(); $('cartOverlay').classList.add('v'); $('cartDrawer').classList.add('open'); };
  const closeCart = () => { $('cartOverlay').classList.remove('v'); $('cartDrawer').classList.remove('open'); };

  $('cartFab').addEventListener('click', openCart);
  $('cartClose').addEventListener('click', closeCart);
  $('cartOverlay').addEventListener('click', closeCart);

  /* ── 5. SİPARİŞ VER → POST /api/order ── */
  $('orderBtn').addEventListener('click', async () => {
    const items = [...cart.values()];
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    try {
      await post('/api/order', {
        restaurantId: RID, tableNumber: TABLE,
        items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        total: total + ' ₺',
      });
    } catch (e) { console.error('[GS] order', e); }
    cart.clear(); updateBadge(); renderCart(); closeCart();
    toast('Siparişiniz iletildi ✓');
  });

  /* ── 6. GARSON ÇAĞIR / HESAP İSTE → POST /api/order/notify ── */
  async function notify(type) {
    toast(type === 'garson' ? 'Garson çağrısı iletildi ✓' : 'Hesap talebiniz iletildi ✓');
    try { await post('/api/order/notify', { restaurantId: RID, tableNumber: TABLE, type }); }
    catch (e) { console.error('[GS] notify', e); }
  }
  $('garsonBtn').addEventListener('click', () => notify('garson'));
  $('hesapBtn').addEventListener('click',  () => notify('hesap'));

  /* ── 7. AI GURME DRAWER ── */
  function aiAppend(role, text) {
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg ' + role;
    if (role === 'bot') wrap.innerHTML = '<span class="ai-av">👨‍🍳</span><span class="ai-bubble bot"></span>';
    else wrap.innerHTML = '<span class="ai-bubble user"></span>';
    wrap.querySelector('.ai-bubble').textContent = text;
    $('aiMessages').appendChild(wrap);
    $('aiMessages').scrollTop = 99999;
    return wrap;
  }

  const openAi = () => {
    document.body.style.overflow = 'hidden';
    $('aiOverlay').classList.add('v');
    $('aiDrawer').classList.add('open');
    if (!aiOpened) { aiOpened = true; aiAppend('bot', 'Hoş geldiniz efendim. Bu akşam içecek tercihiniz ne olur?'); }
    setTimeout(() => $('aiInput').focus(), 300);
  };
  const closeAi = () => {
    document.body.style.overflow = '';
    $('aiOverlay').classList.remove('v');
    $('aiDrawer').classList.remove('open');
  };

  async function sendAiMsg() {
    const inp = $('aiInput');
    const msg = inp.value.trim();
    if (!msg || aiLoading) return;
    inp.value = ''; inp.style.height = 'auto';
    aiHistory.push({ role: 'user', content: msg });
    aiAppend('user', msg);
    aiLoading = true;
    const loader = aiAppend('bot', '...');
    try {
      const res = await post('/api/chat', { restaurantId: RID, tableNumber: TABLE, message: msg, messages: aiHistory });
      loader.remove();
      if (res.ok) {
        const j = await res.json();
        const reply = j?.data?.reply || j?.reply || 'Yanıt alınamadı';
        aiHistory.push({ role: 'assistant', content: reply });
        aiAppend('bot', reply);
      } else {
        aiAppend('bot', 'Şu an yanıt veremiyorum, lütfen tekrar deneyin.');
      }
    } catch { loader.remove(); aiAppend('bot', 'Bağlantı hatası.'); }
    aiLoading = false;
  }

  $('aiFab').addEventListener('click', openAi);
  $('aiClose').addEventListener('click', closeAi);
  $('aiOverlay').addEventListener('click', closeAi);
  $('aiSend').addEventListener('click', sendAiMsg);
  $('aiInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMsg(); } });
  $('aiInput').addEventListener('input', () => {
    const el = $('aiInput'); el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 80) + 'px';
  });

  /* ── 8. DEĞERLENDİRME: 4-5★ Google, 1-3★ form ── */
  let _star = 0;
  const HINTS = ['', 'Çok kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

  const openRating = () => {
    _star = 0;
    document.querySelectorAll('.gs-star').forEach(s => s.classList.remove('lit'));
    $('ratingHint').textContent = 'Deneyiminizi değerlendirin';
    $('ratingGmaps').style.display = 'none';
    $('ratingActions').style.display = 'none';
    $('ratingOverlay').classList.add('v');
    $('ratingModal').classList.add('open');
  };
  const closeRating = () => { $('ratingOverlay').classList.remove('v'); $('ratingModal').classList.remove('open'); };

  const openFeedback  = () => { $('feedbackOverlay').classList.add('v'); $('feedbackModal').classList.add('open'); };
  const closeFeedback = () => { $('feedbackOverlay').classList.remove('v'); $('feedbackModal').classList.remove('open'); };

  $('ratingBtn').addEventListener('click', openRating);
  $('ratingClose').addEventListener('click', closeRating);
  $('ratingOverlay').addEventListener('click', closeRating);

  document.querySelectorAll('.gs-star').forEach(star => star.addEventListener('click', () => {
    _star = Number(star.dataset.v);
    document.querySelectorAll('.gs-star').forEach(s => s.classList.toggle('lit', Number(s.dataset.v) <= _star));
    $('ratingHint').textContent = HINTS[_star] || '';
    if (_star >= 4) {
      $('ratingGmaps').style.display = 'block';
      $('ratingActions').style.display = 'flex';
    } else {
      setTimeout(() => { closeRating(); openFeedback(); }, 420);
    }
  }));

  $('ratingNo').addEventListener('click', closeRating);
  $('ratingYes').addEventListener('click', () => setTimeout(closeRating, 300));

  $('feedbackClose').addEventListener('click', closeFeedback);
  $('feedbackOverlay').addEventListener('click', closeFeedback);

  $('feedbackSubmit').addEventListener('click', async () => {
    const name = $('feedbackName').value.trim();
    if (!name) { toast('Ad Soyad zorunludur'); return; }
    const btn = $('feedbackSubmit');
    btn.disabled = true;
    try {
      await post('/api/feedback/form', {
        masaId: TABLE, name,
        phone:   $('feedbackPhone').value.trim() || undefined,
        message: $('feedbackMsg').value.trim()   || undefined,
      });
      toast('Mesajınız iletildi, teşekkürler 🙏');
      $('feedbackName').value = $('feedbackPhone').value = $('feedbackMsg').value = '';
      closeFeedback();
    } catch { toast('Gönderim hatası, tekrar deneyin'); }
    finally { btn.disabled = false; }
  });

  /* ── 9. RAKI BOYUT TİLELERİ ── */
  $('menuContent').addEventListener('click', e => {
    const btn = e.target.closest('.rp-btn');
    if (!btn) return;
    const card  = btn.closest('.gs-raki-card');
    if (!card) return;
    const id    = card.dataset.rakiId;
    const base  = card.dataset.rakiName || 'Rakı';
    const size  = btn.dataset.size || '';
    const price = parseInt(btn.dataset.price, 10) || 0;
    const name  = size ? `${base} (${size})` : base;
    const key   = `${id}-${size}`;
    if (cart.has(key)) cart.get(key).qty++;
    else cart.set(key, { id: key, name, price, qty: 1 });
    updateBadge();
    toast(name + ' masaya eklendi ✓');
    btn.classList.add('rp-added');
    setTimeout(() => btn.classList.remove('rp-added'), 700);
  });

});
