# AI-Powered Flashcards — PRD (Tam ve Detaylı)

**Proje Adı:** AI-Powered Flashcards

**Hazırlayan:** \[Senin ismin]

**Tarih:** \[Güncel tarih]

---

## 1. ?? Proje Özeti ve Vizyon

Bu proje, dil öğrenen kullanıcıların kelime ezberini klasik flashcard yönteminden çıkarıp **AI destekli, görsel, işitsel ve bağlamsal** bir hala getirmeyi amaçlamaktadır.

**Temel akış:**

* Kullanıcı, öğrenmek istediği bir kelimeyi girer.
* Uygulama:

  1. **Her tekrar için farklı cümleler** üretir (boşluklu cloze test).
  2. **AI görseli** ekler (abartılı, ezber kolaylaştırıcı).
  3. **Gemini TTS** ile kelime + cümleleri seslendirir.
* **Spaced Repetition (SM-2)** algoritması ile Anki benzeri tekrar planlaması yapılır.
* Hem **web** hem **mobil uyumlu (PWA)** çalışır.

**Vizyon:** Bu ürün yalnızca bir flashcard değil, kişisel bir **“AI dil koçu”** olacak.

---

## 2. ?? Hedef Kitle

* İngilizce öğrenmeye yeni başlayanlar (Beginner).
* Orta/ileri düzey öğrenciler (Intermediate/Advanced) › bağlamsal öğrenme.
* Anki gibi uygulamaları deneyip fazla sıkıcı bulanlar.
* Hem mobil hem PC’den erişmek isteyenler.

---

## 3. ?? Hedefler

1. Kullanıcılara **dinamik, sıkıcı olmayan** flashcard deneyimi sunmak.
2. **Spaced repetition** ile kalıcı öğrenmeyi sağlamak.
3. **Çoklu modalite** (görsel + işitsel + bağlamsal öğrenme) entegrasyonu.
4. Mobil uyumluluk (PWA).
5. İlk 3 ayda minimum **1000 aktif kullanıcı**ya ulaşmak.

---

## 4. ?? Kullanıcı Akışları

### 4.1 Yeni Kullanıcı

1. Ana sayfaya girer.
2. Google / Email ile kayıt olur.
3. Hoş geldin turu › uygulamanın nasıl çalıştığını gösterir.
4. İlk kelimesini ekler › ilk flashcard üretilir.

### 4.2 Yeni Kelime Ekleme

1. Kullanıcı kelimeyi girer: “delicious”.
2. Supabase › `words` tablosuna kayıt.
3. AI API › ilk görsel üretilir (Supabase storage).
4. AI API › 3 boşluklu cümle üretilir.
5. Flashcard hazır › çalışmaya başlar.

### 4.3 Tekrar Etme

1. “Today’s Cards” sekmesine girer.
2. Supabase’den due\_date = bugün olan kartlar gelir.
3. Ön yüz › 3 yeni cümle (AI’den).
4. Kullanıcı tahmin eder.
5. Flip › arka yüz › kelime + görsel + ses.
6. Kullanıcı “Again / Hard / Easy” seçer.
7. SM-2 algoritması › Supabase `reviews` tablosu güncellenir.

### 4.4 Dinleme

* Cümlelerin yanında ?? buton › Gemini TTS çağrısı.
* Arka yüzde kelimenin seslendirmesi › ?? buton.

### 4.5 İstatistik Görüntüleme

* “Progress” sekmesi › toplam kelime, tekrar sayısı, retention oranı, seviye.

---

## 5. ?? Özellikler

### 5.1 Temel Özellikler

* Kullanıcı Auth (Google, Email).
* Kelime ekleme.
* Dinamik AI cümle üretimi.
* Görsel üretimi (AI).
* TTS (Gemini).
* Spaced Repetition (SM-2).
* PWA desteği.

### 5.2 Gelişmiş Özellikler (V2+)

* Kullanıcı kendi cümlesini yazıp doğrulatabilir.
* Deck paylaşma.
* Multiplayer quiz.
* Shadowing (ses kaydı analizi).
* Çoklu dil desteği.

---

## 6. ?? Teknik Mimari

### 6.1 Frontend

* **Framework**: Next.js (React tabanlı, SEO + SSR avantajı)
* **UI**: TailwindCSS + Shadcn UI (kart tasarımları, responsive)
* **PWA**: Service Worker + ma
