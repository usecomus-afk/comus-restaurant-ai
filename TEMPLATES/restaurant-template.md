# Comus Yeni Restoran Şablonu

## Yeni restoran eklemek için değiştirilecekler:

### store.ts
- restaurantId: 'yeni-restoran-id'
- name: 'Restoran Adı'
- telegramGroupId: Railway Variable'dan okunacak
- botToken: Railway Variable'dan okunacak
- Menü verisi: kategoriler ve ürünler

### Railway Variables
- [RESTORAN_ID]_TELEGRAM_TOKEN
- [RESTORAN_ID]_TELEGRAM_GROUP_ID

### public/[restoran-id]/logo.png
- Restoranın logosu

### renderRestaurantPage() fonksiyonu
- Renk paleti (5 değişken)
- Font seçimi
- Instagram linki
- Google Maps linki

### [restoran-id]-menu.js
- Sistem promptu (GurmeAI kişiliği)
- Karşılama mesajı

## Değiştirilmeyecekler (hazır gelir):
- Sepet/masa sistemi
- GurmeAI chatbot altyapısı
- Telegram bildirim sistemi
- Değerlendirme sistemi
- Garson çağır / Hesap iste
- Telegram menü yönetimi (bitti/geldi/fiyat/ekle/çıkar komutları)
- Klavye/mobil uyumluluk
- Feedback formu
