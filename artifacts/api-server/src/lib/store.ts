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
  // ── SOĞUK MEZELER ─────────────────────────────────────────
  { id: "g001", name: "Haydari", description: "Süzme yoğurt, sarımsak, nane, dereotu", category: "Soğuk Mezeler", price: 180, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g002", name: "Cacık", description: "Yoğurt, salatalık, sarımsak, nane", category: "Soğuk Mezeler", price: 160, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g003", name: "Patlıcan Ezmesi", description: "Közlenmiş patlıcan, sarımsak, limon, zeytinyağı", category: "Soğuk Mezeler", price: 190, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g004", name: "Humus", description: "Nohut ezmesi, tahin, zeytinyağı, paprika", category: "Soğuk Mezeler", price: 200, allergens: ["sesame"], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g005", name: "Tarama", description: "Balık yumurtası, ekmek, zeytinyağı, limon", category: "Soğuk Mezeler", price: 240, allergens: ["fish", "gluten"], vegetarian: false, vegan: false, glutenFree: false },
  { id: "g006", name: "Közlenmiş Biber Salatası", description: "Közlenmiş kırmızı biber, domates, sarımsak, zeytinyağı", category: "Soğuk Mezeler", price: 175, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  // ── SICAK MEZELER ─────────────────────────────────────────
  { id: "g010", name: "Arnavut Ciğeri", description: "Dana ciğer kavurma, soğan, pul biber, kekik", category: "Sıcak Mezeler", price: 320, allergens: [], vegetarian: false, vegan: false, glutenFree: true, spiceLevel: 1 },
  { id: "g011", name: "Midye Tava", description: "Taze karadeniz midyesi, çıtır hamur, tartar sos", category: "Sıcak Mezeler", price: 380, allergens: ["gluten", "shellfish", "eggs"], vegetarian: false, vegan: false, glutenFree: false },
  { id: "g012", name: "Karides Güveç", description: "Kral karides, domates, sarımsak, biber, tereyağ", category: "Sıcak Mezeler", price: 480, allergens: ["shellfish", "dairy"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g013", name: "Fırın Hellim", description: "Kıbrıs hellimi, nane yağı, bal, ceviz", category: "Sıcak Mezeler", price: 290, allergens: ["dairy", "nuts"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g014", name: "Sigara Böreği", description: "İnce yufka, beyaz peynir, maydanoz", category: "Sıcak Mezeler", price: 220, allergens: ["gluten", "dairy"], vegetarian: true, vegan: false, glutenFree: false },
  // ── BALIK ─────────────────────────────────────────────────
  { id: "g020", name: "Levrek Izgara", description: "Taze levrek fileto, zeytinyağı, limon, kaçamak eşliğinde", category: "Balık", price: 680, allergens: ["fish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g021", name: "Çipura Izgara", description: "Taze çipura fileto, sarımsak, limon, salata eşliğinde", category: "Balık", price: 640, allergens: ["fish"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g022", name: "Uskumru Tava", description: "Taze uskumru, mısır unu, soğan halkası, limon", category: "Balık", price: 520, allergens: ["fish", "gluten"], vegetarian: false, vegan: false, glutenFree: false },
  { id: "g023", name: "Hamsi Tava", description: "Taze hamsi, mısır unu, soğan, limon", category: "Balık", price: 460, allergens: ["fish", "gluten"], vegetarian: false, vegan: false, glutenFree: false },
  // ── ET YEMEKLERİ ──────────────────────────────────────────
  { id: "g030", name: "Kuzu Şiş", description: "Marine edilmiş kuzu kuşbaşı, közlenmiş sebze, lavaş, cacık", category: "Et Yemekleri", price: 720, allergens: ["gluten", "dairy"], vegetarian: false, vegan: false, glutenFree: false },
  { id: "g031", name: "Dana Antrikot", description: "200gr dana antrikot, kekik tereyağ, ızgara sebze, baby patates", category: "Et Yemekleri", price: 880, allergens: ["dairy"], vegetarian: false, vegan: false, glutenFree: true },
  { id: "g032", name: "Kuzu Pirzola", description: "3 adet kuzu pirzola, patlıcan ezmesi, közlenmiş biber", category: "Et Yemekleri", price: 960, allergens: [], vegetarian: false, vegan: false, glutenFree: true },
  // ── SALATALAR ─────────────────────────────────────────────
  { id: "g040", name: "Çoban Salata", description: "Domates, salatalık, soğan, maydanoz, zeytinyağı, limon", category: "Salatalar", price: 180, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g041", name: "Roka Parmesan Salata", description: "Roka, kiraz domates, parmesan, limon, zeytinyağı", category: "Salatalar", price: 230, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  // ── RAKI ──────────────────────────────────────────────────
  { id: "g050", name: "Tekirdağ Rakısı 35cl", description: "Tekirdağ altın seri rakı, 35cl", category: "Rakı", price: 420, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g051", name: "Yeni Rakı 35cl", description: "Klasik Yeni Rakı, 35cl", category: "Rakı", price: 380, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g052", name: "Efe Rakısı 35cl", description: "Ege'nin vazgeçilmezi Efe Rakısı, 35cl", category: "Rakı", price: 350, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  // ── ŞARAP ─────────────────────────────────────────────────
  { id: "g060", name: "Beyaz Şarap (Kadeh)", description: "Günün beyaz şarabı, 150ml", category: "Şarap", price: 280, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g061", name: "Kırmızı Şarap (Kadeh)", description: "Günün kırmızı şarabı, 150ml", category: "Şarap", price: 280, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g062", name: "Beyaz Şarap (Şişe)", description: "Kavaklidere Çankaya 75cl", category: "Şarap", price: 950, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g063", name: "Kırmızı Şarap (Şişe)", description: "Kavaklidere Yakut 75cl", category: "Şarap", price: 950, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  // ── İÇECEKLER ─────────────────────────────────────────────
  { id: "g070", name: "Efes Bira 50cl", description: "Soğuk Efes fıçı bira, 50cl", category: "İçecekler", price: 130, allergens: ["gluten"], vegetarian: true, vegan: true, glutenFree: false },
  { id: "g071", name: "Su", description: "Doğal kaynak suyu", category: "İçecekler", price: 55, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g072", name: "Ayran", description: "Ev yapımı ayran", category: "İçecekler", price: 80, allergens: ["dairy"], vegetarian: true, vegan: false, glutenFree: true },
  { id: "g073", name: "Şalgam", description: "Siyah havuç şalgam suyu", category: "İçecekler", price: 90, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g074", name: "Maden Suyu", description: "Soğuk maden suyu", category: "İçecekler", price: 70, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
  { id: "g075", name: "Gazlı İçecek", description: "Coca-Cola / Sprite / Fanta", category: "İçecekler", price: 100, allergens: [], vegetarian: true, vegan: true, glutenFree: true },
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
