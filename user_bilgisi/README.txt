GLOBAL LIDERLIK (user_bilgisi)
==============================
Bu klasor, tum kullanicilarin skorlarini tek bir dosyada (scores.json) tutar.
Liderlik paneline basildiginda sunucudan liste cekilir; oyun bitince skor sunucuya gonderilir.

Kullanım:
1. Oyunu PHP destekleyen bir siteye yukleyin (ornegin hosting'de PHP acik olmali).
2. user_bilgisi klasorunu ve icindeki api.php, scores.json dosyalarini birlikte yukleyin.
3. scores.json dosyasinin yazilabilir olmasi gerekir (sunucuda chmod 666 veya PHP kullanicisinin yazma izni).

API:
- GET  user_bilgisi/api.php  -> Liderlik listesini JSON olarak dondurur.
- POST user_bilgisi/api.php  -> Body: {"name":"...", "score":5000, "kills":120, "time":180}. Skoru listeye ekler (en fazla 100 kayit).

Not: Sadece statik HTML/JS yukleyecekseniz (PHP yok), liderlik sadece o cihazda (localStorage) calisir; LEADERBOARD_API_URL app.js icinde "" yapilabilir.
