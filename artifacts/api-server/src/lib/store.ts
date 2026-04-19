export interface OrderItem {
  dishId: string;
  dishName: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export type OrderStatus = "received" | "preparing" | "ready" | "served";

export interface Order {
  orderId: string;
  restaurantId: string;
  tableNumber: string | number;
  items: OrderItem[];
  guestName?: string;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; changedAt: string }[];
  createdAt: string;
  estimatedMinutes: number;
}

export interface Customer {
  customerId: string;
  restaurantId: string;
  name: string;
  phone: string;
  email?: string;
  allergies: string[];
  preferences: string[];
  notes?: string;
  visitHistory: Visit[];
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  visitId: string;
  date: string;
  tableNumber?: string | number;
  orderIds: string[];
  notes?: string;
}

export interface Notification {
  id: string;
  type: "order_ready" | "assistance_needed" | "special_request" | "alert";
  restaurantId: string;
  tableNumber?: string | number;
  message: string;
  priority: "low" | "medium" | "high";
  sentAt: string;
  acknowledged: boolean;
}

export interface Reservation {
  reservationId: string;
  restaurantId: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  tablePreference?: string;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockItem {
  dishId: string;
  dishName: string;
  restaurantId: string;
  available: boolean;
  reason?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface Dish {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionTr?: string;
  category: string;
  price: number;
  calories?: number;
  allergens: string[];
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  spiceLevel?: number;
  wineParings?: string[];
  image?: string;
  available?: boolean;
  isSpecial?: boolean;
}

export interface Menu {
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  currency: string;
  dishes: Dish[];
  updatedAt: string;
}

const DEFAULT_DISHES: Dish[] = [
  // ── ATIŞTIRMA TABAKLARI ──────────────────────────────────────
  {
    id: "r001",
    name: "Rebel Atıştırma Tabağı",
    description: "1 adet paçanga böreği, 2 adet sigara böreği, 2 adet patates kroket, 2 adet soğan halkası, 2 adet dana parmak sosis, 2 adet çıtır tavuk, 250gr parmak patates",
    category: "Snacks",
    price: 510,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r002",
    name: "Parmak Patates Tava",
    description: "350gr parmak patates",
    category: "Snacks",
    price: 230,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r003",
    name: "Kaşık Patates Tava",
    description: "350gr kaşık patates",
    category: "Snacks",
    price: 260,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r004",
    name: "Trüflü Parmesanlı Kaşık Patates",
    description: "350gr kaşık patates, beyaz trüf yağı, rende parmesan, maldon tuzu, kişniş",
    category: "Snacks",
    price: 280,
    allergens: ["dairy"],
    vegetarian: true, vegan: false, glutenFree: true,
  },
  {
    id: "r005",
    name: "Cheddar'lı Çıtır Tavuk",
    description: "250gr panelenmiş tavuk göğüs, 250gr parmak patates, cheddar dip sos",
    category: "Snacks",
    price: 410,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r006",
    name: "Frankfurter Tabağı",
    description: "100gr dana frankfurter ızgara, 2 dilim dana bacon, coleslaw, hardallı baby patates salatası, közlenmiş köy biberi, çeri domates, tatlı turşu, tortilla, kıtır soğan",
    category: "Snacks",
    price: 500,
    allergens: ["gluten", "dairy"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r007",
    name: "Rebel Şarap Tabağı",
    description: "4 dilim kuru et, 2 dilim ızgara hellim, 2 dilim trakya eski kaşar, 2 dilim van otlu peynir, 4 dilim çeçil peyniri, 2 dilim örgü peyniri, 2 dilim dil peyniri, kuru incir, kuru kayısı, ceviz, badem, wasa, acı biber reçeli",
    category: "Snacks",
    price: 510,
    allergens: ["dairy", "nuts", "gluten"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  // ── BURGERLER ────────────────────────────────────────────────
  {
    id: "r010",
    name: "Mini Burgerler",
    description: "3 adet 50gr burger köftesi, cheddar, ev yapımı burger sos, domates, soğan, marul, tatlı ekşi salatalık turşusu",
    category: "Burgers",
    price: 470,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r011",
    name: "Rebel Burger",
    description: "130gr dana burger, 2 dilim kuru et, 2 dilim bacon, ev yapımı burger sos, soğan, domates, marul",
    category: "Burgers",
    price: 560,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r012",
    name: "Smash Burger",
    description: "2 adet 90gr dana burger köftesi, cheddar, ev yapımı burger sos",
    category: "Burgers",
    price: 460,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r013",
    name: "Ragu Burger",
    description: "12 saat pişirilmiş soslu dana 180gr tiftik ragu, tereyağ, cheddar",
    category: "Burgers",
    price: 550,
    allergens: ["gluten", "dairy"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r014",
    name: "Mantar Soslu Burger",
    description: "130gr dana burger, kestane mantarı, ıspanak, sarımsak, trüf yağı, krema, cheddar",
    category: "Burgers",
    price: 460,
    allergens: ["gluten", "dairy"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r015",
    name: "Chesse Burger",
    description: "130gr dana burger, ev yapımı burger sos, soğan, cheddar",
    category: "Burgers",
    price: 450,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r016",
    name: "Çıtır Tavuk Burger",
    description: "175gr paneli çıtır tavuk, coleslaw, cheddar",
    category: "Burgers",
    price: 440,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  // ── ANA YEMEKLER ─────────────────────────────────────────────
  {
    id: "r020",
    name: "Izgara Köfte",
    description: "200gr kasap köfte, hardallı baby patates, akdeniz yeşillikleri, çeri domates, köy biberi, tortilla, acı dip",
    category: "Mains",
    price: 510,
    allergens: ["gluten"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r021",
    name: "Tavuk Şinitzel",
    description: "200gr tavuk şinitzel, hardallı baby patates, maskolin salata, lime limon, aromatik tereyağ",
    category: "Mains",
    price: 460,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  // ── WRAPLER ──────────────────────────────────────────────────
  {
    id: "r025",
    name: "Et Wrap",
    description: "110gr dana antrikot julyen, soğan, kapya biber, köy biberi, sarımsak, mısır, meksika fasulyesi, jalepeno, cheddar",
    category: "Wraps",
    price: 510,
    allergens: ["gluten", "dairy"],
    vegetarian: false, vegan: false, glutenFree: false,
    spiceLevel: 1,
  },
  {
    id: "r026",
    name: "Tavuk Wrap",
    description: "150gr tavuk julyen, soğan, kapya biber, köy biberi, sarımsak, mısır, meksika fasulyesi, jalepeno, cheddar",
    category: "Wraps",
    price: 410,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
    spiceLevel: 1,
  },
  // ── SALATALAR ────────────────────────────────────────────────
  {
    id: "r030",
    name: "Falafel Mücver Salata",
    description: "Falafel ve mücver topları, akdeniz yeşillikleri, çeri domates, salatalık, salata sosu, mor lahana turşusu, tahin dip sos",
    category: "Salads",
    price: 360,
    allergens: ["sesame"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  {
    id: "r031",
    name: "Sezar Salata Tavuklu",
    description: "125gr tavuk bonfile, iceberg, sezar sos, tane mısır, kapari, wasa, parmesan",
    category: "Salads",
    price: 420,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r032",
    name: "Bonfileli Roka Salata",
    description: "100gr bonfile, roka, roro rosso, salata sosu, kavrulmuş susam, şili biber",
    category: "Salads",
    price: 640,
    allergens: ["sesame"],
    vegetarian: false, vegan: false, glutenFree: true,
    spiceLevel: 1,
  },
  {
    id: "r033",
    name: "Çıtır Tavuk Salata",
    description: "180gr çıtır tavuk bonfile, akdeniz yeşillikleri, çeri domates, salatalık, mor lahana turşusu, mısır",
    category: "Salads",
    price: 360,
    allergens: ["gluten", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  // ── MAKARNALAR ───────────────────────────────────────────────
  {
    id: "r040",
    name: "Domates Soslu Köfteli Spaghetti",
    description: "Domates soslu 250gr köfte, napolitan soslu 200gr spaghetti, kişniş",
    category: "Pasta",
    price: 490,
    allergens: ["gluten"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r041",
    name: "Ragu Lazanya",
    description: "5 dilim lazanya, uzun pişirilmiş ragu, trüf yağı, parmesan, kişniş, tereyağ",
    category: "Pasta",
    price: 610,
    allergens: ["gluten", "dairy", "eggs"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r042",
    name: "Sebzeli Glutensiz Penne",
    description: "200gr glutensiz penne, kabak, patlıcan, çeri domates, kapya biber, mantar, ezine peyniri, dağ kekiği",
    category: "Pasta",
    price: 370,
    allergens: ["dairy"],
    vegetarian: true, vegan: false, glutenFree: true,
  },
  {
    id: "r043",
    name: "Fettucini Alfredo Tavuklu",
    description: "200gr fettucini, 120gr tavuk julyen, mantar, pesto sos, krema, parmesan",
    category: "Pasta",
    price: 390,
    allergens: ["gluten", "dairy", "nuts"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  {
    id: "r044",
    name: "Çuçuvara Mantı",
    description: "230gr el yapımı dana kıymalı özbek mantısı, yoğurt, salçalı aromatik sos",
    category: "Pasta",
    price: 370,
    allergens: ["gluten", "dairy"],
    vegetarian: false, vegan: false, glutenFree: false,
  },
  // ── VEGAN ────────────────────────────────────────────────────
  {
    id: "r050",
    name: "Vegan Bira Tabağı",
    description: "250gr ev baharatlı parmak patates, 3 adet patates kroket, 2 adet sebzeli börek, 3 adet mücver topu, 3 adet falafel topu, 3 adet soğan halkası",
    category: "Vegan",
    price: 440,
    allergens: ["gluten"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  {
    id: "r051",
    name: "Falafel Dürüm",
    description: "Falafel topları, akdeniz yeşilliği, domates, mor lahana turşusu, tahin dip sos",
    category: "Vegan",
    price: 350,
    allergens: ["gluten", "sesame"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  {
    id: "r052",
    name: "Vegan Şinitzel",
    description: "Bezelye proteini şinitzel, guacamole coleslaw, baby patates kızartması, tortilla",
    category: "Vegan",
    price: 380,
    allergens: ["gluten"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  {
    id: "r053",
    name: "Vegan Şinitzel Burger",
    description: "Paneli bezelye proteini burger, guacamole coleslaw, turşu",
    category: "Vegan",
    price: 420,
    allergens: ["gluten"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  {
    id: "r054",
    name: "Vegan Burger",
    description: "Vegan burger ekmeği, bezelye proteini köfte, marul, domates, tatlı kornişon turşu, guacamole",
    category: "Vegan",
    price: 410,
    allergens: ["gluten"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  {
    id: "r055",
    name: "Vegan Wrap",
    description: "Mantar, kabak, havuç, soğan, kapya biber, sarımsak, mısır, meksika fasulyesi, jalepeno, tofu",
    category: "Vegan",
    price: 480,
    allergens: ["gluten"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  // ── KOKTEYLLER — Rebel Signatures ────────────────────────────
  {
    id: "r060",
    name: "No.11",
    nameEn: "Rebel Signature",
    description: "Jim&Beam BlackCherry, Kahlua, limon suyu, çikolata sos, foamer",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: false, glutenFree: true,
  },
  {
    id: "r061",
    name: "Ruby's Hibisküs",
    nameEn: "Rebel Signature",
    description: "Johnnie Walker Black Ruby, Elder Flower, Hibiscus, Sweet&Sour, foamer",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: false, glutenFree: true,
  },
  {
    id: "r062",
    name: "Mona Lisa",
    nameEn: "Rebel Signature",
    description: "Gin, Passion, Narenciye Sos, Lime Cordial, Hibiscus, Sweet&Sour",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r063",
    name: "Fire Twist",
    nameEn: "Rebel Signature",
    description: "Jack Fire, Tarçın, Zencefil, Bal, Sweet&Sour",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: false, glutenFree: true,
  },
  {
    id: "r064",
    name: "Berry Salt",
    nameEn: "Rebel Signature",
    description: "Orman meyveleri, Rom, Chambord, Vanilya",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r065",
    name: "Passion Inferno",
    nameEn: "Rebel Signature",
    description: "Çarkıfelek meyvesi, Tekila, Aperol, Chilli sos, Sweet&Sour",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
    spiceLevel: 2,
  },
  {
    id: "r066",
    name: "Pink Marshmallow Dream",
    nameEn: "Rebel Signature",
    description: "Gin Pink, Smirnoff North, Vanilya, Orman meyveleri, Hibiscus, Sweet&Sour",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: false, glutenFree: true,
  },
  {
    id: "r067",
    name: "Green Glow",
    nameEn: "Rebel Signature",
    description: "Gin, kuzu kulağı, yeşil elma, kivi, limon suyu, foamer",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: false, glutenFree: true,
  },
  // ── KOKTEYLLER — Klasik ───────────────────────────────────────
  {
    id: "r070",
    name: "Negroni",
    description: "Gin, Vermouth, Campari",
    category: "Cocktails",
    price: 530,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r071",
    name: "Whiskey Sour",
    description: "Bourbon, Sweet&Sour, simple syrup, foamer",
    category: "Cocktails",
    price: 480,
    allergens: [],
    vegetarian: true, vegan: false, glutenFree: true,
  },
  {
    id: "r072",
    name: "Dry Martini",
    description: "Vodka veya Gin, dry vermouth, yeşil zeytin",
    category: "Cocktails",
    price: 450,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r073",
    name: "Margarita",
    description: "Casamigos Blanco tekila, Triple sec, limon suyu, kaya tuzu",
    category: "Cocktails",
    price: 450,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r074",
    name: "Gin Fizz",
    description: "Gin, pudra şekeri, limon suyu, foamer, maden suyu",
    category: "Cocktails",
    price: 400,
    allergens: [],
    vegetarian: true, vegan: false, glutenFree: true,
  },
  {
    id: "r075",
    name: "Long Island",
    description: "Vodka, Gin, Rom, Tekila, Triple sec, kola, limon suyu",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r076",
    name: "Espresso Martini",
    description: "Vodka, Kahlua, espresso",
    category: "Cocktails",
    price: 450,
    allergens: [],
    vegetarian: true, vegan: false, glutenFree: true,
  },
  {
    id: "r077",
    name: "Pornstar Martini",
    description: "Smirnoff Vanilla, Passoã, passion fruit, Sweet&Sour, shot Prosecco",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r078",
    name: "Mojito",
    description: "Rom, lime, nane, maden suyu",
    category: "Cocktails",
    price: 460,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r079",
    name: "Cuba Libre",
    description: "Rom, lime, Coca-Cola",
    category: "Cocktails",
    price: 430,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r080",
    name: "Aperol Spritz",
    description: "Aperol, Prosecco, soda",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r081",
    name: "Campari Spritz",
    description: "Cinzano prosecco, Campari, soda",
    category: "Cocktails",
    price: 500,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r082",
    name: "Campari Tonic",
    description: "Campari, tonik",
    category: "Cocktails",
    price: 440,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r083",
    name: "Campari Americano",
    description: "Campari, Cinzano rosso, soda",
    category: "Cocktails",
    price: 400,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  // ── ALKOLSÜZ İÇECEKLER ───────────────────────────────────────
  {
    id: "r090",
    name: "Su",
    description: "Doğal kaynak suyu",
    category: "Drinks",
    price: 55,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r091",
    name: "Soda",
    description: "Soğuk maden suyu / soda",
    category: "Drinks",
    price: 80,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r092",
    name: "Coca-Cola / Zero / Sprite / Fanta",
    description: "Tercihlerinize göre soğuk içecek",
    category: "Drinks",
    price: 110,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r093",
    name: "Churchill",
    description: "Soğuk Churchill",
    category: "Drinks",
    price: 150,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r094",
    name: "Redbull",
    description: "Red Bull enerji içeceği",
    category: "Drinks",
    price: 180,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  {
    id: "r095",
    name: "Meyve Kokteyl",
    description: "Taze meyve suları ile hazırlanan alkolsüz kokteyl",
    category: "Drinks",
    price: 300,
    allergens: [],
    vegetarian: true, vegan: true, glutenFree: true,
  },
  // ── HAPPY HOUR ───────────────────────────────────────────────
  {
    id: "r100",
    name: "Tuborg Fıçı 50cl",
    description: "Soğuk Tuborg fıçı bira. Her gün 18:55'e kadar happy hour fiyatı.",
    category: "Happy Hour",
    price: 105,
    allergens: ["gluten"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  {
    id: "r101",
    name: "Carlsberg Fıçı 50cl",
    description: "Soğuk Carlsberg fıçı bira. Her gün 18:55'e kadar happy hour fiyatı.",
    category: "Happy Hour",
    price: 115,
    allergens: ["gluten"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  {
    id: "r102",
    name: "Guinness Fıçı 50cl",
    description: "İrlanda'nın meşhur Guinness stout birası. Her gün 18:55'e kadar happy hour fiyatı.",
    category: "Happy Hour",
    price: 230,
    allergens: ["gluten"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  {
    id: "r103",
    name: "Weihenstephaner 50cl",
    description: "Alman buğday birası. Her gün 18:55'e kadar happy hour fiyatı.",
    category: "Happy Hour",
    price: 230,
    allergens: ["gluten"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
  {
    id: "r104",
    name: "Tuborg Ice",
    description: "Soğuk Tuborg Ice bira. Gün boyu bu fiyat geçerlidir.",
    category: "Happy Hour",
    price: 105,
    allergens: ["gluten"],
    vegetarian: true, vegan: true, glutenFree: false,
  },
];

const DEFAULT_MENU: Menu = {
  restaurantId: "default",
  restaurantName: "Rebel Bar & Bistro",
  cuisine: "Bar & Bistro",
  currency: "TRY",
  dishes: DEFAULT_DISHES,
  updatedAt: new Date().toISOString(),
};

/* ══════════════════════════════════════════════════════════
   RESTAURANT CONFIG REGISTRY
   ══════════════════════════════════════════════════════════ */
export interface RestaurantConfig {
  restaurantId: string;
  name: string;
  masaCount: number;
  telegramGroupId: string;
  botToken: string;
  menuKey: string;
  masaUrlPrefix: string;
}

const GUNESIN_DISHES: Dish[] = [
  // ── FIX MENÜ ──────────────────────────────────────────────
  { id: "g001", name: "Limitli Alkollü Fix Menü", description: "Kişi başı — Her 4 kişi için: 10 çeşit meze, 2 ara sıcak (Ciğer + Güneş Böreği), ana yemek (Köfte veya Asma Yaprağında Levrek), salata ve meyve. 4 kişiye 1 adet 70cl Rakı · 2 kişiye 1 adet 75cl Şarap · 1 kişiye 2 adet 50cl Bira.", category: "Fix Menü", price: 2250, allergens: [], vegetarian: false, vegan: false, glutenFree: false, isSpecial: true },
  { id: "g002", name: "Ana Yemeksiz Fix Menü", description: "Kişi başı — Meze seçkisi, ara sıcaklar, salata ve meyve. Alkol dahil değildir.", category: "Fix Menü", price: 1850, allergens: [], vegetarian: false, vegan: false, glutenFree: false },

  // ── SOĞUK MEZELER — Meyhane Klasikleri ────────────────────
  { id: "g010", name: "Beyaz Peynir", description: "Meyhane usulü beyaz peynir", category: "Soğuk Mezeler", price: 180, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g011", name: "Atom", description: "Acılı ezme, sarımsak, ceviz", category: "Soğuk Mezeler", price: 260, allergens: ["nuts"], vegetarian: true, vegan: true, glutenFree: true, spiceLevel: 2 },
  { id: "g012", name: "Muhammara", description: "Kırmızı biber ezmesi, ceviz, zeytinyağı", category: "Soğuk Mezeler", price: 260, allergens: ["nuts"], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g013", name: "Köpoğlu", description: "Közlenmiş patlıcan, yoğurt, sarımsak, domates", category: "Soğuk Mezeler", price: 280, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g014", name: "Fava", description: "Bakla ezmesi, zeytinyağı, dereotu", category: "Soğuk Mezeler", price: 250, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g015", name: "Şakşuka", description: "Patlıcan, domates, biber, sarımsak, zeytinyağı", category: "Soğuk Mezeler", price: 260, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g016", name: "Haydari", description: "Süzme yoğurt, sarımsak, nane", category: "Soğuk Mezeler", price: 260, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g017", name: "Humus", description: "Nohut ezmesi, tahin, zeytinyağı, paprika", category: "Soğuk Mezeler", price: 240, allergens: ["sesame"], vegetarian: true, vegan: true, glutenFree: true },

  // ── SOĞUK MEZELER — Denizden ──────────────────────────────
  { id: "g020", name: "Levrek Marin", description: "Taze levrek marin, limon, zeytinyağı", category: "Deniz Mezeleri", price: 490, allergens: ["fish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g021", name: "Lakerda", description: "Bir dilim tuzlanmış palamut", category: "Deniz Mezeleri", price: 390, allergens: ["fish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g022", name: "Füme Uskumru", description: "Soğuk füme uskumru", category: "Deniz Mezeleri", price: 450, allergens: ["fish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g023", name: "Deniz Mahsulleri Salatası", description: "Mevsim deniz ürünleri salatası", category: "Deniz Mezeleri", price: 550, allergens: ["fish", "shellfish"], vegetarian: false, vegan: false, glutenFree: true },

  // ── SOĞUK MEZELER — Günün Mezeleri ───────────────────────
  { id: "g030", name: "Girit Ezme", description: "Girit usulü peynir ezmesi, zeytinyağı", category: "Günün Mezeleri", price: 290, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g031", name: "Yoğurtlu Kabak Şayan", description: "Kabak, yoğurt, sarımsak, nane", category: "Günün Mezeleri", price: 270, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g032", name: "Pilaki", description: "Fasulye veya balık pilakisi, zeytinyağı", category: "Günün Mezeleri", price: 240, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g033", name: "Acılı Ezme", description: "Közlenmiş biber, domates, soğan ezmesi", category: "Günün Mezeleri", price: 240, allergens: [], vegetarian: true, vegan: true, glutenFree: true, spiceLevel: 2 },
  { id: "g034", name: "Zahter Salatası", description: "Taze zahter otu salatası, zeytinyağı, limon", category: "Günün Mezeleri", price: 260, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g035", name: "Köz Patlıcan", description: "Közlenmiş patlıcan, zeytinyağı, sarımsak", category: "Günün Mezeleri", price: 260, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g036", name: "Enginar Kalbi", description: "Zeytinyağlı enginar kalbi", category: "Günün Mezeleri", price: 390, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g037", name: "Kaya Koruğu", description: "Taze kaya koruğu, zeytinyağı, limon", category: "Günün Mezeleri", price: 240, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g038", name: "Topik", description: "Nohut ezmeli Ermeni mezesi, soğan, çam fıstığı", category: "Günün Mezeleri", price: 300, allergens: ["nuts"], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g039", name: "Kuru Cacık", description: "Süzme yoğurt, sarımsak, salatalık, nane", category: "Günün Mezeleri", price: 240, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g040", name: "Pazı Kavurma", description: "Zeytinyağlı pazı kavurma", category: "Günün Mezeleri", price: 290, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g041", name: "Kuru Domates Mezesi", description: "Kuru domates, zeytinyağı, baharatlar", category: "Günün Mezeleri", price: 250, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g042", name: "Kıska Soğan", description: "Çıtır kızartılmış soğan", category: "Günün Mezeleri", price: 260, allergens: ["gluten"], vegetarian: true, vegan: true, glutenFree: false },

  // ── ARA SICAKLAR ──────────────────────────────────────────
  { id: "g050", name: "Yaprak Ciğer", description: "İnce dilim kuzuciğer kavurma", category: "Ara Sıcaklar", price: 680, allergens: [], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g051", name: "Enginar Kalbi Izgara", description: "Izgara enginar kalbi, zeytinyağı", category: "Ara Sıcaklar", price: 450, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g052", name: "Paçanga", description: "Pastırmalı ve kaşarlı börek", category: "Ara Sıcaklar", price: 350, allergens: ["gluten", "dairy"], vegetarian: false, vegan: false, glutenFree: false },
  { id: "g053", name: "Kalamar Tava", description: "Çıtır kalamar tava, tartar sos", category: "Ara Sıcaklar", price: 690, allergens: ["gluten", "shellfish"], vegetarian: false, vegan: false, glutenFree: false },
  { id: "g054", name: "Karides Güveç", description: "Güveçte karides, domates, sarımsak, tereyağ", category: "Ara Sıcaklar", price: 650, allergens: ["shellfish", "dairy"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g055", name: "Kiremitte Peynirli Mantar", description: "Kiremit üstünde peynirli mantar", category: "Ara Sıcaklar", price: 390, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g056", name: "Kalamar Izgara", description: "Izgara kalamar, zeytinyağı, limon", category: "Ara Sıcaklar", price: 720, allergens: ["shellfish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g057", name: "Dil Izgara", description: "Izgara dana dil", category: "Ara Sıcaklar", price: 750, allergens: [], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g058", name: "Sıcak Ot", description: "Mevsim otları sıcak meze", category: "Ara Sıcaklar", price: 330, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g059", name: "Tereyağlı Karides", description: "Tereyağlı sote karides", category: "Ara Sıcaklar", price: 680, allergens: ["shellfish", "dairy"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g060", name: "Pastırmalı Humus", description: "Sıcak humus, pastırma, tereyağ", category: "Ara Sıcaklar", price: 480, allergens: ["sesame"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g061", name: "Güneş Böreği", description: "Güneşin Sofrası'na özel börek", category: "Ara Sıcaklar", price: 320, allergens: ["gluten", "dairy"], vegetarian: true, vegan: false, glutenFree: false },
  { id: "g062", name: "Biralı Çıtır Kabak", description: "Bira hamurunda kabak kızartması", category: "Ara Sıcaklar", price: 390, allergens: ["gluten"], vegetarian: true, vegan: true, glutenFree: false },
  { id: "g063", name: "Ahtapot Izgara", description: "Izgara ahtapot, zeytinyağı, limon, kekik", category: "Ara Sıcaklar", price: 1350, allergens: ["shellfish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g064", name: "Balık Kokoreç", description: "Balık iç organlarıyla hazırlanan kokoreç", category: "Ara Sıcaklar", price: 620, allergens: ["gluten"], vegetarian: false, vegan: false, glutenFree: false },
  { id: "g065", name: "Balık Köftesi", description: "2 adet balık köftesi", category: "Ara Sıcaklar", price: 650, allergens: ["gluten", "fish", "eggs"], vegetarian: false, vegan: false, glutenFree: false },
  { id: "g066", name: "Kuzu Kokoreç", description: "Geleneksel kuzu kokoreç", category: "Ara Sıcaklar", price: 650, allergens: ["gluten"], vegetarian: false, vegan: false, glutenFree: false },
  { id: "g067", name: "Patlıcan Kumpir", description: "Mevsiminde — Patlıcan kumpir", category: "Ara Sıcaklar", price: 475, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },

  // ── ANA YEMEKLER — Deniz ──────────────────────────────────
  { id: "g070", name: "Asma Yaprağında Levrek", description: "Taze levrek, asma yaprağında pişmiş", category: "Ana Yemekler (Deniz)", price: 950, allergens: ["fish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g071", name: "Güveçte Balık Kavurma", description: "Güveçte taze balık kavurma", category: "Ana Yemekler (Deniz)", price: 850, allergens: ["fish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g072", name: "Çupra Izgara", description: "Taze çupra ızgara", category: "Ana Yemekler (Deniz)", price: 850, allergens: ["fish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g073", name: "Levrek Izgara", description: "Taze levrek ızgara", category: "Ana Yemekler (Deniz)", price: 850, allergens: ["fish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g074", name: "Mevsim Balıkları", description: "Günlük fiyat için lütfen garson ile görüşünüz", category: "Ana Yemekler (Deniz)", price: 0, allergens: ["fish"], vegetarian: false, vegan: false, glutenFree: true },

  // ── ANA YEMEKLER — Kırmızı Et ─────────────────────────────
  { id: "g080", name: "Güveçte Çoban Kavurma", description: "180 gr antrikot, güveçte çoban kavurma", category: "Ana Yemekler (Et)", price: 980, allergens: [], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g081", name: "Köfte", description: "180 gr ızgara köfte", category: "Ana Yemekler (Et)", price: 700, allergens: ["gluten"], vegetarian: false, vegan: false, glutenFree: false },
  { id: "g082", name: "Kuzu Pirzola", description: "250 gr kuzu pirzola ızgara", category: "Ana Yemekler (Et)", price: 1250, allergens: [], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g083", name: "Karışık Izgara", description: "360 gr — 2 köfte + 2 kalem pirzola + 2 kuzu şiş", category: "Ana Yemekler (Et)", price: 1700, allergens: ["gluten"], vegetarian: false, vegan: false, glutenFree: false },

  // ── SALATALAR ─────────────────────────────────────────────
  { id: "g090", name: "Yeşil Salata (Orta)", description: "Taze yeşil salata — Orta boy", category: "Salatalar", price: 250, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g091", name: "Yeşil Salata (Büyük)", description: "Taze yeşil salata — Büyük boy", category: "Salatalar", price: 300, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g092", name: "Roka Salata (Orta)", description: "Roka, zeytinyağı, limon — Orta boy", category: "Salatalar", price: 280, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g093", name: "Roka Salata (Büyük)", description: "Roka, zeytinyağı, limon — Büyük boy", category: "Salatalar", price: 340, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g094", name: "P. Roka Salatası (Orta)", description: "Parmesan rokası — Orta boy", category: "Salatalar", price: 325, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g095", name: "P. Roka Salatası (Büyük)", description: "Parmesan rokası — Büyük boy", category: "Salatalar", price: 380, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g096", name: "Çoban Salatası (Orta)", description: "Domates, salatalık, soğan, maydanoz — Orta boy", category: "Salatalar", price: 300, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g097", name: "Çoban Salatası (Büyük)", description: "Domates, salatalık, soğan, maydanoz — Büyük boy", category: "Salatalar", price: 360, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g098", name: "Gavurdağı Salatası (Orta)", description: "Domates, biber, ceviz, nar ekşisi — Orta boy", category: "Salatalar", price: 350, allergens: ["nuts"], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g099", name: "Gavurdağı Salatası (Büyük)", description: "Domates, biber, ceviz, nar ekşisi — Büyük boy", category: "Salatalar", price: 420, allergens: ["nuts"], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g100", name: "İstanbul Salatası (Orta)", description: "Mevsim yeşillikleri — Orta boy", category: "Salatalar", price: 300, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g101", name: "İstanbul Salatası (Büyük)", description: "Mevsim yeşillikleri — Büyük boy", category: "Salatalar", price: 350, allergens: [], vegetarian: true, vegan: true, glutenFree: true },

  // ── TATLI & MEYVE ─────────────────────────────────────────
  { id: "g110", name: "Fırında Portakallı Helva", description: "Portakal aromalı fırın helvası", category: "Tatlı & Meyve", price: 330, allergens: ["nuts", "gluten"], vegetarian: true, vegan: true, glutenFree: false },
  { id: "g111", name: "Dondurmalı İrmik Helvası", description: "İrmik helvası, dondurma ile servis", category: "Tatlı & Meyve", price: 375, allergens: ["dairy", "nuts", "gluten"], vegetarian: true, vegan: false, glutenFree: false },
  { id: "g112", name: "Antakya Kabak Tatlısı", description: "Geleneksel kabak tatlısı, kaymak ile", category: "Tatlı & Meyve", price: 375, allergens: ["dairy", "nuts"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g113", name: "Meyve Tabağı", description: "2 kişilik mevsim meyveleri tabağı", category: "Tatlı & Meyve", price: 310, allergens: [], vegetarian: true, vegan: true, glutenFree: true },

  // ── RAKI ──────────────────────────────────────────────────
  { id: "g120", name: "Yeni Rakı", description: "Tek 300₺ · Duble 450₺ · 20cl 950₺ · 35cl 1.470₺ · 50cl 1.950₺ · 70cl 2.500₺ · 100cl 3.300₺", category: "Rakı", price: 300, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g121", name: "Yeni Seri", description: "20cl 1.050₺ · 35cl 1.690₺ · 50cl 2.200₺ · 70cl 2.750₺ · 100cl 3.650₺", category: "Rakı", price: 1050, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g122", name: "Alâ", description: "35cl 2.050₺ · 70cl 3.600₺", category: "Rakı", price: 2050, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g123", name: "Tekirdağ", description: "35cl 1.550₺ · 50cl 2.100₺ · 70cl 2.650₺ · 100cl 3.600₺", category: "Rakı", price: 1550, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g124", name: "Altın Seri", description: "20cl 1.200₺ · 35cl 1.800₺ · 50cl 2.450₺ · 70cl 3.100₺ · 100cl 3.950₺", category: "Rakı", price: 1200, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g125", name: "Rezerv", description: "35cl 2.100₺ · 70cl 3.650₺", category: "Rakı", price: 2100, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g126", name: "Göbek", description: "20cl 1.350₺ · 35cl 2.150₺ · 50cl 3.000₺ · 70cl 3.800₺ · 100cl 4.700₺", category: "Rakı", price: 1350, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g127", name: "Efe Rakı (Yeşil)", description: "20cl 1.090₺ · 35cl 1.650₺ · 50cl 2.250₺ · 70cl 2.850₺ · 100cl 3.700₺", category: "Rakı", price: 1090, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g128", name: "Efe Gold", description: "20cl 1.250₺ · 35cl 1.850₺ · 50cl 2.550₺ · 70cl 3.200₺ · 100cl 4.000₺", category: "Rakı", price: 1250, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g129", name: "Efe Göbek", description: "20cl 1.290₺ · 35cl 2.150₺ · 50cl 2.980₺ · 70cl 3.750₺ · 100cl 5.100₺", category: "Rakı", price: 1290, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g130", name: "Sarı Zeybek 3 Meşe", description: "20cl 1.350₺ · 35cl 2.350₺ · 50cl 2.950₺ · 70cl 3.800₺ · 100cl 5.200₺", category: "Rakı", price: 1350, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g131", name: "Beylerbeyi Göbek", description: "35cl 2.250₺ · 70cl 4.100₺", category: "Rakı", price: 2250, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g132", name: "Kulüp", description: "35cl 1.950₺ · 70cl 3.250₺", category: "Rakı", price: 1950, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g133", name: "Kulüp Delux", description: "35cl 1.900₺ · 70cl 3.150₺", category: "Rakı", price: 1900, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g134", name: "Yeni Rakı Giz", description: "50cl 6.300₺", category: "Rakı", price: 6300, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g135", name: "Yeni Rakı Pus", description: "50cl 5.500₺", category: "Rakı", price: 5500, allergens: [], vegetarian: true, vegan: true, glutenFree: true },

  // ── ŞARAP — Kırmızı ───────────────────────────────────────
  { id: "g140", name: "Turasan Libra", description: "Kırmızı şarap — 75cl", category: "Şarap (Kırmızı)", price: 1650, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g141", name: "T. Cab. Sauvignon", description: "Turasan Cabernet Sauvignon — 75cl", category: "Şarap (Kırmızı)", price: 1850, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g142", name: "Turasan Merlot", description: "75cl", category: "Şarap (Kırmızı)", price: 1850, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g143", name: "T. Seneler Ökg-Bğz", description: "Turasan Seneler Öküzgözü-Boğazkere — 75cl", category: "Şarap (Kırmızı)", price: 2800, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g144", name: "Terra Ökg-Bğz", description: "Terra Öküzgözü-Boğazkere — 75cl", category: "Şarap (Kırmızı)", price: 1600, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g145", name: "Terra Shiraz", description: "75cl", category: "Şarap (Kırmızı)", price: 1600, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g146", name: "Kayra Vintage Ökg", description: "Kayra Vintage Öküzgözü — 75cl", category: "Şarap (Kırmızı)", price: 2900, allergens: [], vegetarian: true, vegan: true, glutenFree: true },

  // ── ŞARAP — Beyaz ─────────────────────────────────────────
  { id: "g150", name: "Turasan Libra Beyaz", description: "75cl", category: "Şarap (Beyaz)", price: 1650, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g151", name: "Turasan Narince", description: "75cl", category: "Şarap (Beyaz)", price: 1850, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g152", name: "Turasan Emir", description: "75cl", category: "Şarap (Beyaz)", price: 1850, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g153", name: "T. Seneler Char.", description: "Turasan Seneler Chardonnay — 75cl", category: "Şarap (Beyaz)", price: 2800, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g154", name: "Leona Nar-Cha.", description: "Leona Narince-Chardonnay — 75cl", category: "Şarap (Beyaz)", price: 1650, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g155", name: "Terra Narince", description: "75cl", category: "Şarap (Beyaz)", price: 1650, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g156", name: "K. Vintage Narince", description: "Kayra Vintage Narince — 75cl", category: "Şarap (Beyaz)", price: 2900, allergens: [], vegetarian: true, vegan: true, glutenFree: true },

  // ── ŞARAP — Rosé & Diğer ──────────────────────────────────
  { id: "g160", name: "Leona Blush", description: "Rosé — 75cl", category: "Şarap (Rosé)", price: 1650, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g161", name: "Kadeh Şarap", description: "Günün şarabı — kadeh", category: "Şarap (Rosé)", price: 390, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g162", name: "Kadeh Rosé", description: "Günün roséi — kadeh", category: "Şarap (Rosé)", price: 390, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g163", name: "Şişe Bira", description: "50cl şişe bira", category: "Şarap (Rosé)", price: 290, allergens: ["gluten"], vegetarian: true, vegan: true, glutenFree: false },

  // ── SOFT İÇECEKLER ────────────────────────────────────────
  { id: "g170", name: "Büyük Su", description: "Büyük boy kaynak suyu", category: "İçecekler", price: 90, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g171", name: "Soda", description: "Maden suyu / soda", category: "İçecekler", price: 110, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g172", name: "Churchill", description: "Soğuk Churchill", category: "İçecekler", price: 140, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g173", name: "Uludağ Gazoz", description: "Klasik Uludağ gazoz", category: "İçecekler", price: 160, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g174", name: "Ice Tea", description: "Limon veya şeftali", category: "İçecekler", price: 160, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g175", name: "Büyük Şalgam", description: "Büyük boy şalgam suyu", category: "İçecekler", price: 180, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g176", name: "Küçük Şalgam", description: "Küçük boy şalgam suyu", category: "İçecekler", price: 100, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g177", name: "Türk Kahvesi", description: "Geleneksel Türk kahvesi", category: "İçecekler", price: 120, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
];

const GUNESIN_MENU: Menu = {
  restaurantId: "gunesin-sofrasi",
  restaurantName: "Güneşin Sofrası Meyhane",
  cuisine: "Türk Meyhane",
  currency: "TRY",
  dishes: GUNESIN_DISHES,
  updatedAt: new Date().toISOString(),
};

export interface Feedback {
  feedbackId: string;
  restaurantId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  tableNumber?: string | number;
  customerId?: string;
  guestName?: string;
  orderId?: string;
  aiResponse: string;
  crisisAlert: boolean;
  celebrationAlert: boolean;
  notificationIds: string[];
  createdAt: string;
}

export interface ChatLogEntry {
  entryId: string;
  restaurantId: string;
  tableNumber?: string | number;
  customerId?: string;
  message: string;
  language?: string;
  timestamp: string;
}

export const orders = new Map<string, Order>();
export const customers = new Map<string, Customer>();
export const notifications: Notification[] = [];
export const reservations = new Map<string, Reservation>();
export const stock = new Map<string, StockItem>();
export const menus = new Map<string, Menu>([
  ["default", DEFAULT_MENU],
  ["gunesin-sofrasi", GUNESIN_MENU],
]);

export const restaurants = new Map<string, RestaurantConfig>([
  ["rebel", {
    restaurantId: "rebel",
    name: "Rebel Bar & Bistro",
    masaCount: 30,
    telegramGroupId: process.env.TELEGRAM_CHAT_ID ?? "",
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    menuKey: "default",
    masaUrlPrefix: "masa",
  }],
  ["gunesin-sofrasi", {
    restaurantId: "gunesin-sofrasi",
    name: "Güneşin Sofrası Meyhane",
    masaCount: 15,
    telegramGroupId: "BEKLIYOR",
    botToken: "BEKLIYOR",
    menuKey: "gunesin-sofrasi",
    masaUrlPrefix: "gunesin",
  }],
]);
export const feedbacks = new Map<string, Feedback>();
export const chatLog: ChatLogEntry[] = [];

let _notifSeq = 0;
export function createNotification(
  partial: Omit<Notification, "id" | "sentAt" | "acknowledged">,
): Notification {
  const id = `NOTIF-${String(++_notifSeq).padStart(4, "0")}`;
  const notif: Notification = {
    ...partial,
    id,
    sentAt: new Date().toISOString(),
    acknowledged: false,
  };
  notifications.push(notif);
  return notif;
}
