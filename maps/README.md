# Harita dosyalari (Maps)

Menuden bir harita sectiginde o haritanin script'i bu klasorden yuklenir.

- **Dosya adi:** `maps/<mapId>.js` (ornegin `classic.js`, `ice.js`, `arena1.js`)
- **Yukleme:** Oyun baslarken `state.selectedMapId` ile secilen harita icin `maps/<mapId>.js` yuklenir. Dosya yoksa veya 404 olursa varsayilan `buildWorldChunked` app.js icinde calisir.
- **Kullanim:** Bu dosyalarda harita ozel ayarlar veya builder kaydedebilirsiniz. Ileride `window.__MAP_BUILDERS[mapId]` ile ozel builder tanimlanabilir; su an sadece script yuklenir, dunya yine app.js'deki `buildWorldChunked` ile kurulur.

Ornek: `maps/ice.js` ekleyip icinde harita ozel state ayarlari yapabilirsiniz. Boylece app.js patlamaz, harita kodu ayri dosyalarda durur.
