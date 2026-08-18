# TEST PLAYBOOK

Kural: "Bitti" demek = ilgili test kapisi kosuldu + sonuc STATUS'a yazildi. Test araclari `tools/qa/` altinda yasar.

## 1. Test Kapilari (hangi iste hangi test)

| Is turu | Zorunlu kapi |
|---|---|
| Her is (minimum) | Bolum 2: smoke test temiz (konsol hatasi 0) |
| Performans (P1) | Bolum 3: perf-probe, oncesi/sonrasi karsilastirma STATUS tablosuna |
| Gorsel (P2/P3/P4/P6) | Bolum 6: gorsel dogrulama goruntuleri |
| Map isi (P5/P9) | Bolum 4: map-audit + bot yuruyusu |
| Coop (P8/P9) | Bolum 5: 2-istemci sync testi |
| Herhangi buyuk degisiklik | Bolum 7: regresyon listesi |

## 2. Smoke Test (mevcut, calisiyor)

```sh
npm run dev          # vite, localhost:5173 (P0 sonrasi)
node tools/qa/shot-director.mjs
```

- Cikti: `tests/artifacts/*.png` + konsol/page hatalari stdout'ta.
- Gecme kosulu: 0 pageerror, 0 console error, tum goruntuler olusmus.
- Yeni ekran/mod eklendiginde shot-director'a adim EKLE (boss odasi, coop lobby, TD modu). Senaryo eklemek = o ozelligin test kapisina dahil olmasi.

## 3. Performans Probu (P0'da yazilacak: tools/qa/perf-probe.mjs)

Spek:
- Playwright ile oyunu baslat, `#hud` gorununce olcume basla.
- `page.evaluate` ile pencereye olcum kancasi ekle: her 5 sn'de `{ fps (son 300 frame ort), drawCalls: renderer.info.render.calls, triangles, geometries: renderer.info.memory.geometries, textures, enemies: enemies.length }` topla.
- Senaryolar: (a) bos harita 30 sn, (b) `spawnEnemy()` ile 50 dusman, (c) 150 dusman + oyuncu otomatik saldiri acik, 60 sn. (d) 5 kez restart -> geometry sizinti kontrolu (geometries sayisi artmamali).
- Cikti: `tests/artifacts/perf-<tarih>.json` + stdout ozet tablo.
- Sonuclar STATUS'taki "Performans Olcumleri" tablosuna islenir.

Hedefler (P1 kabulu): 150 dusman >=55 FPS, <=700 draw call, pixelRatio >=1.0, restart sonrasi geometry stabil.

## 4. Voxel Map Tasarim + Test Dongusu (P5 iyilestirme ve P9 yeni TD haritasi)

Map isi su dongunun disina cikmaz. Her tur ~1 seans:

**Adim 1 - Greybox.** Yeni geometri once duz renkli bloklarla (palet yok, dekor yok). Voxel dekor ancak Adim 4'ten sonra.

**Adim 2 - Otomatik geometri denetimi** (`tools/qa/map-audit.mjs`, P5.1'de yazilacak). Spek:
- Harita sinirlari icinde 2 birimlik grid tara; her noktada `sampleTerrainHeight(x,z)` ile gorunur mesh yuksekligi (raycast asagi) farkini olc. Fark > 0.35 birim = KRITIK (oyuncu havada yurur / gomulur).
- Egim kontrolu: komsu grid noktalari arasi egim > 50 derece ama bolge FLAT/RAMP tanimli = KRITIK (yanlis acili rampa).
- Obje kontrolu: scene'deki statik meshlerin bounding box alt yuzu ile zemin farki > 0.3 = UYARI (havada bina / gomulu cit).
- Cikti: `tests/artifacts/map-audit.json` (koordinat listesi) + isaretlenmis kusbakisi PNG (canvas'a nokta bas).
- Gecme: 0 KRITIK.

**Adim 3 - Bot yuruyusu.** shot-director tarzi script: oyuncuyu 8 yonde 30'ar sn otomatik yurut (`player.mesh.position` dogrudan degil, input simulasyonu ile), her 5 sn pozisyon kaydet. Ayni noktada >3 sn sikisti = takilma raporu + o noktadan screenshot. TD haritasinda ek: 3 koridorun her birinden Cekirdege dusman yolu yuruyerek test (path kesintisiz mi).

**Adim 4 - Kusbakisi + oyuncu gozu screenshot seti.** Kamerayi tepeden 4 kadran + her landmark onunden al. Kontrol: bolge renk kimligi ayirt ediliyor mu (ART-DIRECTION 6), landmark ekranda okunuyor mu, koridor/patika izlenebiliyor mu.

**Adim 5 - STATUS'a isle.** Audit sonucu + degisen sabitler (HILLS/PLATEAUS/RAMP_ZONES indexleri) not edilir ki sonraki ajan neyin duzeltildigini bilsin.

## 5. Coop Sync Testi (P8/P9)

`tools/qa/coop-sync.mjs` (P8.1 ile birlikte yazilacak). Spek:
- Tek Playwright process, 2 browser context: A host olur (oda kodu DOM'dan okunur), B kodla katilir.
- A ve B lobby'de karakter secer, A baslatir. Ikisi de `#hud` gorene kadar bekle.
- 5 dk otomatik oyun: A'da rastgele input simulasyonu, B'de de.
- Her 10 sn her iki taraftan `page.evaluate` ile durum ozeti cek: kendi pozisyonu, diger oyuncunun goruldugu pozisyon, dusman sayisi, gold, dalga no (TD'de).
- Gecme kosullari: pozisyon sapmasi < 0.5 birim (interpolasyon gecikmesi haric), dusman sayisi farki < 5, gold birebir esit, 5 dk kopma yok, iki tarafta da 0 konsol hatasi.
- Kopma senaryosu: B'nin context'ini kapat -> A'da B kuklasinin 60 sn icinde temizlendigini dogrula.

## 6. Gorsel Dogrulama (P2/P3/P4/P6)

- Yaratik isi: `tools/qa/creature-gallery.mjs` (P3 basinda yazilacak) - oyunu baslat, tum dusmanlari temizle, hedef yaratigi `createEnemy` ile kamera onune spawn et, 4 acidan screenshot (`tests/artifacts/creatures/<isim>-<aci>.png`). Kontrol listesi: outline her acidan kesintisiz, siluet ART-DIRECTION 4'teki tanimlayici ozelligi gosteriyor, goz emissive calisiyor, animasyon karesi dogal (T-pose degil).
- UI isi: shot-director goruntuleri ART-DIRECTION 7 listesiyle karsilastirilir.
- Onemli: gorsel isler "koda bakinca dogru" ile kapanmaz; screenshot cekilmeden BITTI isaretlenmez.

## 7. Regresyon Listesi (buyuk degisiklik sonrasi)

- [ ] Solo run baslar, dusman spawn olur, XP/levelup calisir (shot-director zaten kapsiyor).
- [ ] 6 haritanin hepsi yuklenir (lobby'den sirayla sec, konsol hatasi 0) - shot-director'a map dongusu adimi P0'da eklenebilir.
- [ ] Pause/ayarlar/skill agaci acilir kapanir.
- [ ] Restart -> ana menu -> tekrar baslat dongusu 3 kez (sizinti + state temizligi).
- [ ] perf-probe onceki olcumden >%10 gerilemedi.

## 8. Manuel Playtest Notlari

Otomasyon his'i olcemez. Buyuk fazlarin sonunda (P4, P6, P7, P9) kullaniciya manuel playtest talebi birak: STATUS'a "MANUEL PLAYTEST BEKLIYOR: <neyi denemeli>" satiri ekle. Kullanici geri bildirimi STATUS gunlugune islenir.
