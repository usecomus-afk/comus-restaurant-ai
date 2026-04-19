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
  return cat.toLowerCase()
    .replace(/ç/g,"c").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/ü/g,"u")
    .replace(/ö/g,"o").replace(/ı/g,"i").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

function parseRakiPrices(desc: string): string {
  return desc.split(" · ").map(p => {
    const sp       = p.trim().lastIndexOf(" ");
    const size     = (sp < 0 ? p.trim() : p.slice(0, sp).trim());
    const priceStr = sp < 0 ? "" : p.slice(sp + 1).trim();
    const priceNum = parseInt(priceStr.replace(/[^0-9]/g, ""), 10) || 0;
    return `<button class="rp-btn" data-size="${gsEsc(size)}" data-price="${priceNum}" type="button"><span class="rp-size">${gsEsc(size)}</span><span class="rp-price">${gsEsc(priceStr)}</span></button>`;
  }).join("");
}

function renderGsDish(dish: Dish, catType: "fix" | "raki" | "standard"): string {
  if (catType === "fix") {
    return `
<div class="gs-fix-card">
  <div class="fix-badge">FIX MENÜ</div>
  <div class="fix-name">${gsEsc(dish.name)}</div>
  <div class="fix-price">${dish.price > 0 ? dish.price.toLocaleString("tr-TR") + " ₺" : "Fiyat için görüşünüz"}</div>
  <div class="fix-desc">${gsEsc(dish.description)}</div>
  ${dish.price > 0 ? `<button class="gs-add-btn" data-id="${gsEsc(dish.id)}" data-name="${gsEsc(dish.name)}" data-price="${dish.price}" aria-label="Ekle">+</button>` : ""}
</div>`;
  }
  if (catType === "raki") {
    return `
<div class="gs-raki-card" data-raki-id="${gsEsc(dish.id)}" data-raki-name="${gsEsc(dish.name)}">
  <div class="raki-name">${gsEsc(dish.name)}</div>
  <div class="raki-prices">${parseRakiPrices(dish.description)}</div>
</div>`;
  }
  return `
<div class="gs-std-card">
  <div class="std-body">
    <div class="std-name">${gsEsc(dish.name)}</div>
    ${dish.price > 0 ? `<div class="std-price">${dish.price.toLocaleString("tr-TR")} ₺</div>` : `<div class="std-price-na">Fiyat için garsonla görüşünüz</div>`}
    ${dish.description ? `<div class="std-desc">${gsEsc(dish.description)}</div>` : ""}
    ${dish.spiceLevel ? `<span class="spice-badge">🌶️</span>` : ""}
  </div>
  ${dish.price > 0 ? `<button class="gs-add-btn" data-id="${gsEsc(dish.id)}" data-name="${gsEsc(dish.name)}" data-price="${dish.price}" aria-label="Masaya ekle">+</button>` : ""}
</div>`;
}

function renderGunesinPage(masaId: string): string {
  const restaurant = restaurants.get("gunesin-sofrasi")!;
  const menu       = menus.get("gunesin-sofrasi")!;
  const masaCount  = restaurant.masaCount;
  const displayMasaId = masaId.replace(/^gunesin-/i, "");

  const GS_CAT_ORDER = [
    "Fix Menü","Soğuk Mezeler","Deniz Mezeleri","Günün Mezeleri",
    "Ara Sıcaklar","Ana Yemekler (Deniz)","Ana Yemekler (Et)",
    "Salatalar","Tatlı & Meyve","Rakı",
    "Şarap (Kırmızı)","Şarap (Beyaz)","Şarap (Rosé)","Meşrubatlar",
  ];

  const GS_CAT_RENAME: Record<string, string> = { "İçecekler": "Meşrubatlar" };
  const byCategory: Record<string, Dish[]> = {};
  for (const dish of menu.dishes) {
    if (dish.available === false) continue;
    const displayCat = GS_CAT_RENAME[dish.category] ?? dish.category;
    (byCategory[displayCat] ??= []).push(dish);
  }
  const orderedCats = [
    ...GS_CAT_ORDER.filter(c => byCategory[c]),
    ...Object.keys(byCategory).filter(c => !GS_CAT_ORDER.includes(c)),
  ];

  const navPills = orderedCats.map(c =>
    `<button class="gs-pill" data-cat="${gsCatSlug(c)}">${gsEsc(c)}</button>`
  ).join("");

  const menuSections = orderedCats.map(c => {
    const dishes = byCategory[c];
    const isRaki = c === "Rakı";
    const isFix  = c === "Fix Menü";
    const cards  = dishes.map(d => renderGsDish(d, isFix ? "fix" : isRaki ? "raki" : "standard")).join("");
    return `
<section class="gs-section" id="${gsCatSlug(c)}">
  <h2 class="gs-cat-title">${gsEsc(c)}</h2>
  <div class="${isFix ? "gs-fix-grid" : isRaki ? "gs-raki-grid" : "gs-cards-grid"}">${cards}</div>
</section>`;
  }).join("");

  const masaGrid = Array.from({ length: masaCount }, (_, i) => i + 1)
    .map(n => `<button class="gs-masa-btn" data-num="${n}">${n}</button>`).join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
<meta name="theme-color" content="#FDF6EC">
<title>Güneşin Sofrası · Masa ${gsEsc(displayMasaId)}</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☀️</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#FDF6EC;--card:#FFFFFF;--card-b:#E8D5B7;
  --primary:#C0392B;--accent:#E86B2E;--gold:#D4890A;--blue:#2980B9;
  --text:#2C1810;--muted:#8B6347;--muted2:#B8956A;
  --hh:110px;--nh:50px;--bh:76px;
}
html,body{height:100%;background:var(--bg);color:var(--text);font-family:'Nunito',sans-serif;overflow-x:hidden}
body{padding-bottom:var(--bh)}

/* ── HEADER ── */
#gsHdr{
  position:fixed;top:0;left:0;right:0;height:var(--hh);
  background:#FFFFFF;border-bottom:1px solid var(--card-b);
  display:flex;align-items:center;justify-content:center;
  padding:8px 52px;z-index:200;
  box-shadow:0 1px 8px rgba(44,24,16,.07);
}
#gsLogoImg{height:120px;width:120px;object-fit:contain;display:block}
.gs-brand{display:flex;flex-direction:column;align-items:center;gap:2px}
.gs-brand-name{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--primary);letter-spacing:.04em}
.gs-brand-sub{font-size:10px;font-weight:800;color:var(--muted);letter-spacing:.22em;text-transform:uppercase}
#gsMasaBadge{
  position:absolute;top:50%;right:14px;transform:translateY(-50%);
  font-size:11px;font-weight:700;color:var(--muted);background:none;border:none;
  cursor:pointer;line-height:1.5;text-align:right
}

/* ── CAT NAV ── */
#gsCatNav{
  position:fixed;top:var(--hh);left:0;right:0;height:var(--nh);
  background:#FFF8F0;border-bottom:1px solid var(--card-b);
  overflow-x:auto;overflow-y:hidden;white-space:nowrap;
  display:flex;align-items:center;gap:7px;padding:0 12px;
  scrollbar-width:none;-webkit-overflow-scrolling:touch;z-index:100
}
#gsCatNav::-webkit-scrollbar{display:none}
.gs-pill{
  flex-shrink:0;padding:5px 13px;border-radius:20px;
  border:1px solid var(--card-b);background:#FFFFFF;
  color:var(--muted);font-family:'Nunito',sans-serif;
  font-size:12px;font-weight:600;cursor:pointer;transition:all .2s
}
.gs-pill.active{background:var(--primary);border-color:var(--primary);color:#fff}

/* ── CONTENT ── */
#gsContent{
  margin-top:calc(var(--hh) + var(--nh));
  padding:16px 12px 24px;
  height:calc(100dvh - var(--hh) - var(--nh) - var(--bh));
  overflow-y:auto;
}
.gs-section{margin-bottom:28px}
.gs-cat-title{
  font-family:'Playfair Display',serif;font-size:20px;font-weight:700;
  color:var(--primary);margin-bottom:12px;padding-bottom:7px;
  border-bottom:2px solid rgba(192,57,43,.15);letter-spacing:.02em
}

/* ── STANDARD CARD ── */
.gs-cards-grid{display:flex;flex-direction:column;gap:9px}
.gs-std-card{
  background:var(--card);border:1px solid var(--card-b);border-radius:10px;
  padding:12px 14px;display:flex;justify-content:space-between;
  align-items:flex-start;gap:10px;
  box-shadow:0 1px 4px rgba(44,24,16,.05);transition:border-color .2s,box-shadow .2s;
}
.gs-std-card:active{border-color:var(--accent);box-shadow:0 2px 8px rgba(232,107,46,.12)}
.std-body{flex:1;min-width:0}
.std-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--text);margin-bottom:3px;line-height:1.3}
.std-price{font-size:15px;font-weight:700;color:var(--gold);margin-bottom:4px}
.std-price-na{font-size:12px;color:var(--muted);font-style:italic;margin-bottom:4px}
.std-desc{font-size:12px;color:var(--muted);line-height:1.45}
.spice-badge{font-size:11px;display:inline-block;margin-top:3px}
.gs-add-btn{
  flex-shrink:0;width:32px;height:32px;border-radius:50%;
  border:1.5px solid var(--accent);background:transparent;color:var(--accent);
  font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .15s;align-self:center;line-height:1
}
.gs-add-btn:active{background:var(--accent);color:#fff;transform:scale(.88)}

/* ── FIX MENÜ CARD ── */
.gs-fix-grid{display:flex;flex-direction:column;gap:12px}
.gs-fix-card{
  background:linear-gradient(135deg,#FFFDF5 0%,#FFF9ED 100%);
  border:1.5px solid var(--gold);border-radius:14px;
  padding:16px 16px 52px;position:relative;overflow:hidden;
  box-shadow:0 2px 10px rgba(212,137,10,.1);
}
.gs-fix-card::before{
  content:'';position:absolute;top:-20px;right:-20px;
  width:90px;height:90px;pointer-events:none;
  background:radial-gradient(circle,rgba(212,137,10,.1) 0%,transparent 70%)
}
.fix-badge{
  display:inline-block;background:var(--gold);color:#fff;
  font-size:9px;font-weight:800;letter-spacing:.14em;padding:3px 8px;
  border-radius:4px;margin-bottom:10px;text-transform:uppercase
}
.fix-name{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--text);margin-bottom:5px}
.fix-price{font-size:24px;font-weight:800;color:var(--gold);margin-bottom:8px}
.fix-desc{font-size:12px;color:var(--muted);line-height:1.55}
.gs-fix-card .gs-add-btn{position:absolute;bottom:14px;right:14px;border-color:var(--gold);color:var(--gold)}
.gs-fix-card .gs-add-btn:active{background:var(--gold);color:#fff}

/* ── RAKI CARD ── */
.gs-raki-grid{display:flex;flex-direction:column;gap:10px}
.gs-raki-card{
  background:var(--card);border:1px solid var(--card-b);
  border-radius:10px;padding:12px 14px;
  box-shadow:0 1px 4px rgba(44,24,16,.05);
}
.raki-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--text);margin-bottom:9px}
.raki-prices{display:grid;grid-template-columns:repeat(auto-fill,minmax(68px,1fr));gap:5px 7px}
.rp-btn{
  display:flex;flex-direction:column;align-items:center;
  background:#FFF3E8;border:1px solid rgba(212,137,10,.3);
  border-radius:6px;padding:6px 5px;cursor:pointer;
  transition:background .15s,border-color .15s,transform .1s;
}
.rp-btn:active,.rp-btn:hover{background:#FFE8CC;border-color:var(--accent);transform:scale(.96)}
.rp-btn.rp-added{background:#d4890a;border-color:#d4890a}.rp-btn.rp-added .rp-size,.rp-btn.rp-added .rp-price{color:#fff}
.rp-size{font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.03em}
.rp-price{font-size:12px;font-weight:700;color:var(--text)}

/* ── BOTTOM BAR ── */
#gsBar{
  position:fixed;bottom:0;left:0;right:0;height:var(--bh);
  background:#FFFFFF;border-top:1px solid var(--card-b);
  display:grid;grid-template-columns:1fr 1fr;gap:10px;
  padding:10px 14px;padding-bottom:max(10px,env(safe-area-inset-bottom));z-index:200;
  box-shadow:0 -2px 10px rgba(44,24,16,.07);
}
.gs-bar-btn{
  border-radius:10px;border:none;color:#fff;
  font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;
  display:flex;align-items:center;justify-content:center;gap:6px;
  cursor:pointer;transition:opacity .15s;
}
.gs-bar-btn:active{opacity:.8}
#gsGarsonBtn{background:var(--blue)}
#gsHesapBtn{background:var(--primary)}

/* ── CART FAB ── */
#gsCartFab{
  position:fixed;bottom:calc(var(--bh) + 82px);right:16px;
  width:48px;height:48px;border-radius:50%;
  background:var(--accent);border:none;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;box-shadow:0 3px 12px rgba(232,107,46,.45);
  transition:transform .15s;z-index:150;
}
#gsCartFab:active{transform:scale(.9)}
.gs-cart-inner{font-size:20px;line-height:1;pointer-events:none}

/* ── AI FAB ── */
#gsAiFab{
  position:fixed;bottom:calc(var(--bh) + 22px);right:16px;
  width:52px;height:52px;border-radius:50%;
  background:linear-gradient(135deg,#9B59B6 0%,#6C3483 100%);
  border:none;color:#fff;font-size:24px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;box-shadow:0 3px 14px rgba(108,52,131,.4);
  transition:transform .15s;z-index:150;
}
#gsAiFab:active{transform:scale(.9)}

/* ── TOAST ── */
#gsToast{
  position:fixed;bottom:calc(var(--bh) + 148px);left:50%;
  transform:translateX(-50%) translateY(20px);
  background:#2C1810;color:#FDF6EC;
  padding:10px 20px;border-radius:24px;font-size:13px;font-weight:600;
  white-space:nowrap;opacity:0;transition:opacity .25s,transform .25s;
  z-index:400;pointer-events:none;
}
#gsToast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* ── CART DRAWER ── */
#gsCartBg{position:fixed;inset:0;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .25s;z-index:300}
#gsCartBg.open{opacity:1;pointer-events:auto}
#gsCartDrawer{
  position:fixed;top:0;right:0;bottom:0;width:min(340px,92vw);
  background:#FFFFFF;border-left:1px solid var(--card-b);
  transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);
  z-index:301;display:flex;flex-direction:column;
  box-shadow:-4px 0 20px rgba(44,24,16,.1);
}
#gsCartDrawer.open{transform:translateX(0)}
.gc-head{display:flex;align-items:center;justify-content:space-between;padding:18px 16px;border-bottom:1px solid var(--card-b)}
.gc-head h2{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--primary)}
.gc-close{background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:4px}
.gc-items{flex:1;overflow-y:auto;padding:12px 16px}
.gc-empty{color:var(--muted);font-size:14px;text-align:center;margin-top:30px}
.gc-item{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F0E8D8}
.gc-item-name{font-size:13px;color:var(--text);flex:1;padding-right:6px;line-height:1.35}
.gc-item-price{font-size:13px;font-weight:700;color:var(--gold);margin:0 8px;white-space:nowrap}
.gc-item-qty{display:flex;align-items:center;gap:5px}
.gc-qty-btn{width:24px;height:24px;border-radius:50%;border:1px solid var(--accent);background:none;color:var(--accent);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.gc-qty-btn:active{background:var(--accent);color:#fff}
.gc-qty-num{font-size:14px;font-weight:700;color:var(--text);min-width:16px;text-align:center}
.gc-footer{padding:14px 16px;border-top:1px solid var(--card-b)}
.gc-total-row{display:flex;justify-content:space-between;margin-bottom:12px}
.gc-total-label{font-size:14px;color:var(--muted)}
.gc-total-price{font-size:18px;font-weight:800;color:var(--gold)}
.gc-order-btn{width:100%;padding:14px;background:var(--primary);border:none;border-radius:10px;color:#fff;font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .15s}
.gc-order-btn:active{opacity:.82}
.gc-order-btn:disabled{background:#D4B8A8;color:#fff;cursor:default}

/* ── AI CHAT DRAWER ── */
#ai-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999}
#ai-overlay.open{display:block}
#ai-drawer{
  position:fixed;left:0;right:0;bottom:0;z-index:1000;
  background:#fff;border-radius:16px 16px 0 0;
  display:flex;flex-direction:column;
  height:55vh;max-height:55vh;width:100%;max-width:100vw;
  overflow:hidden;transform:translateY(100%);
  transition:transform .3s ease;box-sizing:border-box;
}
#ai-drawer.open{transform:translateY(0)}
#ai-header{
  flex-shrink:0;padding:12px 16px;border-bottom:1px solid #eee;
  display:flex;justify-content:space-between;align-items:center;
}
.ai-head-left{display:flex;align-items:center;gap:10px}
.ai-head-icon{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#9B59B6,#6C3483);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.ai-head-name{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--primary)}
.ai-head-sub{font-size:11px;color:var(--muted)}
.ai-close{background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:4px}
#ai-messages{flex:1;overflow-y:auto;overflow-x:hidden;padding:12px 16px;display:flex;flex-direction:column;gap:8px}
.ai-bubble-wrap{display:flex;gap:8px;align-items:flex-end}
.ai-bubble-wrap.user{flex-direction:row-reverse}
.ai-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#9B59B6,#6C3483);display:flex;align-items:center;justify-content:center;font-size:14px}
.ai-bubble{max-width:78%;padding:10px 13px;border-radius:14px;font-size:15px;line-height:1.5;color:var(--text)}
.ai-bubble.assistant{background:#F3E8FF;border-bottom-left-radius:4px}
.ai-bubble.user{background:var(--blue);color:#fff;border-bottom-right-radius:4px}
.ai-bubble.loading::after{content:'...';animation:dots 1s infinite}
@keyframes dots{0%{content:'·'}33%{content:'··'}66%{content:'···'}100%{content:'·'}}
#ai-input-row{
  flex-shrink:0;display:flex;flex-direction:row;align-items:center;
  gap:8px;padding:10px 12px;border-top:1px solid #eee;
  background:#fff;box-sizing:border-box;width:100%;
}
#ai-input{
  flex:1;min-width:0;padding:10px 12px;border:1px solid #ddd;
  border-radius:20px;font-size:15px;outline:none;box-sizing:border-box;
  font-family:'Nunito',sans-serif;color:var(--text);resize:none;max-height:80px;overflow-y:auto;
}
#ai-input:focus{border-color:var(--blue)}
#ai-send{
  flex-shrink:0;width:44px;height:44px;border-radius:50%;
  background:#E86B2E;border:none;color:#fff;font-size:18px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
}

/* ── MASA SHEET ── */
#gsMasaBg{position:fixed;inset:0;background:rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .25s;z-index:300}
#gsMasaBg.open{opacity:1;pointer-events:auto}
#gsMasaSheet{
  position:fixed;bottom:0;left:0;right:0;background:#FFFFFF;
  border-top:1px solid var(--card-b);border-radius:16px 16px 0 0;
  padding:16px;transform:translateY(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);
  z-index:301;max-height:70vh;overflow-y:auto;
  box-shadow:0 -2px 16px rgba(44,24,16,.08);
}
#gsMasaSheet.open{transform:translateY(0)}
.gs-masa-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.gs-masa-head h3{font-family:'Playfair Display',serif;font-size:17px;color:var(--primary)}
.gs-masa-close{background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer}
.gs-masa-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.gs-masa-btn{
  padding:12px 0;border-radius:8px;border:1px solid var(--card-b);
  background:#FFF8F0;color:var(--text);font-family:'Nunito',sans-serif;
  font-size:15px;font-weight:600;cursor:pointer;transition:all .15s
}
.gs-masa-btn.selected{background:var(--primary);border-color:var(--primary);color:#fff}
.gs-masa-btn:active{background:var(--primary);color:#fff}

/* ── INSTAGRAM ICON ── */
#gsInstaLink{
  position:absolute;top:50%;left:14px;transform:translateY(-50%);
  width:32px;height:32px;display:flex;align-items:center;justify-content:center;
  text-decoration:none;border-radius:8px;transition:opacity .15s;
}
#gsInstaLink:active{opacity:.7}
#gsInstaLink svg{display:block;width:28px;height:28px}

/* ── FEEDBACK SECTION ── */
#gsFeedbackSection{
  margin:12px 0 20px;
  background:var(--card);border:1px solid var(--card-b);border-radius:12px;
  padding:10px 12px;box-shadow:0 1px 4px rgba(44,24,16,.05);
}
.fb-title{
  font-family:'Playfair Display',serif;font-size:16px;font-weight:700;
  color:var(--primary);margin-bottom:8px;text-align:center;
}
.fb-stars{display:flex;justify-content:center;gap:6px;margin-bottom:8px}
.fb-star{
  font-size:28px;cursor:pointer;color:#D4B8A8;transition:color .15s,transform .1s;
  line-height:1;user-select:none;
}
.fb-star.lit{color:#F0A500}
.fb-star:active{transform:scale(.85)}
.fb-high{display:none;text-align:center;margin-top:4px}
.fb-high.show{display:block}
.fb-high-msg{font-size:14px;color:var(--text);margin-bottom:12px;line-height:1.5}
.fb-gmaps-btn{
  display:inline-flex;align-items:center;gap:7px;
  background:#4285F4;color:#fff;border:none;border-radius:10px;
  padding:11px 20px;font-family:'Nunito',sans-serif;font-size:14px;
  font-weight:700;cursor:pointer;text-decoration:none;transition:opacity .15s;
}
.fb-gmaps-btn:active{opacity:.85}
.fb-low{display:none;margin-top:4px}
.fb-low.show{display:block}
.fb-form-field{
  width:100%;border:1.5px solid var(--card-b);border-radius:9px;
  padding:10px 12px;font-family:'Nunito',sans-serif;font-size:14px;
  color:var(--text);background:#fff;outline:none;margin-bottom:10px;
  transition:border-color .2s;box-sizing:border-box;
}
.fb-form-field:focus{border-color:var(--blue)}
textarea.fb-form-field{resize:vertical;min-height:80px}
.fb-submit-btn{
  width:100%;padding:13px;background:var(--primary);border:none;
  border-radius:10px;color:#fff;font-family:'Nunito',sans-serif;
  font-size:15px;font-weight:700;cursor:pointer;transition:opacity .15s;
}
.fb-submit-btn:active{opacity:.82}
.fb-submit-btn:disabled{background:#D4B8A8;cursor:default}
.fb-success{
  display:none;text-align:center;padding:14px;
  color:#2E7D32;background:#E8F5E9;border-radius:10px;
  font-size:14px;font-weight:600;margin-top:6px;
}
.fb-success.show{display:block}
</style>
</head>
<body>

<!-- ═══ HEADER ═══ -->
<header id="gsHdr">
  <a id="gsInstaLink" href="https://www.instagram.com/gunesinsofrasimeyhane?igsh=MWRib2w4OGNuMmhtZg==" target="_blank" rel="noopener noreferrer" aria-label="Instagram'da takip edin">
    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" width="28" height="28" style="border-radius:8px;display:block;">
  </a>
  <img id="gsLogoImg" src="/assets/img/gunesin-logo.png" alt="Güneşin Sofrası Logo" onerror="this.style.display='none'">
  <div class="gs-brand" id="gsBrand" style="display:none">
    <div class="gs-brand-name">Güneşin Sofrası</div>
    <div class="gs-brand-sub">Meyhane</div>
  </div>
  <button id="gsMasaBadge">Masa&nbsp;<span id="gsMasaNum">${gsEsc(displayMasaId)}</span></button>
</header>

<!-- ═══ CATEGORY NAV ═══ -->
<nav id="gsCatNav" aria-label="Kategoriler">${navPills}</nav>

<!-- ═══ MENU CONTENT ═══ -->
<main id="gsContent">

<!-- FEEDBACK — sayfanın üstünde, Fix Menü'den önce -->
<section id="gsFeedbackSection">
  <div class="fb-title">Deneyiminizi Değerlendirin</div>
  <div class="fb-stars" id="fbStars">
    <span class="fb-star" data-v="1">★</span>
    <span class="fb-star" data-v="2">★</span>
    <span class="fb-star" data-v="3">★</span>
    <span class="fb-star" data-v="4">★</span>
    <span class="fb-star" data-v="5">★</span>
  </div>
  <div class="fb-high" id="fbHigh">
    <p class="fb-high-msg">Harika! Google'da değerlendirme yapmak ister misiniz?</p>
    <a class="fb-gmaps-btn" href="https://share.google/tvnoLJvxZcTGn60vK" target="_blank" rel="noopener noreferrer" id="fbGmapsBtn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#fff"/></svg>
      Google'da Değerlendir
    </a>
  </div>
  <div class="fb-low" id="fbLow">
    <input class="fb-form-field" type="text" id="fbName" placeholder="Ad Soyad *">
    <input class="fb-form-field" type="tel" id="fbPhone" placeholder="Telefon (opsiyonel)">
    <textarea class="fb-form-field" id="fbMessage" placeholder="Görüşleriniz..."></textarea>
    <button class="fb-submit-btn" id="fbSubmitBtn">Gönder</button>
    <div class="fb-success" id="fbSuccess">Geri bildiriminiz iletildi, teşekkürler 🙏</div>
  </div>
</section>

${menuSections}
</main>

<!-- ═══ TOAST ═══ -->
<div id="gsToast" role="status" aria-live="polite"></div>

<!-- ═══ CART FAB ═══ -->
<button id="gsCartFab" aria-label="Masayı aç">
  <span class="gs-cart-inner" id="gsCartIcon">🍽️</span>
</button>

<!-- ═══ AI FAB ═══ -->
<button id="gsAiFab" aria-label="GurmeAI'yi aç">👨‍🍳</button>

<!-- ═══ BOTTOM ACTION BAR ═══ -->
<div id="gsBar">
  <button class="gs-bar-btn" id="gsGarsonBtn">🖐️&nbsp;Garson Çağırın</button>
  <button class="gs-bar-btn" id="gsHesapBtn">🧾&nbsp;Hesap İste</button>
</div>

<!-- ═══ CART DRAWER ═══ -->
<div id="gsCartBg"></div>
<aside id="gsCartDrawer">
  <div class="gc-head">
    <h2>🍽️&nbsp;Sipariş</h2>
    <button class="gc-close" id="gcCloseBtn">✕</button>
  </div>
  <div class="gc-items" id="gcItemsList"><p class="gc-empty">Henüz ürün eklenmedi.</p></div>
  <div class="gc-footer">
    <div class="gc-total-row"><span class="gc-total-label">Toplam</span><span class="gc-total-price" id="gcTotal">0 ₺</span></div>
    <button class="gc-order-btn" id="gcOrderBtn" disabled>Siparişi Ver</button>
  </div>
</aside>

<!-- ═══ AI CHAT DRAWER ═══ -->
<div id="ai-overlay"></div>
<div id="ai-drawer">
  <div id="ai-header">
    <div class="ai-head-left">
      <div class="ai-head-icon">👨‍🍳</div>
      <div>
        <div class="ai-head-name">GurmeAI</div>
        <div class="ai-head-sub">Güneşin Sofrası Yapay Zeka Asistanı</div>
      </div>
    </div>
    <button class="ai-close" id="aiCloseBtn">✕</button>
  </div>
  <div id="ai-messages"></div>
  <div id="ai-input-row">
    <textarea id="ai-input" placeholder="Menü hakkında soru sorun..." rows="1"></textarea>
    <button id="ai-send" aria-label="Gönder">➤</button>
  </div>
</div>

<!-- ═══ MASA SELECTOR ═══ -->
<div id="gsMasaBg"></div>
<div id="gsMasaSheet">
  <div class="gs-masa-head"><h3>Masanı Seç</h3><button class="gs-masa-close" id="gsMasaCloseBtn">✕</button></div>
  <div class="gs-masa-grid">${masaGrid}</div>
</div>

<script>window.GS_INIT_ID = ${JSON.stringify(displayMasaId)};</script>
<script src="/assets/gunesin-menu.js?v=20260419" defer></script>
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
