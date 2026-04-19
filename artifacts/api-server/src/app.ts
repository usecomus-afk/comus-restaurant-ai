import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import router from "./routes";
import masaRouter from "./routes/masa.js";
import { logger } from "./lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/m", masaRouter);

const publicDir = join(__dirname, "public");
app.get("/admin", (_req, res) => {
  res.sendFile(join(publicDir, "admin.html"));
});
app.use("/admin", express.static(publicDir, { index: "admin.html" }));
app.use("/assets", express.static(publicDir, { maxAge: "7d" }));

app.get("/kvkk", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KVKK Aydınlatma Metni · Comus</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍽️</text></svg>">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #faf8f4;
    color: #1a1612;
    min-height: 100vh;
    padding: 0 0 40px;
  }
  header {
    background: #1a1612;
    padding: 18px 20px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 12px rgba(0,0,0,.35);
  }
  .back-btn {
    background: none;
    border: none;
    color: #c9a84c;
    font-size: 22px;
    cursor: pointer;
    padding: 4px 8px 4px 0;
    line-height: 1;
    text-decoration: none;
  }
  .header-title {
    font-size: 16px;
    font-weight: 700;
    color: #c9a84c;
    letter-spacing: .04em;
  }
  .content {
    max-width: 680px;
    margin: 0 auto;
    padding: 28px 20px;
  }
  h1 {
    font-size: 20px;
    font-weight: 700;
    color: #1a1612;
    margin-bottom: 6px;
  }
  .subtitle {
    font-size: 13px;
    color: #6b6360;
    margin-bottom: 28px;
  }
  h2 {
    font-size: 14px;
    font-weight: 700;
    color: #1a1612;
    text-transform: uppercase;
    letter-spacing: .06em;
    margin: 24px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e8e2d8;
  }
  p, li {
    font-size: 14px;
    line-height: 1.7;
    color: #4a4540;
  }
  ul { padding-left: 20px; margin-top: 6px; }
  li { margin-bottom: 6px; }
  .contact-box {
    background: #fff;
    border: 1px solid #e8e2d8;
    border-radius: 12px;
    padding: 16px 20px;
    margin-top: 10px;
  }
  .contact-box p { margin-bottom: 4px; }
  strong { color: #1a1612; }
</style>
</head>
<body>

<header>
  <a href="javascript:history.back()" class="back-btn" aria-label="Geri dön">←</a>
  <span class="header-title">KVKK Aydınlatma Metni</span>
</header>

<div class="content">
  <h1>Kişisel Verilerin Korunması Aydınlatma Metni</h1>
  <p class="subtitle">Son güncelleme: Nisan 2026</p>

  <h2>1. Veri Sorumlusu</h2>
  <p>
    Bu aydınlatma metni, <strong>Comus Fine Dining</strong> ("Restoran") tarafından,
    6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında
    kişisel verilerinizin işlenmesine ilişkin bilgilendirme amacıyla hazırlanmıştır.
  </p>

  <h2>2. İşlenen Kişisel Veriler</h2>
  <p>Hizmetlerimiz kapsamında aşağıdaki kişisel verileriniz işlenebilir:</p>
  <ul>
    <li>Ad, soyad ve iletişim bilgileri (telefon numarası, e-posta)</li>
    <li>Rezervasyon bilgileri (tarih, saat, kişi sayısı)</li>
    <li>Sipariş ve menü tercihleri</li>
    <li>Alerjen ve diyet kısıtlaması bildirimleri</li>
    <li>Geri bildirim ve şikayet içerikleri</li>
    <li>WhatsApp veya Telegram üzerinden iletilen mesaj içerikleri</li>
  </ul>

  <h2>3. İşleme Amaçları</h2>
  <ul>
    <li>Rezervasyon ve sipariş yönetimi</li>
    <li>Alerjen güvenliği ve kişiselleştirilmiş menü önerileri</li>
    <li>Müşteri memnuniyetinin ölçülmesi ve iyileştirilmesi</li>
    <li>Yasal yükümlülüklerin yerine getirilmesi</li>
    <li>Talep ve şikayetlerin yönetimi</li>
  </ul>

  <h2>4. Hukuki Dayanak</h2>
  <p>
    Kişisel verileriniz; KVKK madde 5/2 kapsamında sözleşmenin ifası,
    meşru menfaat ve açık rızanız hukuki dayanaklarına dayalı olarak işlenmektedir.
  </p>

  <h2>5. Veri Güvenliği ve Saklama</h2>
  <p>
    Kişisel verileriniz, KVKK'nın 12. maddesi uyarınca yetkisiz erişim,
    kayıp ve imhaya karşı teknik ve idari tedbirlerle korunmaktadır.
    Veriler, işleme amacının ortadan kalkmasıyla birlikte silinir veya anonim hale getirilir.
  </p>

  <h2>6. Haklarınız</h2>
  <p>KVKK madde 11 kapsamında aşağıdaki haklara sahipsiniz:</p>
  <ul>
    <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
    <li>İşlenmişse bilgi talep etme</li>
    <li>İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
    <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme</li>
    <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
    <li>Silinmesini veya yok edilmesini isteme</li>
    <li>İşlemeye itiraz etme</li>
  </ul>

  <h2>7. İletişim</h2>
  <div class="contact-box">
    <p><strong>Comus Fine Dining</strong></p>
    <p>E-posta: kvkk@comusdining.com</p>
    <p>Adres: İstanbul, Türkiye</p>
    <p>Telefon: +90 500 000 00 00</p>
  </div>
</div>

</body>
</html>`);
});

export default app;
