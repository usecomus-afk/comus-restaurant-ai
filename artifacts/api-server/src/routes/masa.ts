import { Router, type IRouter, type Request, type Response } from "express";
import { menus, restaurants, type Dish } from "../lib/store.js";

const router: IRouter = Router();

const CATEGORY_ORDER = [
  "Snacks", "Burgers", "Mains", "Wraps",
  "Salads", "Pasta", "Vegan", "Cocktails", "Drinks", "Happy Hour",
];

const CATEGORY_TR: Record<string, string> = {
  Snacks:       "Atıştırma Tabakları",
  Burgers:      "Burgerler",
  Mains:        "Ana Yemekler",
  Wraps:        "Wrapler",
  Salads:       "Salatalar",
  Pasta:        "Makarnalar",
  Vegan:        "Vegan",
  Cocktails:    "Kokteyller",
  Drinks:       "İçecekler",
  "Happy Hour": "Happy Hour",
};

const NAV_LABEL: Record<string, string> = {
  Snacks:       "Atıştırma",
  Burgers:      "Burgerler",
  Mains:        "Ana Yemekler",
  Wraps:        "Wrapler",
  Salads:       "Salatalar",
  Pasta:        "Makarnalar",
  Vegan:        "Vegan",
  Cocktails:    "Kokteyl",
  Drinks:       "İçecekler",
  "Happy Hour": "Happy Hour",
};

const CATEGORY_NOTE: Record<string, string> = {
  Burgers:      "Tüm burgerler ev yapımı soğan turşusu ve karışık turşu ile servis edilir.",
  Wraps:        "Tüm wrapler salsa sos, tartar sos, karışık turşu ve parmak patates ile servis edilir.",
  "Happy Hour": "Her gün saat 18:55'e kadar geçerlidir.",
};

const ALLERGEN_TR: Record<string, string> = {
  gluten:    "Gluten",
  dairy:     "Süt Ürünleri",
  nuts:      "Kuruyemiş",
  shellfish: "Kabuklu Deniz Ürünleri",
  eggs:      "Yumurta",
  soy:       "Soya",
  fish:      "Balık",
  sesame:    "Susam",
};

function catSlug(cat: string): string {
  return "cat-" + cat.toLowerCase().replace(/\s+/g, "-");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderDishCard(d: any): string {
  const badges: string[] = [];
  if (d.isSpecial) badges.push(`<span class="badge bdg-special">⭐ Günün Özel</span>`);
  if (d.vegan) badges.push(`<span class="badge bdg-vegan">Vegan</span>`);
  else if (d.vegetarian) badges.push(`<span class="badge bdg-veg">Vejetaryen</span>`);
  if (d.glutenFree) badges.push(`<span class="badge bdg-gf">Glutensiz</span>`);
  if ((d.spiceLevel ?? 0) >= 2) badges.push(`<span class="badge bdg-spicy">🌶 Acılı</span>`);

  const allergenStr = d.allergens.length
    ? d.allergens.map((a: string) => ALLERGEN_TR[a] ?? a).join(", ")
    : "";

  const badgeHtml = badges.length ? `<div class="dish-badges">${badges.join("")}</div>` : "";

  return `
<div class="dish-card"
     role="button" tabindex="0"
     data-id="${escapeHtml(d.id)}"
     data-name="${escapeHtml(d.name)}"
     data-price="${d.price.toLocaleString("tr-TR")} ₺"
     data-pricenum="${d.price}"
     data-desc="${escapeHtml(d.description)}"
     data-allergens="${escapeHtml(allergenStr)}"
     data-vegan="${d.vegan ? "1" : "0"}"
     data-veg="${!d.vegan && d.vegetarian ? "1" : "0"}"
     data-gf="${d.glutenFree ? "1" : "0"}"
     data-spicy="${(d.spiceLevel ?? 0) >= 2 ? "1" : "0"}">
  <div class="dish-img-ph" aria-hidden="true">
    <button class="add-btn" data-id="${escapeHtml(d.id)}" aria-label="${escapeHtml(d.name)} sepete ekle">+</button>
  </div>
  <div class="card-body">
    <div class="card-row">
      <span class="dish-name">${escapeHtml(d.name)}</span>
      <span class="dish-price">${d.price.toLocaleString("tr-TR")} ₺</span>
    </div>
    <p class="dish-desc">${escapeHtml(d.description)}</p>
    ${badgeHtml}
  </div>
</div>`;
}

function renderPage(masaId: string): string {
  const isGunesin   = masaId.startsWith("gunesin-");
  const restKey     = isGunesin ? "gunesin-sofrasi" : "rebel";
  const restaurant  = restaurants.get(restKey)!;
  const menu        = menus.get(restaurant.menuKey)!;
  const masaPrefix  = restaurant.masaUrlPrefix;
  const masaCount   = restaurant.masaCount;

  const displayMasaId = masaId.replace(new RegExp(`^${masaPrefix}-`, "i"), "");

  const byCategory: Record<string, typeof menu.dishes> = {};
  for (const dish of menu.dishes) {
    if (dish.available === false) continue;
    (byCategory[dish.category] ??= []).push(dish);
  }

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => byCategory[c]),
    ...Object.keys(byCategory).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const navPills = orderedCategories
    .map((cat) =>
      `<button class="nav-pill" data-target="${catSlug(cat)}">${escapeHtml(NAV_LABEL[cat] ?? CATEGORY_TR[cat] ?? cat)}</button>`,
    )
    .join("");

  const menuSections = orderedCategories
    .map((cat) => {
      const dishes = byCategory[cat];
      const note = CATEGORY_NOTE[cat]
        ? `<p class="section-note">${escapeHtml(CATEGORY_NOTE[cat])}</p>`
        : "";

      let cardsHtml: string;

      if (cat === "Cocktails") {
        const sigs    = dishes.filter((d) => d.nameEn === "Rebel Signature");
        const classics = dishes.filter((d) => d.nameEn !== "Rebel Signature");
        cardsHtml = "";
        if (sigs.length)    cardsHtml += `<div class="sub-heading">★ Rebel Signature</div>${sigs.map(renderDishCard).join("")}`;
        if (classics.length) cardsHtml += `<div class="sub-heading">Klasik Kokteyller</div>${classics.map(renderDishCard).join("")}`;
      } else {
        cardsHtml = dishes.map(renderDishCard).join("");
      }

      return `
<section class="menu-section" id="${catSlug(cat)}">
  <h2 class="section-title">${escapeHtml(CATEGORY_TR[cat] ?? cat)}</h2>
  ${note}
  ${cardsHtml}
</section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0f0f0f">
<title>${escapeHtml(restaurant.name)} · Masa ${escapeHtml(displayMasaId)}</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍺</text></svg>">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --accent:      #e63946;
    --accent-dim:  rgba(230,57,70,.18);
    --bg:          #0f0f0f;
    --card:        #1a1a1a;
    --card-border: #252525;
    --text:        #f0ece4;
    --muted:       #888;
    --sub:         #555;
    --wa:          #25D366;
    --tg:          #229ED9;
    --header-h:    60px;
    --nav-h:       48px;
    --action-bar-h: 88px;
    --safe-b:      env(safe-area-inset-bottom, 0px);
    --safe-t:      env(safe-area-inset-top, 0px);
  }

  html { height: 100%; overflow-x: hidden; }
  body {
    height: 100%;
    height: 100dvh;
    overflow: hidden;
    overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: var(--bg);
    color: var(--text);
    -webkit-text-size-adjust: 100%;
  }

  /* ════════ FIXED HEADER ════════ */
  #appHeader {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: var(--header-h);
    background: #080808;
    border-bottom: 1px solid #1c1c1c;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
    z-index: 300;
  }
  .brand-name {
    font-size: 26px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.03em;
    line-height: 1;
    text-transform: lowercase;
  }
  .brand-accent { color: var(--accent); }
  .brand-sub {
    font-size: 9px;
    color: var(--sub);
    letter-spacing: .14em;
    text-transform: uppercase;
    margin-top: 3px;
  }
  .masa-badge {
    background: var(--accent);
    color: #fff;
    font-weight: 700;
    font-size: 12px;
    padding: 5px 13px;
    border-radius: 20px;
    letter-spacing: .04em;
    white-space: nowrap;
    border: none;
    cursor: pointer;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: opacity .15s;
  }
  .masa-badge:active { opacity: .75; }

  /* ════════ FIXED CATEGORY NAV ════════ */
  #catNav {
    position: fixed;
    top: var(--header-h);
    left: 0; right: 0;
    height: var(--nav-h);
    background: #0c0c0c;
    border-bottom: 1px solid #1c1c1c;
    z-index: 290;
    display: flex;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 0 14px;
    gap: 0;
  }
  #catNav::-webkit-scrollbar { display: none; }
  .nav-pill {
    flex-shrink: 0;
    height: 30px;
    padding: 0 14px;
    border-radius: 15px;
    font-size: 12.5px;
    font-weight: 600;
    font-family: inherit;
    white-space: nowrap;
    cursor: pointer;
    border: 1.5px solid #2a2a2a;
    background: transparent;
    color: var(--muted);
    margin-right: 7px;
    transition: background .18s, color .18s, border-color .18s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .nav-pill:last-child { margin-right: 0; }
  .nav-pill.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }
  .nav-pill:not(.active):active {
    background: var(--accent-dim);
    color: var(--accent);
    border-color: rgba(230,57,70,.4);
  }

  /* ════════ SCROLLABLE MENU ════════ */
  #menuContent {
    position: fixed;
    top: calc(var(--header-h) + var(--nav-h) + var(--action-bar-h));
    left: 0; right: 0;
    bottom: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    background: var(--bg);
  }
  #menuInner {
    max-width: 680px;
    margin: 0 auto;
    padding: 20px 14px 32px;
  }

  .menu-section { margin-bottom: 36px; }
  .section-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--accent);
    border-bottom: 1px solid #1e1e1e;
    padding-bottom: 9px;
    margin-bottom: 4px;
  }
  .section-note {
    font-size: 11.5px;
    color: var(--sub);
    margin-bottom: 12px;
    margin-top: 4px;
    font-style: italic;
    line-height: 1.4;
  }
  .sub-heading {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #444;
    margin: 16px 0 10px;
  }
  .sub-heading:first-child { margin-top: 12px; }

  /* ── Dish card ── */
  .dish-card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 10px;
    cursor: pointer;
    transition: border-color .18s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .dish-card:active { border-color: rgba(230,57,70,.4); }
  .dish-img-ph {
    width: 100%;
    height: 180px;
    background: #252525;
    display: block;
    position: relative;
  }
  .card-body { padding: 13px 14px 14px; }
  .card-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 6px;
  }
  .dish-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.3;
    flex: 1;
  }
  .dish-price {
    font-size: 15px;
    font-weight: 700;
    color: var(--accent);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .dish-desc {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .dish-badges { display: flex; gap: 5px; flex-wrap: wrap; }
  .badge {
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 12px;
    letter-spacing: .02em;
  }
  .bdg-special { background: rgba(250,204,21,.18); color: #facc15; font-weight: 800; }
  .bdg-vegan  { background: rgba(34,197,94,.15); color: #4ade80; }
  .bdg-veg    { background: rgba(34,197,94,.1);  color: #86efac; }
  .bdg-gf     { background: rgba(250,204,21,.12); color: #fbbf24; }
  .bdg-spicy  { background: rgba(230,57,70,.15);  color: #f87171; }


  /* ════════ TOAST ════════ */
  #toast {
    position: fixed;
    bottom: 16px;
    left: 50%; transform: translateX(-50%) translateY(12px);
    background: #252525;
    border: 1px solid #333;
    color: #fff;
    padding: 10px 20px;
    border-radius: 24px;
    font-size: 13.5px; font-weight: 700;
    opacity: 0; pointer-events: none;
    transition: opacity .22s, transform .22s;
    z-index: 950;
    white-space: nowrap;
  }
  #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

  /* ════════ MASA SELECTOR ════════ */
  #masaBg {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.8);
    z-index: 860;
    opacity: 0; pointer-events: none;
    transition: opacity .25s;
  }
  #masaBg.open { opacity: 1; pointer-events: auto; }
  #masaSheet {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: #111;
    border-radius: 20px 20px 0 0;
    border-top: 1px solid #1e1e1e;
    z-index: 870;
    transform: translateY(100%);
    transition: transform .3s cubic-bezier(.25,.46,.45,.94);
    padding-bottom: calc(16px + var(--safe-b));
  }
  #masaSheet.open { transform: translateY(0); }
  #masaSheetHead {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 18px 12px;
    border-bottom: 1px solid #1e1e1e;
  }
  #masaSheetHead h3 { font-size: 16px; font-weight: 700; color: var(--text); }
  #masaCloseBtn {
    background: #1e1e1e; border: none;
    color: var(--muted); font-size: 16px;
    width: 32px; height: 32px; border-radius: 50%;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }
  #masaCloseBtn:active { background: #2a2a2a; }
  #masaGrid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 9px;
    padding: 16px 14px;
  }
  .masa-num-btn {
    height: 48px;
    border-radius: 11px;
    background: #1a1a1a;
    border: 1.5px solid #2a2a2a;
    color: var(--text);
    font-size: 16px; font-weight: 700; font-family: inherit;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .12s, border-color .12s, transform .1s;
    -webkit-tap-highlight-color: transparent;
  }
  .masa-num-btn:active { transform: scale(.9); }
  .masa-num-btn.selected {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  /* ════════ STICKY ACTION BAR ════════ */
  #actionBar {
    position: fixed;
    top: calc(var(--header-h) + var(--nav-h));
    left: 0; right: 0;
    height: var(--action-bar-h);
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 8px 12px;
    background: #0a0a0a;
    border-bottom: 1px solid #1c1c1c;
    z-index: 280;
    box-sizing: border-box;
  }
  .ab-btn {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 5px;
    background: #1a1a1a; border: 1px solid #252525;
    border-radius: 11px; padding: 10px 6px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform .15s, border-color .15s, background .15s;
  }
  .ab-btn:active { transform: scale(.94); border-color: #facc15; background: #202020; }
  .ab-btn:disabled { opacity: .4; pointer-events: none; }
  .ab-btn.ai-btn { border-color: rgba(230,57,70,.35); position: relative; }
  .ab-btn.ai-btn:active { border-color: var(--accent); }
  .ab-icon  { font-size: 22px; line-height: 1; }
  .ab-icon svg { width: 22px; height: 22px; fill: var(--accent); display: block; }
  .ab-label {
    font-size: 11px; font-weight: 700; color: var(--muted);
    text-align: center; line-height: 1.2; letter-spacing: .01em;
  }
  .ab-btn.ai-btn .ab-label { font-size: 12px; color: var(--accent); }

  /* GurmeAI pulsing green online dot */
  .ai-dot {
    position: absolute; top: 7px; right: 10px;
    width: 12px; height: 12px; border-radius: 50%;
    background: #22c55e; border: 2.5px solid #1a1a1a;
    animation: aiPulse 1.8s infinite;
    z-index: 2;
  }
  @keyframes aiPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,.7); }
    50%       { box-shadow: 0 0 0 7px rgba(34,197,94,0); }
  }


  /* ════════ GENERIC MODAL (feedback & rating) ════════ */
  .modal-bg {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.8);
    z-index: 800;
    opacity: 0; pointer-events: none;
    transition: opacity .25s;
  }
  .modal-bg.open { opacity: 1; pointer-events: auto; }
  .modal-sheet {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: #111;
    border-radius: 20px 20px 0 0;
    border-top: 1px solid #1e1e1e;
    z-index: 810;
    transform: translateY(100%);
    transition: transform .32s cubic-bezier(.25,.46,.45,.94);
    padding-bottom: calc(20px + var(--safe-b));
    max-height: 90vh;
    overflow-y: auto;
  }
  .modal-sheet.open { transform: translateY(0); }
  .modal-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 18px 14px;
    border-bottom: 1px solid #1e1e1e;
    position: sticky; top: 0; background: #111; z-index: 1;
  }
  .modal-head h3 { font-size: 16px; font-weight: 700; color: var(--text); }
  .modal-close {
    background: #1e1e1e; border: none;
    color: var(--muted); font-size: 16px;
    width: 32px; height: 32px; border-radius: 50%;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }
  .modal-close:active { background: #2a2a2a; }
  .modal-body { padding: 18px 18px 0; }
  .modal-field { margin-bottom: 14px; }
  .modal-field label {
    display: block; font-size: 11px; font-weight: 700;
    color: var(--muted); letter-spacing: .08em;
    text-transform: uppercase; margin-bottom: 6px;
  }
  .modal-input, .modal-textarea {
    width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a;
    border-radius: 10px; color: var(--text);
    font-family: inherit; font-size: 15px; padding: 11px 14px;
    outline: none; transition: border-color .15s;
  }
  .modal-input:focus, .modal-textarea:focus { border-color: rgba(230,57,70,.5); }
  .modal-textarea { resize: none; height: 90px; line-height: 1.45; }
  .modal-submit {
    width: 100%; height: 46px; border-radius: 12px;
    background: var(--accent); border: none; color: #fff;
    font-size: 15px; font-weight: 700; font-family: inherit;
    cursor: pointer; margin-top: 4px;
    transition: opacity .15s, transform .1s;
    -webkit-tap-highlight-color: transparent;
  }
  .modal-submit:active { transform: scale(.97); opacity: .9; }
  .modal-submit:disabled { opacity: .35; cursor: not-allowed; }

  /* ════════ RATING STARS ════════ */
  .star-row {
    display: flex; justify-content: center; gap: 6px;
    padding: 20px 0 8px;
  }
  .star-btn {
    background: none; border: none;
    font-size: 38px; cursor: pointer;
    opacity: .25; transition: opacity .12s, transform .1s;
    -webkit-tap-highlight-color: transparent; line-height: 1; padding: 2px;
  }
  .star-btn.lit { opacity: 1; }
  .star-btn:active { transform: scale(.82); }
  .rating-hint {
    text-align: center; font-size: 13px; color: var(--muted);
    min-height: 20px; margin-bottom: 18px; padding: 0 18px;
  }
  .rating-action-row {
    display: flex; gap: 10px; padding: 0 18px; margin-bottom: 4px;
  }
  .rating-action-btn {
    flex: 1; height: 44px; border-radius: 11px;
    border: 1px solid #2a2a2a; background: #1a1a1a;
    color: var(--text); font-size: 14px; font-weight: 600; font-family: inherit;
    cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background .15s;
  }
  .rating-action-btn.primary { background: #4ade80; border-color: #4ade80; color: #000; }
  .rating-action-btn:active { opacity: .8; }

  /* ════════ CHAT OVERLAY (full screen) ════════ */
  #chatOverlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    background: #0a0a0a;
    transform: translateY(100%);
    transition: transform .35s cubic-bezier(.25,.46,.45,.94);
    will-change: transform;
  }
  #chatOverlay.open { transform: translateY(0); }

  #chatHead {
    flex-shrink: 0;
    height: 56px;
    background: #111;
    border-bottom: 1px solid #1e1e1e;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 10px;
  }
  .chat-logo { font-size: 17px; font-weight: 900; color: var(--accent); letter-spacing: -.02em; }
  .chat-sub  { font-size: 11px; color: var(--sub); letter-spacing: .06em; text-transform: uppercase; flex: 1; }
  .chat-dot  {
    width: 7px; height: 7px;
    background: #4ade80;
    border-radius: 50%;
    animation: pulse 2.2s infinite;
    flex-shrink: 0;
    margin-left: 4px;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  #chatCloseBtn {
    background: #1e1e1e;
    border: none;
    color: var(--muted);
    font-size: 17px;
    width: 34px; height: 34px;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }
  #chatCloseBtn:active { background: #2a2a2a; }

  #chatMessages {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: #222 transparent;
  }
  .msg {
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.55;
    max-width: 86%;
    word-break: break-word;
  }
  .msg.bot {
    background: #1a1a1a;
    color: var(--text);
    border: 1px solid #252525;
    border-bottom-left-radius: 4px;
    align-self: flex-start;
  }
  .msg.user {
    background: var(--accent);
    color: #fff;
    border-bottom-right-radius: 4px;
    align-self: flex-end;
    font-weight: 500;
  }
  .msg.thinking { color: var(--sub); font-style: italic; background: #141414; }

  #chatInputBar {
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding: 10px 12px;
    padding-bottom: calc(10px + var(--safe-b));
    background: #111;
    border-top: 1px solid #1e1e1e;
    transition: padding-bottom .15s;
  }
  #chatInput {
    flex: 1;
    min-width: 0;
    border: 1px solid #2a2a2a;
    border-radius: 22px;
    outline: none;
    padding: 10px 16px;
    font-size: 15px;
    font-family: inherit;
    resize: none;
    background: #1a1a1a;
    color: var(--text);
    line-height: 1.4;
    max-height: 100px;
    overflow-y: auto;
  }
  #chatInput::placeholder { color: #444; }
  #chatInput:focus { border-color: rgba(230,57,70,.5); }
  #chatSend {
    flex-shrink: 0;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s, transform .1s;
    -webkit-tap-highlight-color: transparent;
  }
  #chatSend:active  { transform: scale(.92); }
  #chatSend:disabled { background: #333; cursor: not-allowed; }
  #chatSend svg { width: 20px; height: 20px; fill: #fff; margin-left: 2px; }

  /* ════════ DETAIL MODAL (bottom sheet) ════════ */
  #detailBg {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.75);
    z-index: 600;
    opacity: 0; pointer-events: none;
    transition: opacity .28s;
  }
  #detailBg.open { opacity: 1; pointer-events: auto; }
  #detailSheet {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    max-height: 84vh;
    background: #141414;
    border-radius: 20px 20px 0 0;
    z-index: 610;
    transform: translateY(100%);
    transition: transform .32s cubic-bezier(.25,.46,.45,.94);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  #detailSheet.open { transform: translateY(0); }
  #detailScroll {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
  }
  .detail-img-ph {
    width: 100%;
    height: 180px;
    background: #222;
    flex-shrink: 0;
  }
  .detail-body { padding: 18px 18px 18px; }
  #detailAddFooter {
    flex-shrink: 0;
    padding: 12px 16px calc(12px + var(--safe-b));
    background: #111;
    border-top: 1px solid #1e1e1e;
  }
  #detailAddBtn {
    width: 100%; height: 52px;
    border-radius: 13px;
    background: #e63946;
    border: none;
    color: #fff;
    font-size: 15px; font-weight: 800; font-family: inherit;
    letter-spacing: .01em;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .15s, transform .1s;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 3px 12px rgba(230,57,70,.4);
  }
  #detailAddBtn:active { transform: scale(.97); opacity: .9; }
  .detail-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
  }
  .detail-name  { font-size: 19px; font-weight: 800; color: var(--text); flex: 1; line-height: 1.25; }
  .detail-price { font-size: 19px; font-weight: 800; color: var(--accent); flex-shrink: 0; }
  .detail-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .detail-desc  { font-size: 14px; color: #ccc; line-height: 1.6; margin-bottom: 14px; }
  .detail-allergens {
    font-size: 12.5px;
    color: #f87171;
    background: rgba(248,113,113,.08);
    border-radius: 8px;
    padding: 8px 12px;
    line-height: 1.4;
  }
  #detailClose {
    position: absolute;
    top: 14px; right: 14px;
    background: rgba(0,0,0,.5);
    border: none;
    color: #aaa;
    font-size: 16px;
    width: 32px; height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    z-index: 5;
    backdrop-filter: blur(4px);
    -webkit-tap-highlight-color: transparent;
  }
  #detailClose:active { background: rgba(0,0,0,.75); }

  /* ════════ HEADER SIDE BUTTONS ════════ */
  .hdr-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px;
    min-width: 56px; height: 44px;
    background: #1a1a1a;
    border: 1.5px solid #2a2a2a;
    border-radius: 11px;
    color: var(--text);
    cursor: pointer;
    flex-shrink: 0;
    transition: border-color .15s, background .15s;
    -webkit-tap-highlight-color: transparent;
    padding: 0 10px;
  }
  .hdr-btn:active { border-color: var(--accent); background: #202020; }
  .hdr-btn svg { width: 16px; height: 16px; fill: currentColor; }
  .hdr-btn-label {
    font-size: 9px; font-weight: 700; letter-spacing: .05em;
    text-transform: uppercase; color: var(--muted); line-height: 1;
  }
  #adisyonBtn { border-color: rgba(230,57,70,.3); }
  #adisyonBtn svg { fill: var(--accent); }
  #adisyonBtn .hdr-btn-label { color: var(--accent); }
  #adisyonBtn:active { border-color: var(--accent); }
  #rateBtn { height: 50px; }
  #rateBtn svg { fill: #facc15; }
  .hdr-stars { font-size: 8px; color: #facc15; letter-spacing: 1px; line-height: 1; }

  /* [kept for cart drawer badge functionality] */
  .cart-badge {
    position: absolute;
    top: -7px; right: -7px;
    background: var(--accent);
    color: #fff;
    font-size: 10px; font-weight: 800;
    min-width: 18px; height: 18px;
    border-radius: 9px;
    padding: 0 4px;
    display: flex; align-items: center; justify-content: center;
    line-height: 1;
    pointer-events: none;
    border: 2px solid #080808;
  }
  .cart-badge.hidden { display: none; }
  .brand-center {
    display: flex; flex-direction: column; align-items: center;
    flex: 1; min-width: 0;
  }

  /* ════════ ADD BUTTON (+) on cards ════════ */
  .add-btn {
    position: absolute;
    bottom: 10px; right: 10px;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    color: #fff;
    font-size: 26px;
    font-weight: 300;
    line-height: 1;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    z-index: 3;
    transition: transform .12s, background .15s;
    -webkit-tap-highlight-color: transparent;
    font-family: inherit;
    box-shadow: 0 2px 8px rgba(230,57,70,.45);
  }
  .add-btn:active { transform: scale(.80); }
  .add-btn.in-cart {
    background: #111;
    border: 2.5px solid var(--accent);
    color: var(--accent);
    font-size: 15px;
    font-weight: 800;
    box-shadow: none;
  }
  @keyframes cardFlash {
    0%   { box-shadow: 0 0 0 0   rgba(230,57,70,0);   border-color: var(--card-border); }
    35%  { box-shadow: 0 0 0 4px rgba(230,57,70,.45); border-color: var(--accent); }
    100% { box-shadow: 0 0 0 0   rgba(230,57,70,0);   border-color: var(--card-border); }
  }
  .dish-card.flashing { animation: cardFlash .55s ease forwards; }

  /* ════════ CART DRAWER ════════ */
  #cartBg {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.72);
    z-index: 700;
    opacity: 0; pointer-events: none;
    transition: opacity .25s;
  }
  #cartBg.open { opacity: 1; pointer-events: auto; }
  #cartDrawer {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: min(360px, 90vw);
    background: #111;
    border-left: 1px solid #1e1e1e;
    z-index: 710;
    transform: translateX(100%);
    transition: transform .3s cubic-bezier(.25,.46,.45,.94);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  #cartDrawer.open { transform: translateX(0); }
  #cartHead {
    flex-shrink: 0;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid #1e1e1e;
  }
  #cartHead h2 { font-size: 16px; font-weight: 700; color: var(--text); }
  #cartCloseBtn {
    background: #1e1e1e; border: none;
    color: var(--muted); font-size: 16px;
    width: 32px; height: 32px; border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }
  #cartCloseBtn:active { background: #2a2a2a; }
  #cartItemsList {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 8px 0;
  }
  .cart-empty {
    text-align: center;
    color: var(--sub);
    font-size: 14px;
    padding: 48px 20px;
  }
  .cart-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 16px;
    border-bottom: 1px solid #171717;
    gap: 10px;
  }
  .cart-item-info { flex: 1; min-width: 0; }
  .cart-item-name {
    font-size: 13.5px; font-weight: 600; color: var(--text);
    display: block;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  .cart-item-price { font-size: 12.5px; color: var(--accent); }
  .cart-item-controls {
    display: flex; align-items: center;
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 20px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .qty-btn {
    background: transparent; border: none;
    color: var(--text); font-size: 18px;
    width: 34px; height: 34px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    -webkit-tap-highlight-color: transparent;
    font-family: inherit;
  }
  .qty-btn:active { background: #2a2a2a; }
  .qty-val {
    font-size: 13px; font-weight: 700;
    color: var(--text);
    min-width: 24px; text-align: center;
  }
  #cartFooter {
    flex-shrink: 0;
    padding: 14px 16px calc(14px + var(--safe-b));
    border-top: 1px solid #1e1e1e;
    background: #0e0e0e;
  }
  .cart-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 13px;
    font-size: 14px;
  }
  .cart-total-row span:first-child { color: var(--muted); }
  #cartTotalPrice { font-size: 19px; font-weight: 800; color: var(--text); }
  #sendOrderBtn {
    width: 100%; height: 46px;
    border-radius: 12px;
    background: #229ED9;
    border: none; color: #fff;
    font-size: 14px; font-weight: 700; font-family: inherit;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .15s, transform .1s;
    -webkit-tap-highlight-color: transparent;
  }
  #sendOrderBtn:disabled { opacity: .35; cursor: not-allowed; pointer-events: none; }
  #sendOrderBtn:active { transform: scale(.97); }
  #sendOrderBtn svg { width: 18px; height: 18px; fill: #fff; flex-shrink: 0; }
  #orderMsg {
    text-align: center; font-size: 12.5px; font-weight: 600;
    margin-top: 9px; min-height: 18px;
  }
  #orderMsg.ok  { color: #4ade80; }
  #orderMsg.err { color: #f87171; }

</style>
</head>
<body>

<!-- ═══ HEADER ═══ -->
<header id="appHeader">
  <button id="adisyonBtn" class="hdr-btn" aria-label="Adisyon iste">
    <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
    <span class="hdr-btn-label">Adisyon</span>
  </button>
  <div class="brand-center">
    ${isGunesin
      ? `<div class="brand-name" style="font-size:15px;letter-spacing:.01em">Güneşin Sofrası</div><div class="brand-sub">Meyhane</div>`
      : `<div class="brand-name">rebel<span class="brand-accent">.</span></div><div class="brand-sub">Bar &amp; Bistro</div>`
    }
  </div>
  <button id="rateBtn" class="hdr-btn" aria-label="Bizi değerlendirin">
    <span class="hdr-btn-label">Bizi Değerlendirin</span>
    <span class="hdr-stars">★★★★★</span>
  </button>
</header>

<!-- ═══ CATEGORY NAV ═══ -->
<nav id="catNav" aria-label="Menü kategorileri">
  ${navPills}
</nav>

<!-- ═══ STICKY ACTION BAR ═══ -->
<div id="actionBar" role="toolbar" aria-label="Hızlı işlemler">
  <button class="ab-btn" id="abGarson">
    <span class="ab-icon">🖐️</span>
    <span class="ab-label">Garson Çağırın</span>
  </button>
  <button class="ab-btn ai-btn" id="abAI" aria-label="GurmeAI sohbeti aç">
    <span class="ai-dot"></span>
    <span class="ab-icon">
      <svg viewBox="0 0 24 24" style="fill:#fff;width:22px;height:22px;display:block"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </span>
    <span class="ab-label">GurmeAI</span>
  </button>
</div>

<!-- ═══ MENU CONTENT ═══ -->
<main id="menuContent">
  <div id="menuInner">
    ${menuSections}
  </div>
</main>

<!-- ═══ TOAST ═══ -->
<div id="toast" role="status" aria-live="polite"></div>

<!-- ═══ MASA SELECTOR ═══ -->
<div id="masaBg" aria-hidden="true"></div>
<div id="masaSheet" role="dialog" aria-label="Masa seç" aria-hidden="true">
  <div id="masaSheetHead">
    <h3>Masanı Seç</h3>
    <button id="masaCloseBtn" aria-label="Kapat">✕</button>
  </div>
  <div id="masaGrid">
    ${Array.from({ length: masaCount }, (_, i) => i + 1)
      .map(n => `<button class="masa-num-btn" data-num="${n}">${n}</button>`)
      .join("")}
  </div>
</div>

<!-- ═══ CART DRAWER ═══ -->
<div id="cartBg" aria-hidden="true"></div>
<aside id="cartDrawer" role="dialog" aria-label="Sepet" aria-hidden="true">
  <div id="cartHead">
    <h2>🛒 Sepet</h2>
    <button id="cartCloseBtn" aria-label="Sepeti kapat">✕</button>
  </div>
  <div id="cartItemsList">
    <p class="cart-empty">Sepetiniz boş.</p>
  </div>
  <div id="cartFooter">
    <div class="cart-total-row">
      <span>Toplam</span>
      <span id="cartTotalPrice">0 ₺</span>
    </div>
    <button id="sendOrderBtn" disabled>
      <svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      Sipariş Ver
    </button>
    <p id="orderMsg"></p>
  </div>
</aside>

<!-- ═══ FEEDBACK MODAL ═══ -->
<div id="feedbackBg" class="modal-bg" aria-hidden="true"></div>
<div id="feedbackSheet" class="modal-sheet" role="dialog" aria-label="Görüşleriniz" aria-modal="true" aria-hidden="true">
  <div class="modal-head">
    <h3>Görüşleriniz</h3>
    <button class="modal-close" id="feedbackClose" aria-label="Kapat">✕</button>
  </div>
  <div class="modal-body">
    <div class="modal-field">
      <label for="fbName">Ad Soyad</label>
      <input class="modal-input" id="fbName" type="text" placeholder="Adınız ve soyadınız" autocomplete="name">
    </div>
    <div class="modal-field">
      <label for="fbPhone">Cep Numarası</label>
      <input class="modal-input" id="fbPhone" type="tel" placeholder="0 5XX XXX XX XX" autocomplete="tel">
    </div>
    <div class="modal-field">
      <label for="fbMessage">Mesajınız</label>
      <textarea class="modal-textarea" id="fbMessage" placeholder="Deneyiminizi, önerilerinizi veya şikayetlerinizi buraya yazabilirsiniz…"></textarea>
    </div>
    <button class="modal-submit" id="fbSubmit">İlet</button>
  </div>
</div>

<!-- ═══ RATING MODAL ═══ -->
<div id="ratingBg" class="modal-bg" aria-hidden="true"></div>
<div id="ratingSheet" class="modal-sheet" role="dialog" aria-label="Bizi Puanlayın" aria-modal="true" aria-hidden="true">
  <div class="modal-head">
    <h3>Bizi Puanlayın</h3>
    <button class="modal-close" id="ratingClose" aria-label="Kapat">✕</button>
  </div>
  <div class="star-row" id="starRow">
    <button class="star-btn" data-val="1" aria-label="1 yıldız">★</button>
    <button class="star-btn" data-val="2" aria-label="2 yıldız">★</button>
    <button class="star-btn" data-val="3" aria-label="3 yıldız">★</button>
    <button class="star-btn" data-val="4" aria-label="4 yıldız">★</button>
    <button class="star-btn" data-val="5" aria-label="5 yıldız">★</button>
  </div>
  <p class="rating-hint" id="ratingHint">Deneyiminizi değerlendirin</p>
  <div class="rating-action-row" id="ratingActions" style="display:none">
    <button class="rating-action-btn" id="ratingNo">Hayır</button>
    <button class="rating-action-btn primary" id="ratingYes">Evet, değerlendireyim</button>
  </div>
</div>

<!-- ═══ CHAT OVERLAY ═══ -->
<div id="chatOverlay" role="dialog" aria-label="Rebel Menü Asistanı" aria-modal="true" aria-hidden="true">
  <div id="chatHead">
    <span class="chat-logo">rebel</span>
    <span class="chat-sub">Menü Asistanı</span>
    <span class="chat-dot"></span>
    <button id="chatCloseBtn" aria-label="Kapat">✕</button>
  </div>
  <div id="chatMessages">
    <div class="msg bot">Merhaba! 👋 Rebel'e hoş geldiniz. Menü, kokteyller veya happy hour hakkında sormak istediğiniz bir şey var mı?</div>
  </div>
  <div id="chatInputBar">
    <textarea id="chatInput" rows="1" placeholder="Mesajınızı yazın…"></textarea>
    <button id="chatSend" aria-label="Gönder">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
    </button>
  </div>
</div>

<!-- ═══ DETAIL MODAL ═══ -->
<div id="detailBg" aria-hidden="true"></div>
<div id="detailSheet" role="dialog" aria-label="Ürün detayı" aria-modal="true" aria-hidden="true">
  <button id="detailClose" aria-label="Kapat">✕</button>
  <div id="detailScroll">
    <div class="detail-img-ph" id="detailImg" aria-hidden="true"></div>
    <div class="detail-body">
      <div class="detail-title-row">
        <span class="detail-name"  id="detailName"></span>
        <span class="detail-price" id="detailPrice"></span>
      </div>
      <div class="detail-badges" id="detailBadges"></div>
      <p class="detail-desc" id="detailDesc"></p>
      <div class="detail-allergens" id="detailAllergens" style="display:none"></div>
    </div>
  </div>
  <div id="detailAddFooter">
    <button id="detailAddBtn">Sepete Ekle</button>
  </div>
</div>

<script>
  'use strict';

  /* ── CART STATE ──────────────────────────────────────── */
  const CART = new Map(); // id → { name, price, qty }

  function cartCount() {
    let n = 0;
    for (const v of CART.values()) n += v.qty;
    return n;
  }

  function cartTotal() {
    let t = 0;
    for (const v of CART.values()) t += v.price * v.qty;
    return t;
  }

  function safeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function updateCartBadge() {
    const n = cartCount();
    const badge = document.getElementById('cartBadge');
    badge.textContent = String(n);
    badge.classList.toggle('hidden', n === 0);
  }

  function syncAddBtns() {
    document.querySelectorAll('.add-btn').forEach(btn => {
      const item = CART.get(btn.dataset.id);
      const qty  = item ? item.qty : 0;
      if (qty > 0) {
        btn.textContent = String(qty);
        btn.classList.add('in-cart');
      } else {
        btn.textContent = '+';
        btn.classList.remove('in-cart');
      }
    });
  }

  function renderCartItems() {
    const list    = document.getElementById('cartItemsList');
    const sendBtn = document.getElementById('sendOrderBtn');
    const totalEl = document.getElementById('cartTotalPrice');

    if (CART.size === 0) {
      list.innerHTML = '<p class="cart-empty">Sepetiniz boş.</p>';
      sendBtn.disabled = true;
      totalEl.textContent = '0 ₺';
      return;
    }

    sendBtn.disabled = false;
    let html = '';
    for (const [id, item] of CART) {
      const sub = (item.price * item.qty).toLocaleString('tr-TR');
      html += \`<div class="cart-item">
        <div class="cart-item-info">
          <span class="cart-item-name">\${safeHtml(item.name)}</span>
          <span class="cart-item-price">\${sub} ₺</span>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn qty-dec" data-id="\${safeHtml(id)}" aria-label="Azalt">−</button>
          <span class="qty-val">\${item.qty}</span>
          <button class="qty-btn qty-inc" data-id="\${safeHtml(id)}" aria-label="Artır">+</button>
        </div>
      </div>\`;
    }
    list.innerHTML = html;
    totalEl.textContent = cartTotal().toLocaleString('tr-TR') + ' ₺';
  }

  /* Cart drawer open/close */
  const cartBgEl     = document.getElementById('cartBg');
  const cartDrawerEl = document.getElementById('cartDrawer');

  function openCart() {
    renderCartItems();
    cartBgEl.classList.add('open');
    cartDrawerEl.classList.add('open');
    cartDrawerEl.removeAttribute('aria-hidden');
    document.getElementById('orderMsg').textContent = '';
    document.getElementById('orderMsg').className = '';
  }
  function closeCart() {
    cartBgEl.classList.remove('open');
    cartDrawerEl.classList.remove('open');
    cartDrawerEl.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
  cartBgEl.addEventListener('click', closeCart);

  /* Qty controls via event delegation */
  document.getElementById('cartItemsList').addEventListener('click', e => {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;
    const id   = btn.dataset.id;
    const item = CART.get(id);
    if (!item) return;
    if (btn.classList.contains('qty-inc')) {
      item.qty++;
    } else {
      item.qty--;
      if (item.qty <= 0) CART.delete(id);
    }
    syncAddBtns();
    updateCartBadge();
    renderCartItems();
  });

  /* Add to cart via + button on card */
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card  = btn.closest('.dish-card');
      const id    = btn.dataset.id;
      const name  = card.dataset.name;
      const price = parseInt(card.dataset.pricenum, 10);

      if (CART.has(id)) {
        CART.get(id).qty++;
      } else {
        CART.set(id, { name, price, qty: 1 });
      }

      const qty = CART.get(id).qty;
      btn.textContent = String(qty);
      btn.classList.add('in-cart');
      updateCartBadge();

      card.classList.remove('flashing');
      void card.offsetWidth;
      card.classList.add('flashing');
      card.addEventListener('animationend', () => card.classList.remove('flashing'), { once: true });
    });
  });

  /* Send order */
  const TG_SVG = \`<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>\`;

  document.getElementById('sendOrderBtn').addEventListener('click', async () => {
    if (CART.size === 0) return;
    const sendBtn = document.getElementById('sendOrderBtn');
    const msgEl   = document.getElementById('orderMsg');

    const items = [];
    for (const [dishId, item] of CART) {
      items.push({ dishId, dishName: item.name, quantity: item.qty, unitPrice: item.price });
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = 'Gönderiliyor…';
    msgEl.textContent = '';
    msgEl.className   = '';

    try {
      const res  = await fetch('/api/order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ restaurantId: 'rest-01', tableNumber: _masaId, items }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Hata');

      fetch('/api/order/telegram', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ masaId: _masaId, items }),
      }).catch(() => {});

      CART.clear();
      syncAddBtns();
      updateCartBadge();
      renderCartItems();
      msgEl.textContent = '✓ Siparişiniz alındı!';
      msgEl.className   = 'ok';
    } catch (err) {
      msgEl.textContent = '⚠ ' + (err.message ?? 'Bağlantı hatası');
      msgEl.className   = 'err';
    } finally {
      sendBtn.disabled  = false;
      sendBtn.innerHTML = TG_SVG + ' Sipariş Ver';
    }
  });

  /* ── DETAIL MODAL ─────────────────────────────────────── */
  const detailBg    = document.getElementById('detailBg');
  const detailSheet = document.getElementById('detailSheet');
  const detailClose = document.getElementById('detailClose');
  const detailAddBtn = document.getElementById('detailAddBtn');
  let   _detailCard  = null;

  function syncDetailAddBtn() {
    if (!_detailCard) return;
    const existing = CART.get(_detailCard.dataset.id);
    detailAddBtn.textContent = existing
      ? \`Sepete Ekle · \${existing.qty} var\`
      : 'Sepete Ekle';
  }

  function openDetail(card) {
    _detailCard = card;
    document.getElementById('detailName').textContent  = card.dataset.name;
    document.getElementById('detailPrice').textContent = card.dataset.price;
    document.getElementById('detailDesc').textContent  = card.dataset.desc;

    const badgesEl = document.getElementById('detailBadges');
    badgesEl.innerHTML = '';
    if (card.dataset.vegan  === '1') badgesEl.innerHTML += '<span class="badge bdg-vegan">Vegan</span>';
    else if (card.dataset.veg === '1') badgesEl.innerHTML += '<span class="badge bdg-veg">Vejetaryen</span>';
    if (card.dataset.gf    === '1') badgesEl.innerHTML += '<span class="badge bdg-gf">Glutensiz</span>';
    if (card.dataset.spicy === '1') badgesEl.innerHTML += '<span class="badge bdg-spicy">🌶 Acılı</span>';

    const allerEl = document.getElementById('detailAllergens');
    if (card.dataset.allergens) {
      allerEl.textContent = '⚠️ Alerjen: ' + card.dataset.allergens;
      allerEl.style.display = '';
    } else {
      allerEl.style.display = 'none';
    }

    syncDetailAddBtn();
    document.getElementById('detailScroll').scrollTop = 0;
    detailBg.classList.add('open');
    detailSheet.classList.add('open');
    detailSheet.removeAttribute('aria-hidden');
  }

  function closeDetail() {
    detailBg.classList.remove('open');
    detailSheet.classList.remove('open');
    detailSheet.setAttribute('aria-hidden', 'true');
    _detailCard = null;
  }

  detailAddBtn.addEventListener('click', () => {
    if (!_detailCard) return;
    const id    = _detailCard.dataset.id;
    const name  = _detailCard.dataset.name;
    const price = parseInt(_detailCard.dataset.pricenum, 10);

    if (CART.has(id)) {
      CART.get(id).qty++;
    } else {
      CART.set(id, { name, price, qty: 1 });
    }

    syncAddBtns();
    updateCartBadge();

    /* flash the matching card */
    const matchCard = document.querySelector(\`.dish-card[data-id="\${CSS.escape(id)}"]\`);
    if (matchCard) {
      matchCard.classList.remove('flashing');
      void matchCard.offsetWidth;
      matchCard.classList.add('flashing');
      matchCard.addEventListener('animationend', () => matchCard.classList.remove('flashing'), { once: true });
    }

    closeDetail();
  });

  document.querySelectorAll('.dish-card').forEach(card => {
    card.addEventListener('click', () => openDetail(card));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openDetail(card); });
  });
  detailClose.addEventListener('click', closeDetail);
  detailBg.addEventListener('click', closeDetail);

  /* ── CHAT ─────────────────────────────────────────────── */
  const overlay  = document.getElementById('chatOverlay');
  const closeBtn = document.getElementById('chatCloseBtn');
  const msgs     = document.getElementById('chatMessages');
  const input    = document.getElementById('chatInput');
  const sendBtn  = document.getElementById('chatSend');
  const inputBar = document.getElementById('chatInputBar');

  function openChat() {
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    setTimeout(() => input.focus(), 380);
  }
  function closeChat() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    input.blur();
  }
  document.getElementById('abAI').addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);

  /* keyboard inset */
  if (window.visualViewport) {
    const BASE_PAD = 10;
    function onVpChange() {
      const kb = Math.max(0, window.innerHeight - window.visualViewport.offsetTop - window.visualViewport.height);
      inputBar.style.paddingBottom = (kb > 0 ? kb : BASE_PAD) + 'px';
      if (kb > 0) msgs.scrollTop = msgs.scrollHeight;
    }
    window.visualViewport.addEventListener('resize', onVpChange);
    window.visualViewport.addEventListener('scroll', onVpChange);
  }

  const MASA_ID        = ${JSON.stringify(masaId)};        // server-injected
  const RESTAURANT_ID  = ${JSON.stringify(restKey)};       // server-injected
  const MASA_PREFIX    = ${JSON.stringify(masaPrefix)};    // server-injected
  const SESSION_KEY    = RESTAURANT_ID + '_masa';
  let _masaId = sessionStorage.getItem(SESSION_KEY) ||
                MASA_ID.replace(new RegExp('^' + MASA_PREFIX + '-', 'i'), '');

  /* ── TOAST ────────────────────────────────────────────── */
  let _toastTimer = null;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ── MASA SELECTOR ───────────────────────────────────── */
  const masaBgEl    = document.getElementById('masaBg');
  const masaSheetEl = document.getElementById('masaSheet');

  function openMasaSheet() {
    document.querySelectorAll('.masa-num-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.num === String(_masaId));
    });
    masaBgEl.classList.add('open');
    masaSheetEl.classList.add('open');
    masaSheetEl.removeAttribute('aria-hidden');
  }
  function closeMasaSheet() {
    masaBgEl.classList.remove('open');
    masaSheetEl.classList.remove('open');
    masaSheetEl.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('masaCloseBtn').addEventListener('click', closeMasaSheet);
  masaBgEl.addEventListener('click', closeMasaSheet);

  document.querySelectorAll('.masa-num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _masaId = btn.dataset.num;
      sessionStorage.setItem(SESSION_KEY, _masaId);
      closeMasaSheet();
      showToast('Masa ' + _masaId + ' seçildi ✓');
    });
  });

  /* ── GARSON & HESAP ──────────────────────────────────── */
  async function sendNotify(type) {
    try {
      await fetch('/api/order/notify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ masaId: _masaId, type }),
      });
    } catch {}
    showToast('Talebiniz iletildi ✓');
  }
  /* ── ADISYON (header) ────────────────────────────────── */
  document.getElementById('adisyonBtn').addEventListener('click', () => sendNotify('hesap'));

  /* ── RATE (header) ────────────────────────────────────── */
  document.getElementById('rateBtn').addEventListener('click', openRating);

  document.getElementById('abGarson').addEventListener('click', () => sendNotify('garson'));

  /* ── FEEDBACK MODAL ───────────────────────────────────── */
  const feedbackBg    = document.getElementById('feedbackBg');
  const feedbackSheet = document.getElementById('feedbackSheet');

  function openFeedback() {
    feedbackBg.classList.add('open');
    feedbackSheet.classList.add('open');
    feedbackSheet.removeAttribute('aria-hidden');
    feedbackBg.removeAttribute('aria-hidden');
    setTimeout(() => document.getElementById('fbName').focus(), 320);
  }
  function closeFeedback() {
    feedbackBg.classList.remove('open');
    feedbackSheet.classList.remove('open');
    feedbackSheet.setAttribute('aria-hidden', 'true');
    feedbackBg.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('feedbackClose').addEventListener('click', closeFeedback);
  feedbackBg.addEventListener('click', closeFeedback);

  document.getElementById('fbSubmit').addEventListener('click', async () => {
    const name    = document.getElementById('fbName').value.trim();
    const phone   = document.getElementById('fbPhone').value.trim();
    const message = document.getElementById('fbMessage').value.trim();
    if (!name || !message) { showToast('Ad ve mesaj alanları zorunludur'); return; }
    const btn = document.getElementById('fbSubmit');
    btn.disabled = true;
    btn.textContent = 'Gönderiliyor…';
    try {
      await fetch('/api/feedback-form', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, phone, message, masaId: _masaId }),
      });
      closeFeedback();
      document.getElementById('fbName').value    = '';
      document.getElementById('fbPhone').value   = '';
      document.getElementById('fbMessage').value = '';
      showToast('Geri bildiriminiz iletildi ✓');
    } catch {
      showToast('Bağlantı hatası, tekrar deneyin');
    } finally {
      btn.disabled = false;
      btn.textContent = 'İlet';
    }
  });

  /* ── RATING MODAL ─────────────────────────────────────── */
  const ratingBg      = document.getElementById('ratingBg');
  const ratingSheet   = document.getElementById('ratingSheet');
  const ratingHint    = document.getElementById('ratingHint');
  const ratingActions = document.getElementById('ratingActions');
  const starBtns      = Array.from(document.querySelectorAll('.star-btn'));
  const RATING_HINTS  = ['', 'Çok kötü 😟', 'Kötü 😕', 'Orta 🙂', 'İyi 😊', 'Mükemmel 🤩'];
  let _selectedStar   = 0;

  function openRating() {
    _selectedStar = 0;
    starBtns.forEach(b => b.classList.remove('lit'));
    ratingHint.textContent = 'Deneyiminizi değerlendirin';
    ratingActions.style.display = 'none';
    ratingBg.classList.add('open');
    ratingSheet.classList.add('open');
    ratingSheet.removeAttribute('aria-hidden');
    ratingBg.removeAttribute('aria-hidden');
  }
  function closeRating() {
    ratingBg.classList.remove('open');
    ratingSheet.classList.remove('open');
    ratingSheet.setAttribute('aria-hidden', 'true');
    ratingBg.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('ratingClose').addEventListener('click', closeRating);
  ratingBg.addEventListener('click', closeRating);

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      _selectedStar = parseInt(btn.dataset.val, 10);
      starBtns.forEach(b => b.classList.toggle('lit', parseInt(b.dataset.val, 10) <= _selectedStar));
      ratingHint.textContent = RATING_HINTS[_selectedStar] ?? '';
      if (_selectedStar <= 3) {
        closeRating();
        setTimeout(openFeedback, 350);
      } else {
        ratingHint.textContent = 'Google profilimizde değerlendirme yapmak ister misiniz?';
        ratingActions.style.display = 'flex';
      }
    });
  });

  document.getElementById('ratingYes').addEventListener('click', () => {
    window.open('https://g.page/r/PLACEHOLDER/review', '_blank', 'noopener');
    closeRating();
  });
  document.getElementById('ratingNo').addEventListener('click', closeRating);

  function addMsg(text, role) {
    const el = document.createElement('div');
    el.className = 'msg ' + role;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    addMsg(text, 'user');
    const thinking = addMsg('…', 'bot thinking');
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, restaurantId: 'rest-01', tableNumber: _masaId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error('[Chat error]', res.status, JSON.stringify(data));
        thinking.textContent = data.error ?? 'Bir hata oluştu.';
      } else {
        thinking.textContent = data.data?.reply ?? data.reply ?? 'Yanıt alınamadı.';
      }
      thinking.classList.remove('thinking');
    } catch {
      thinking.textContent = 'Bağlantı hatası, lütfen tekrar deneyin.';
      thinking.classList.remove('thinking');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  /* ── CATEGORY NAV ─────────────────────────────────────── */
  const pills      = Array.from(document.querySelectorAll('.nav-pill'));
  const menuScroll = document.getElementById('menuContent');

  function setActivePill(id) {
    pills.forEach(p => p.classList.toggle('active', p.dataset.target === id));
    const ap = document.querySelector('.nav-pill.active');
    if (ap) ap.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const sec = document.getElementById(pill.dataset.target);
      if (sec) menuScroll.scrollTo({ top: sec.offsetTop - 12, behavior: 'smooth' });
    });
  });

  const sections = Array.from(document.querySelectorAll('.menu-section[id]'));
  if (sections.length > 0) {
    setActivePill(sections[0].id);
    const observer = new IntersectionObserver(
      entries => {
        const vis = entries.filter(e => e.isIntersecting);
        if (vis.length) setActivePill(vis[0].target.id);
      },
      { root: menuScroll, rootMargin: '-8% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach(s => observer.observe(s));
  }
</script>
</body>
</html>`;
}


  /* ════════════════════════════════════════════════════════════════
     GÜNEŞIN SOFRASI MEYHANE — Custom Page Renderer
     ════════════════════════════════════════════════════════════════ */

  function gsEsc(s: string): string {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function gsCatSlug(cat: string): string {
    return "s-" + cat.toLowerCase()
      .replace(/ğ/g,"g").replace(/[üÜ]/g,"u").replace(/[şŞ]/g,"s")
      .replace(/[ıİ]/g,"i").replace(/[öÖ]/g,"o").replace(/[çÇ]/g,"c")
      .replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
  }

  function parseRakiPrices(desc: string): string {
    // Format: "20cl 950₺ · 35cl 1.470₺ · 70cl 2.500₺"
    return desc.split(/\s*·\s*/).map(part => {
      part = part.trim();
      if (!part) return "";
      const lastSpace = part.lastIndexOf(" ");
      if (lastSpace < 0) return "";
      const size      = part.substring(0, lastSpace).trim();
      const priceRaw  = part.substring(lastSpace + 1).trim();
      // Parse numeric: remove thousand separators (.) and ₺
      const numeric   = parseInt(priceRaw.replace(/\./g, "").replace(/[^\d]/g, ""), 10) || 0;
      return `<button class="rp-btn" data-size="${gsEsc(size)}" data-price="${numeric}">
    <span class="rp-size">${gsEsc(size)}</span>
    <span class="rp-price">${gsEsc(priceRaw)}</span>
  </button>`;
    }).filter(Boolean).join("");
  }

  function renderGsDish(dish: Dish, catType: "fix" | "raki" | "standard"): string {
    if (catType === "fix") return `<div class="gs-fix-card">
    <div class="fix-badge">FIX MENÜ</div>
    <div class="fix-name">${gsEsc(dish.name)}</div>
    <div class="fix-price">${dish.price > 0 ? dish.price.toLocaleString("tr-TR") + " ₺" : "Fiyat için görüşünüz"}</div>
    <div class="fix-desc">${gsEsc(dish.description)}</div>
    ${dish.price > 0 ? `<button class="gs-add-btn" data-id="${gsEsc(dish.id)}" data-name="${gsEsc(dish.name)}" data-price="${dish.price}">+</button>` : ""}
  </div>`;
    if (catType === "raki") return `<div class="gs-raki-card" data-raki-id="${gsEsc(dish.id)}" data-raki-name="${gsEsc(dish.name)}">
    <div class="raki-name">${gsEsc(dish.name)}</div>
    <div class="raki-prices">${parseRakiPrices(dish.description)}</div>
  </div>`;
    return `<div class="gs-std-card">
    <div class="std-body">
      <div class="std-name">${gsEsc(dish.name)}</div>
      ${dish.price > 0 ? `<div class="std-price">${dish.price.toLocaleString("tr-TR")} ₺</div>` : `<div class="std-pna">Fiyat için garsonla görüşünüz</div>`}
      ${dish.description ? `<div class="std-desc">${gsEsc(dish.description)}</div>` : ""}
    </div>
    ${dish.price > 0 ? `<button class="gs-add-btn" data-id="${gsEsc(dish.id)}" data-name="${gsEsc(dish.name)}" data-price="${dish.price}">+</button>` : ""}
  </div>`;
  }

  function renderGunesinPage(masaId: string): string {
    const menu        = menus.get("gunesin-sofrasi")!;
    const displayN    = masaId.replace(/^gunesin-/i, "");

    const CAT_ORDER = [
      "Fix Menü","Soğuk Mezeler","Deniz Mezeleri","Günün Mezeleri",
      "Ara Sıcaklar","Ana Yemekler (Deniz)","Ana Yemekler (Et)",
      "Salatalar","Tatlı & Meyve","Rakı",
      "Şarap (Kırmızı)","Şarap (Beyaz)","Şarap (Rosé)","Meşrubatlar",
    ];
    const CAT_RENAME: Record<string,string> = { "İçecekler": "Meşrubatlar" };

    const byCategory: Record<string, Dish[]> = {};
    for (const dish of menu.dishes) {
      if (dish.available === false) continue;
      const cat = CAT_RENAME[dish.category] ?? dish.category;
      (byCategory[cat] ??= []).push(dish);
    }
    const orderedCats = [
      ...CAT_ORDER.filter(c => byCategory[c]),
      ...Object.keys(byCategory).filter(c => !CAT_ORDER.includes(c)),
    ];

    const navPills = orderedCats.map(c =>
      `<button class="gs-pill" data-cat="${gsCatSlug(c)}">${gsEsc(c)}</button>`
    ).join("");

    const menuSections = orderedCats.map(c => {
      const isFix  = c === "Fix Menü";
      const isRaki = c === "Rakı";
      const cards  = byCategory[c].map(d => renderGsDish(d, isFix ? "fix" : isRaki ? "raki" : "standard")).join("\n");
      return `<section class="gs-section" id="${gsCatSlug(c)}">
    <h2 class="gs-cat-title">${gsEsc(c)}</h2>
    <div class="${isFix ? "gs-fix-grid" : isRaki ? "gs-raki-grid" : "gs-std-grid"}">${cards}</div>
  </section>`;
    }).join("\n");

    return `<!DOCTYPE html>
  <html lang="tr">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, interactive-widget=resizes-visual">
  <meta name="theme-color" content="#FDF6EC">
  <title>Güneşin Sofrası · Masa ${gsEsc(displayN)}</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☀️</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#F6F1E8;--card:#FFFCF7;--cb:#E1D5C4;
    --pri:#6E4131;--acc:#9A6D4A;--gold:#B88D56;--blue:#36485E;
    --txt:#2B211A;--muted:#7A6756;
    --font-serif:'Playfair Display',serif;
    --font-sans:'Inter','Nunito',sans-serif;
    --hh:130px;--nh:50px;--bh:60px;
  }
  html,body{height:100%;color:var(--txt);font-family:var(--font-sans);overflow-x:hidden}
  body{
    background-color:var(--bg);
    background-image:
      radial-gradient(circle at 10% 8%, rgba(255,255,255,.5) 0, rgba(255,255,255,0) 32%),
      radial-gradient(circle at 90% 92%, rgba(120,88,62,.05) 0, rgba(120,88,62,0) 36%),
      linear-gradient(180deg, rgba(255,255,255,.34) 0%, rgba(255,255,255,0) 24%);
  }

  /* ── HEADER ── */
  #hdr{
    position:fixed;top:0;left:0;right:0;height:var(--hh);
    background:rgba(255,252,247,.92);border-bottom:1px solid rgba(110,65,49,.11);
    display:grid;grid-template-columns:1fr auto 1fr;align-items:center;
    padding:6px 0;z-index:200;
    box-shadow:0 2px 14px rgba(43,33,26,.06);
    backdrop-filter: blur(4px);
  }
  #hdrLeft{min-height:1px}
  #hdrRight{
    min-height:1px;display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-start;
    gap:4px;padding-top:8px;padding-right:8px;
  }
  #hdrCenter{
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
    position:relative;z-index:1;opacity:1;
  }
  #gsLogoLink{
    display:inline-flex;align-items:center;justify-content:center;
    border-radius:12px;cursor:pointer;
    transition:transform .15s ease,opacity .15s ease;
    -webkit-tap-highlight-color:transparent;
  }
  #gsLogoLink:hover{opacity:.9;transform:scale(1.02)}
  #gsLogoLink:active{opacity:.85;transform:scale(.98)}
  #gsLogo{height:75px;width:75px;max-width:75px;max-height:75px;object-fit:contain;display:block}
  #gsText{height:30px;width:auto;max-width:180px;object-fit:contain;display:block}

  /* ── CAT NAV ── */
  #catNav{
    position:fixed;top:var(--hh);left:0;right:0;height:var(--nh);
    background:#FBF6EE;border-bottom:1px solid rgba(110,65,49,.08);
    overflow-x:auto;white-space:nowrap;display:flex;align-items:center;gap:8px;padding:0 16px;
    scrollbar-width:none;-webkit-overflow-scrolling:touch;z-index:100;
  }
  #catNav::-webkit-scrollbar{display:none}
  .gs-pill{
    flex-shrink:0;padding:6px 14px;border-radius:18px;
    border:1px solid rgba(122,103,86,.22);background:rgba(255,255,255,.8);
    color:var(--muted);font-family:var(--font-sans);font-size:12px;font-weight:500;
    cursor:pointer;transition:all .18s;-webkit-tap-highlight-color:transparent;
  }
  .gs-pill.active{background:#5C3B2F;border-color:#5C3B2F;color:#fff}

  /* ── MAIN CONTENT ── */
  #menuContent{
    margin-top:calc(var(--hh) + var(--nh));
    padding:22px 16px 32px;
    height:calc(100dvh - var(--hh) - var(--nh) - var(--bh));
    overflow-y:auto;-webkit-overflow-scrolling:touch;
  }
  .gs-section{margin-bottom:34px}
  .gs-cat-title{
    font-family:var(--font-serif);font-size:22px;font-weight:500;
    color:var(--pri);margin-bottom:14px;padding-bottom:8px;
    border-bottom:1px solid rgba(110,65,49,.18);
  }

  /* ── RATING BUTTON ── */
  #ratingBtn{
    width:auto;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
    padding:4px 8px;background:transparent;border:1px solid #D4890A;border-radius:16px;
    color:#D4890A;font-size:9px;font-weight:700;letter-spacing:.5px;cursor:pointer;
    -webkit-tap-highlight-color:transparent;transition:background .15s,opacity .15s;
  }
  #ratingBtn:active{background:#F6ECDE;opacity:.95}
  .rt-stars{font-size:7px;color:#f5b700;line-height:1;letter-spacing:0}
  .rt-hint{font-size:7px;font-weight:700;color:#D4890A;letter-spacing:.3px;text-transform:uppercase;white-space:nowrap;line-height:1}

  #gsQuoteWrap{padding:16px 20px;background:var(--bg);text-align:center}
  #gsQuote{
    max-width:90%;width:auto;height:auto;max-height:100px;object-fit:contain;
    display:block;margin:0 auto;opacity:.85;
  }

  /* ── STANDARD CARD ── */
  .gs-std-grid{display:flex;flex-direction:column;gap:12px}
  .gs-std-card{
    background:var(--card);border:none;border-radius:8px;
    padding:15px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;
    box-shadow:0 5px 16px rgba(43,33,26,.045);
  }
  .std-body{flex:1;min-width:0}
  .std-name{font-family:var(--font-serif);font-size:17px;font-weight:600;color:var(--txt);margin-bottom:5px;line-height:1.3}
  .std-price{font-family:var(--font-sans);font-size:14px;font-weight:600;color:var(--gold);margin-bottom:6px}
  .std-pna{font-family:var(--font-sans);font-size:12px;color:var(--muted);font-style:italic;margin-bottom:6px}
  .std-desc{font-family:var(--font-sans);font-size:12px;color:var(--muted);line-height:1.58}
  .gs-add-btn{
    flex-shrink:0;width:30px;height:30px;border-radius:50%;
    border:1.25px solid rgba(154,109,74,.5);background:rgba(255,255,255,.78);color:var(--acc);
    font-size:19px;font-weight:600;display:flex;align-items:center;justify-content:center;
    cursor:pointer;align-self:center;-webkit-tap-highlight-color:transparent;
  }
  .gs-add-btn:active{background:#E8D9C7;color:#5E412A}

  /* ── FIX CARD ── */
  .gs-fix-grid{display:flex;flex-direction:column;gap:14px}
  .gs-fix-card{
    background:linear-gradient(135deg,#FFFCF7,#F8F0E3);
    border:none;border-radius:10px;
    padding:16px 16px 54px;position:relative;overflow:hidden;
    box-shadow:0 6px 18px rgba(43,33,26,.06);
  }
  .fix-badge{
    display:inline-block;background:#B08A57;color:#fff;
    font-size:9px;font-weight:800;letter-spacing:.14em;padding:3px 8px;
    border-radius:4px;margin-bottom:10px;text-transform:uppercase;
  }
  .fix-name{font-family:var(--font-serif);font-size:19px;font-weight:700;color:var(--txt);margin-bottom:6px}
  .fix-price{font-family:var(--font-sans);font-size:22px;font-weight:700;color:var(--gold);margin-bottom:9px}
  .fix-desc{font-family:var(--font-sans);font-size:12px;color:var(--muted);line-height:1.6}
  .gs-fix-card .gs-add-btn{position:absolute;bottom:14px;right:14px;border-color:var(--gold);color:var(--gold)}

  /* ── RAKI CARD ── */
  .gs-raki-grid{display:flex;flex-direction:column;gap:12px}
  .gs-raki-card{background:var(--card);border:none;border-radius:8px;padding:15px 16px;box-shadow:0 5px 16px rgba(43,33,26,.045)}
  .raki-name{font-family:var(--font-serif);font-size:17px;font-weight:600;color:var(--txt);margin-bottom:10px}
  .raki-prices{display:flex;flex-direction:column;gap:7px}
  .rp-btn{
    display:flex;flex-direction:row;justify-content:space-between;align-items:center;width:100%;
    background:#F7F0E4;border:1px solid rgba(122,103,86,.18);border-radius:6px;
    padding:10px 14px;cursor:pointer;transition:background .15s,border-color .15s;-webkit-tap-highlight-color:transparent;
  }
  .rp-btn.rp-added{background:#B08A57;border-color:#B08A57}
  .rp-btn.rp-added .rp-size,.rp-btn.rp-added .rp-price{color:#fff}
  .rp-size{font-size:12px;font-weight:600;color:#8A6740;text-transform:uppercase;letter-spacing:.04em}
  .rp-price{font-size:13px;font-weight:600;color:var(--txt)}

  /* ── BOTTOM BAR ── */
  #bar{
    position:fixed;bottom:0;left:0;right:0;height:60px;
    background:#F2EBDD;border-top:1px solid rgba(110,65,49,.14);
    display:flex !important;flex-direction:column;gap:0;
    padding:0;margin:0;
    z-index:99999 !important;box-shadow:0 -6px 18px rgba(43,33,26,.11);
    visibility:visible !important;
    pointer-events:auto;
    opacity:0.999 !important;
    -webkit-backface-visibility:hidden;
    backface-visibility:hidden;
    contain:layout style paint;
    -webkit-transform:translate3d(0,0,0);
    transform:translate3d(0,0,0);
    isolation:isolate;
  }
  #barActions{display:grid;grid-template-columns:1fr 1fr;gap:0;width:100%;height:100%;pointer-events:auto}
  .bar-btn{
    border-radius:0;border:none;color:#F4EEE6;
    font-family:var(--font-sans);font-size:14px;font-weight:600;
    height:100%;padding:0 8px;display:flex;align-items:center;justify-content:center;gap:4px;
    cursor:pointer !important;-webkit-tap-highlight-color:transparent;transition:opacity .15s,transform .15s;
    pointer-events:auto !important;position:relative;z-index:10 !important;opacity:1 !important;
    -webkit-transform:translate3d(0,0,0);
    transform:translate3d(0,0,0);
  }
  .bar-btn:active{opacity:.9;transform:translateY(1px)}
  .bar-icon{font-size:11px;line-height:1}
  #garsonBtn{background:linear-gradient(180deg,#384D67,#2F435A)}
  #hesapBtn{background:linear-gradient(180deg,#6F4535,#603A2D)}

  /* ── FABS ── */
  #cartFab{
    position:fixed;bottom:calc(var(--bh) + 14px);right:16px;
    width:50px;height:50px;border-radius:50%;
    max-width:50px;max-height:50px;min-width:0;min-height:0;
    padding:0;margin:0;overflow:hidden;contain:layout paint;
    background:var(--acc);border:none;
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;box-shadow:0 3px 12px rgba(232,107,46,.45);z-index:140;
    pointer-events:none;touch-action:manipulation;
    -webkit-tap-highlight-color:transparent;
  }
  #cartFab > span{pointer-events:auto}
  #cartBadge{font-size:20px;line-height:1;pointer-events:auto;user-select:none}
  #aiFab{
    position:fixed;bottom:calc(var(--bh) + 74px);right:16px;
    width:52px;height:52px;border-radius:50%;
    max-width:52px;max-height:52px;min-width:0;min-height:0;
    padding:0;margin:0;overflow:hidden;contain:layout paint;
    background:#1c1c3e;border:1.5px solid #3d3d7a;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    cursor:pointer;box-shadow:0 3px 14px rgba(0,0,0,.3);z-index:140;
    font-size:10px;font-weight:800;color:#fff;line-height:1.2;text-align:center;
    gap:1px;-webkit-tap-highlight-color:transparent;
    pointer-events:none;touch-action:manipulation;
  }
  #aiFab > span{pointer-events:auto}
  /* Floating FAB wrappers should not block taps outside icon glyphs */
  #cartFab,#aiFab{pointer-events:none}
  #cartFab > *,#aiFab > *{pointer-events:auto}

  @supports (-webkit-touch-callout: none) {
    #bar, .bar-btn, #barActions, .barActions {
      opacity: 0.999 !important;
      -webkit-transform: translate3d(0,0,0) !important;
      transform: translate3d(0,0,0) !important;
      isolation: isolate !important;
      contain: layout style paint !important;
    }
  }

  /* ── TOAST ── */
  #toast{
    position:fixed;bottom:calc(var(--bh) + 142px);left:50%;
    transform:translateX(-50%) translateY(16px);
    background:#2C1810;color:#FDF6EC;
    padding:10px 20px;border-radius:24px;font-size:13px;font-weight:600;
    white-space:nowrap;opacity:0;transition:opacity .25s,transform .25s;
    z-index:400;pointer-events:none;
  }
  #toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

  /* ── OVERLAYS ── */
  #cartOverlay,#aiOverlay,#ratingOverlay,#feedbackOverlay{
    position:fixed;inset:0;background:rgba(0,0,0,.45);
    opacity:0;pointer-events:none;transition:opacity .25s;z-index:300;
  }
  #cartOverlay.v,#aiOverlay.v,#ratingOverlay.v,#feedbackOverlay.v{opacity:1;pointer-events:auto}

  /* ── CART DRAWER ── */
  #cartDrawer{
    position:fixed;top:0;right:0;bottom:0;width:min(340px,92vw);
    background:#fff;border-left:1px solid var(--cb);
    transform:translateX(110%);transition:transform .3s cubic-bezier(.4,0,.2,1);
    z-index:310;display:flex;flex-direction:column;
    box-shadow:-4px 0 20px rgba(44,24,16,.1);
  }
  #cartDrawer.open{transform:translateX(0)}
  .cd-head{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--cb)}
  .cd-head h2{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--pri)}
  #cartClose{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:2px 6px;line-height:1}
  #cartItems{flex:1;overflow-y:auto;padding:10px 16px}
  .c-empty{color:var(--muted);font-size:14px;text-align:center;margin-top:28px}
  .c-item{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #F0E8D8;gap:6px}
  .c-name{font-size:13px;color:var(--txt);flex:1}
  .c-price{font-size:13px;font-weight:700;color:var(--gold);white-space:nowrap}
  .c-qty{display:flex;align-items:center;gap:4px}
  .c-btn{width:24px;height:24px;border-radius:50%;border:1px solid var(--acc);background:none;color:var(--acc);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
  .cd-foot{padding:14px 16px;border-top:1px solid var(--cb)}
  .cd-total{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:14px;color:var(--muted)}
  #cartTotal{font-size:18px;font-weight:800;color:var(--gold)}
  #orderBtn{
    width:100%;height:46px;border-radius:10px;
    background:var(--pri);border:none;color:#fff;
    font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;cursor:pointer;
    transition:opacity .15s;-webkit-tap-highlight-color:transparent;
  }
  #orderBtn:disabled{background:#D4B8A8;cursor:default}

  /* ── AI DRAWER ── */
  #aiDrawer{
    position:fixed;left:0;right:0;bottom:0;
    background:#fff;border-radius:16px 16px 0 0;
    display:flex;flex-direction:column;
    height:auto;min-height:50vh;max-height:85dvh;max-height:85vh;
    overflow:hidden;
    transform:translateY(110%);transition:transform .3s ease;z-index:310;
  }
  #aiDrawer.open{transform:translateY(0)}
  .ai-head{flex-shrink:0;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #eee}
  .ai-head-l{display:flex;align-items:center;gap:10px}
  .ai-av-icon{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#9B59B6,#6C3483);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
  .ai-n{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--pri)}
  .ai-s{font-size:11px;color:var(--muted)}
  #aiClose{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:2px 6px;line-height:1}
  #aiMessages{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px}
  .ai-msg{display:flex;gap:8px;align-items:flex-end}
  .ai-msg.user{flex-direction:row-reverse}
  .ai-av{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#9B59B6,#6C3483);display:flex;align-items:center;justify-content:center;font-size:14px}
  .ai-bubble{max-width:78%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;color:var(--txt)}
  .ai-bubble.bot{background:#F3E8FF;border-bottom-left-radius:4px}
  .ai-bubble.user{background:var(--blue);color:#fff;border-bottom-right-radius:4px}
  #aiInputRow{flex-shrink:0;display:flex;gap:8px;padding:10px 12px;border-top:1px solid #eee;background:#fff}
  #aiInput{
    flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:20px;
    font-size:14px;outline:none;font-family:'Nunito',sans-serif;resize:none;max-height:80px;overflow-y:auto;
  }
  #aiSend{
    flex-shrink:0;width:44px;height:44px;border-radius:50%;
    background:var(--acc);border:none;color:#fff;font-size:18px;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    -webkit-tap-highlight-color:transparent;
  }

  /* ── RATING MODAL ── */
  #ratingModal{
    position:fixed;bottom:0;left:0;right:0;
    background:#fff;border-radius:20px 20px 0 0;border-top:2px solid var(--cb);
    padding:0 0 max(20px,env(safe-area-inset-bottom));
    transform:translateY(110%);transition:transform .32s cubic-bezier(.25,.46,.45,.94);z-index:310;
  }
  #ratingModal.open{transform:translateY(0)}
  .rm-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px 14px;border-bottom:1px solid var(--cb)}
  .rm-head h3{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--pri)}
  #ratingClose{background:#F5EFE8;border:none;color:var(--muted);font-size:14px;width:30px;height:30px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}
  .star-row{display:flex;justify-content:center;gap:6px;padding:18px 0 6px}
  .gs-star{background:none;border:none;font-size:40px;cursor:pointer;color:#D4B8A8;transition:color .12s;line-height:1;padding:4px;-webkit-tap-highlight-color:transparent}
  .gs-star.lit{color:#F0A500}
  #ratingHint{text-align:center;font-size:13px;color:var(--muted);min-height:20px;margin-bottom:14px;padding:0 18px}
  #ratingGmaps{text-align:center;font-size:13.5px;color:var(--txt);padding:0 18px 12px;line-height:1.55;display:none}
  #ratingActions{gap:10px;padding:0 18px 6px;display:none}
  .ra-btn{
    flex:1;height:44px;border-radius:11px;border:1.5px solid var(--cb);background:#FFF8F0;
    color:var(--txt);font-family:'Nunito',sans-serif;font-size:14px;font-weight:600;
    cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;
    -webkit-tap-highlight-color:transparent;
  }
  .ra-btn.primary{background:#4285F4;border-color:#4285F4;color:#fff}

  /* ── FEEDBACK MODAL ── */
  #feedbackModal{
    position:fixed;bottom:0;left:0;right:0;
    background:#fff;border-radius:20px 20px 0 0;border-top:2px solid var(--cb);
    max-height:90vh;overflow-y:auto;
    transform:translateY(110%);transition:transform .32s cubic-bezier(.25,.46,.45,.94);z-index:310;
    padding-bottom:max(20px,env(safe-area-inset-bottom));
  }
  #feedbackModal.open{transform:translateY(0)}
  .fm-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px 14px;border-bottom:1px solid var(--cb);position:sticky;top:0;background:#fff;z-index:1}
  .fm-head h3{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--pri)}
  #feedbackClose{background:#F5EFE8;border:none;color:var(--muted);font-size:14px;width:30px;height:30px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}
  .fm-body{padding:16px 18px 0}
  .fm-field{margin-bottom:12px}
  .fm-field label{display:block;font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
  .fm-field input,.fm-field textarea{
    width:100%;background:#FFF8F0;border:1.5px solid var(--cb);border-radius:10px;
    color:var(--txt);font-family:'Nunito',sans-serif;font-size:15px;padding:11px 13px;
    outline:none;transition:border-color .15s;
  }
  .fm-field input:focus,.fm-field textarea:focus{border-color:var(--acc)}
  .fm-field textarea{resize:none;height:88px;line-height:1.45}
  #feedbackSubmit{
    width:100%;height:46px;border-radius:12px;
    background:var(--pri);border:none;color:#fff;
    font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;
    cursor:pointer;margin-top:4px;-webkit-tap-highlight-color:transparent;
  }
  #feedbackSubmit:disabled{opacity:.35;cursor:not-allowed}
  </style>
  </head>
  <body>

  <!-- HEADER -->
  <header id="hdr">
    <div id="hdrLeft"></div>
    <div id="hdrCenter">
      <a id="gsLogoLink" href="https://www.instagram.com/gunesinsofrasimeyhane?igsh=MWRib2w4OGNuMmhtZg==" target="_blank" rel="noopener noreferrer" aria-label="Güneşin Sofrası Instagram">
        <img id="gsLogo" src="/assets/img/gunesin-sun.png" alt="Güneşin Sofrası" loading="eager">
      </a>
    </div>
    <div id="hdrRight">
      <img id="gsText" src="/assets/img/gunesin-text.png" alt="Güneşin Sofrası Meyhane" loading="eager">
      <button id="ratingBtn">
        <span class="rt-stars">★★★★★</span>
        <span class="rt-hint">DENEYİMİNİZİ PAYLAŞIN</span>
      </button>
    </div>
  </header>

  <!-- CATEGORY NAV -->
  <nav id="catNav" aria-label="Menü kategorileri">
    ${navPills}
  </nav>

  <!-- MAIN CONTENT -->
  <main id="menuContent">
    ${menuSections}
  </main>

  <!-- TOAST -->
  <div id="toast" role="status" aria-live="polite"></div>

  <!-- CART FAB -->
  <button id="cartFab" aria-label="Sepeti Aç">
    <span id="cartBadge">🍽️</span>
  </button>

  <!-- AI FAB -->
  <button id="aiFab" aria-label="AI Gurme">
    <span>AI</span><span>Gurme</span>
  </button>

  <div id="gsQuoteWrap">
    <img id="gsQuote" src="/assets/img/gunesin-quote.png" alt="Güneşin Sofrası alıntı" loading="lazy">
  </div>

  <!-- CART OVERLAY + DRAWER -->
  <div id="cartOverlay"></div>
  <aside id="cartDrawer" role="dialog" aria-label="Sepet">
    <div class="cd-head">
      <h2>🍽️ Sipariş</h2>
      <button id="cartClose" aria-label="Kapat">✕</button>
    </div>
    <div id="cartItems"><p class="c-empty">Henüz ürün eklenmedi.</p></div>
    <div class="cd-foot">
      <div class="cd-total"><span>Toplam</span><span id="cartTotal">0 ₺</span></div>
      <button id="orderBtn" disabled>Siparişi Ver</button>
    </div>
  </aside>

  <!-- AI OVERLAY + DRAWER -->
  <div id="aiOverlay"></div>
  <div id="aiDrawer" role="dialog" aria-label="GurmeAI">
    <div class="ai-head">
      <div class="ai-head-l">
        <div class="ai-av-icon">👨‍🍳</div>
        <div>
          <div class="ai-n">GurmeAI</div>
          <div class="ai-s">Güneşin Sofrası Asistanı</div>
        </div>
      </div>
      <button id="aiClose" aria-label="Kapat">✕</button>
    </div>
    <div id="aiMessages"></div>
    <div id="aiInputRow">
      <textarea id="aiInput" placeholder="Menü hakkında soru sorun…" rows="1"></textarea>
      <button id="aiSend" aria-label="Gönder">➤</button>
    </div>
  </div>

  <!-- RATING OVERLAY + MODAL -->
  <div id="ratingOverlay"></div>
  <div id="ratingModal" role="dialog" aria-label="Bizi Puanlayın">
    <div class="rm-head">
      <h3>Bizi Puanlayın</h3>
      <button id="ratingClose" aria-label="Kapat">✕</button>
    </div>
    <div class="star-row">
      <button class="gs-star" data-v="1" aria-label="1 yıldız">★</button>
      <button class="gs-star" data-v="2" aria-label="2 yıldız">★</button>
      <button class="gs-star" data-v="3" aria-label="3 yıldız">★</button>
      <button class="gs-star" data-v="4" aria-label="4 yıldız">★</button>
      <button class="gs-star" data-v="5" aria-label="5 yıldız">★</button>
    </div>
    <p id="ratingHint">Deneyiminizi değerlendirin</p>
    <p id="ratingGmaps">Harika! Google profilimizde değerlendirme yapmak ister misiniz?</p>
    <div id="ratingActions">
      <button id="ratingNo" class="ra-btn">Hayır</button>
      <a id="ratingYes" class="ra-btn primary" href="https://share.google/tvnoLJvxZcTGn60vK" target="_blank" rel="noopener noreferrer">Evet, Değerlendir</a>
    </div>
  </div>

  <!-- FEEDBACK OVERLAY + MODAL -->
  <div id="feedbackOverlay"></div>
  <div id="feedbackModal" role="dialog" aria-label="Düşünceleriniz">
    <div class="fm-head">
      <h3>Düşünceleriniz</h3>
      <button id="feedbackClose" aria-label="Kapat">✕</button>
    </div>
    <div class="fm-body">
      <div class="fm-field">
        <label for="feedbackName">Ad Soyad *</label>
        <input id="feedbackName" type="text" placeholder="Adınız ve soyadınız" autocomplete="name">
      </div>
      <div class="fm-field">
        <label for="feedbackPhone">Cep Numarası</label>
        <input id="feedbackPhone" type="tel" placeholder="05xx xxx xx xx" autocomplete="tel">
      </div>
      <div class="fm-field">
        <label for="feedbackMsg">Mesajınız</label>
        <textarea id="feedbackMsg" placeholder="Görüş ve önerilerinizi yazın…"></textarea>
      </div>
      <button id="feedbackSubmit">İlet</button>
    </div>
  </div>

  <script>window.GS_TABLE = ${JSON.stringify(displayN)};</script>
  <script src="/assets/gunesin-menu.js?v=20260420-01" defer></script>
  <!-- BOTTOM BAR -->
  <div id="bar">
    <div id="barActions">
      <button id="garsonBtn" class="bar-btn"><span class="bar-icon">🖐️</span><span>Garson Çağır</span></button>
      <button id="hesapBtn"  class="bar-btn"><span class="bar-icon">🧾</span><span>Hesap İste</span></button>
    </div>
  </div>
  </body>
  </html>`;
  }
  
  router.get("/:masaId", (req: Request, res: Response) => {
    const { masaId } = req.params;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(masaId.startsWith("gunesin-") ? renderGunesinPage(masaId) : renderPage(masaId));
  });

  export default router;
  