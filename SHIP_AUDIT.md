# Zegabonk Ship Audit

**Baseline tarihi:** 15 Ağustos 2026 (Windows 11, headless Chromium, 1280×720 CSS viewport; v2 Vite dev sunucusu `http://127.0.0.1:4175/`). Bu not yalnızca bu inceleme anındaki kaynak ve çalışma zamanı kanıtını özetler.

## Kapsam ve sistem haritası

- **Legacy rota:** kök `index.html` + `app.js` + `styles.css`. `app.js` renderer, dünya üretimi, simülasyon, input, ses, HUD/menu, VFX ve persistence çağrılarını tek büyük global dosyada topluyor. Handoff kaynakta `app.js` yaklaşık 15.955 satır olarak belgelenmiş; Repowise güncel sağlık görünümünde en zayıf dosya olarak `app.js` (5.5/10) işaretliyor.
- **V2 rota:** `v2/src/main.ts` → `GameApp` → `Simulation`, `InputController`, `WorldRenderer`, `AppShell`, `AudioDirector`. Sabit adımlı simülasyon `GameApp.frame` içinde 60 Hz (`v2/src/app/GameApp.ts:116-160`).
- **Kontrol/kamera:** `v2/src/core/InputController.ts:83-95` camera-relative WASD; pointer lock ve mouse look `:117-140`; pointer lock kaybı oyunu duraklatıyor (`GameApp.ts:87-95`).
- **Savaş/ilerleme:** `v2/src/core/Simulation.ts:274-305, 496-533`. XP seviye atlatıyor, üç upgrade seçeneği var; normal düşman hedefi sonrası portal, 3. aşamada guardian/Grom ve zafer yolu `:535-563`.
- **Render/aktör/FX:** `v2/src/render/WorldRenderer.ts:279-425, 953-1140, 1330-1430`; düşük maliyetli düşmanlar InstancedMesh, seçili hero/enemy/boss GLB’leri ayrıntılı aktör olarak yükleniyor.
- **Ses:** `v2/src/audio/AudioDirector.ts:5-14, 17-73`; menu ve oyun müziği dosyaları var, `play().catch(() => {})` nedeniyle tarayıcı autoplay reddi kullanıcıya görünür hata vermeden sessizce geçiyor.
- **Profil/progression:** `v2/src/core/ProfileStore.ts:3-10, 78-100`; localStorage tabanlı yerel profil ve run kaydı. Kök legacy persistence `user_bilgisi/api.php` çağrısına bağlı.
- **Varlıklar:** `v2/src/assets/AssetManifest.ts:20-108`; runtime GLB yolları `v2/public/assets/models/` içinde mevcut. Kök legacy GLTF tablosu `app.js:2117-2130`, oyuncu GLB yolu `:2162`.

## Kısa headless smoke kanıtı

1. V2 açıldı; başlık `ZEGABONK V2 - Crownfall`, ana menüde `MACERAYA BASLA` ve `AYARLAR` erişilebilir.
2. `MACERAYA BASLA` → `SEFERE CIK` ile oyun başlatıldı. Yaklaşık 10 saniyede HUD şunları gösterdi: `LEVEL 1`, `118/120`, `MOSSWATCH HARABELERI / BOLUM 1`, `2/45 BONK`, skor, XP ve `WASD / Q / E / ESC` ipuçları. Ekran görüntüsünde hero, düşmanlar, ağaç/taş çevresi, mavi saldırı telegraph’ları ve alt HUD görünür.
3. `?stress=200` geliştirici rotasında yaklaşık 2.5 saniye sonra gerçek DOM/perf durumu: `200 ENEMY`, `225 FPS`, `4.4 ms`, `74 CALL`, `54741 TRI`. Bu yalnızca headless hafif/özel stress koşuludur; monitör FPS’i veya 5–10 dakika bellek kararlılığını kanıtlamaz.
4. Bu kısa koşuda blank canvas, yükleme exception’ı veya asset 404’ü gözlemlenmedi. Boss, portal geçişi, ölüm/yeniden deneme ve dar viewport bu koşuda tamamlanmadı; başarısız deneme değil, **doğrulanmamış** kapsamdır.
5. Menü screenshot’ında alt `YOL HARITASI / GERI BILDIRIM / SEFER NOTLARI` metinleri küçük genişlikte birbirine çok yaklaşıyor/çakışıyor. Bu görsel bulgu çalışma zamanı screenshot’ına dayanır; kök legacy menü için genellenemez.

## Öncelikli açıklar

### P0 — doğrulanmış blocker yok

Bu baseline’da P0 sınıfında kanıtlanmış blank canvas, uncaught exception, input kaybı, softlock veya kırık restart gözlenmedi. Portal/boss/victory/retry tam rotası çalıştırılmadığı için release PASS iddiası da çıkarılamaz.

### P1 — ship öncesi kapatılması veya açıkça kanıtlanması gerekenler

1. **Tam rota henüz kanıtlanmadı (portal → aşama 2/3 → Grom → zafer → profil kaydı).**
   - **Kanıt:** `Simulation.ts:535-557` portal gate ve guardian geçişini içeriyor; `:511-533` guardian ölümüyle `victory` veriyor. Smoke yalnızca aşama 1’in ilk saniyelerine ulaştı.
   - **Sahip:** `v2/src/core/Simulation.ts` (`updateRoute`, `advanceToNextStage`, `spawnGuardian`, `killEnemy`), `v2/src/ui/AppShell.ts` (portal/boss/result HUD), `v2/src/app/GameApp.ts:143-151`.
   - **Kabul kontrolü:** temiz Chromium’da hedefli QA hook veya gerçek oynanışla üç aşamayı tamamla; her aşamada `state.stage` 1→2→3, portal yakınında E ile `routePhase` değişimi, boss HUD görünürlüğü, Grom ölümüyle `outcome=victory`, sonuç ekranı ve tekrar başlatmada yeni `runId` gözlemlensin. Konsol/network hatası olmamalı.

2. **Legacy PHP persistence çalışma zamanı sunucusunda doğrulanmamış/kırık olabilir.**
   - **Kanıt:** `HANDOFF-CODEX.md:53-57,102-123` Python `http.server` altında `user_bilgisi/api.php` POST’unun 501 verdiğini kaydediyor; PHP-capable sunucu denenmemiş. Bu, PHP kodunun kendisinin bozuk olduğunu kanıtlamaz.
   - **Sahip:** `user_bilgisi/api.php`, legacy `app.js` `saveLeaderboard` (`:15358-15374`) ve leaderboard fetch/render (`:5257-5280`).
   - **Kabul kontrolü:** PHP destekli yerel sunucuda ölüm/zafer sonrası POST 2xx, kayıt listesi aynı oyuncu/run metadatasını geri döndürmeli; geçersiz skor/version reddedilmeli. Python server sonucunu başarı kanıtı sayma.

3. **V2 asset sözleşmesi manifest ile gerçek menü kullanımı arasında drift gösteriyor.**
   - **Kanıt:** `AssetManifest.ts:21-28` kaynak olarak `assets/ui/menu-keyart-v3.png`, runtime olarak `menu-keyart-v3.avif` bildiriyor; `v2/src/styles.css:31` gerçek CSS yolu `/assets/ui/menu-keyart-v5.png`. `v2/public/assets/ui/` içinde v5 PNG mevcut, v3 PNG mevcut değil (v3 AVIF/WebP mevcut). Bu doğrudan 404 demek değildir çünkü manifest keyart için kullanılmıyor; fakat tek kaynaklı asset ownership yok.
   - **Sahip:** `v2/src/assets/AssetManifest.ts`, `v2/src/styles.css:31`, ilgili `AppShell` menü yüzeyi.
   - **Kabul kontrolü:** production preview’da Network 404 taraması; menü keyart isteği manifest/runtime kararına göre tek beklenen dosyaya gitmeli, tüm manifest `source`/`runtimeUrl` kayıtları gerçek dosyalarla eşleşmeli.

4. **Menü alt navigasyonu 1280×720 screenshot’ında okunabilirlik sorunu gösteriyor.**
   - **Kanıt:** canlı screenshot’ta footer metinleri görsel olarak birbirine giriyor; markup `AppShell.ts:176`, stil `v2/src/styles.css:118`. Bu bir responsive/spacing bulgusudur, işlev kaybı kanıtı değildir.
   - **Sahip:** `v2/src/ui/AppShell.ts:176`, `v2/src/styles.css:30,51,76,118,280-302`.
   - **Kabul kontrolü:** 1280×720 ve 390×844 screenshot’larında footer/alt mod kartları ayrı ve okunaklı; metinler taşmamalı, ana CTA görünür kalmalı, klavye/ARIA ile CTA ve Ayarlar erişilebilir olmalı.

5. **Sesin gerçekten duyulduğu doğrulanmadı; autoplay reddi sessizce yutuluyor.**
   - **Kanıt:** `AudioDirector.ts:36-48,56-62` `HTMLAudioElement.play()` hatasını boş catch ile yutuyor. Kaynakta dosyalar var (`menu1..7.mp3`, `background.mp3`); smoke ses çıktısını ölçmedi.
   - **Sahip:** `v2/src/audio/AudioDirector.ts`, legacy `app.js:1236-1608`.
   - **Kabul kontrolü:** kullanıcı tıklaması sonrası menu ve oyun sesinde `HTMLMediaElement.paused=false`, `currentSrc` beklenen dosya, browser console’da unhandled rejection yok; ayarlardan ses kapat/aç ve oyun→menü geçişinde aynı anda iki parça çalmamalı. Headless sessizlik tek başına ürün bug’ı sayılmamalı.

### P2 — kapsam ve risk, blocker olarak sınıflandırılmamalı

- **Yoğun swarm ve uzun yaşam döngüsü:** özel `stress=200` ölçümü iyi göründü (`225 FPS/4.4 ms`), fakat 500+ düşman, 5–10 dakika, tekrar restart ve asset/renderer disposal doğrulanmadı. `GameApp.ts:163-180` perf hook var; gerçek release cihazında 200/500/1000 sınır testi ayrı yapılmalı.
- **Legacy monolit ve procedural/GLB karışımı:** `app.js` içinde çok sayıda dünya/actor/VFX üreticisi ve global state var. Bu maintainability/perf riski; tek başına kullanıcıya görünen bug kanıtı değil. Yeni mimari refactor henüz yapılmamalı.
- **Art/geometry:** V2 screenshot’ında okunabilir düşük-poly çevre, hero, düşman ve telegraph’lar gözlendi; üretim kalitesinin tüm harita/boss/animasyonlarında eşit olduğu kanıtlanmadı. `WorldRenderer.ts:1330-1430` GLB yüklerken fallback’i de tutuyor; tüm aktörlerin gerçek GLB olduğu varsayılmamalı.
- **Input/camera:** `InputController.ts:83-95,117-140` kod yolu tutarlı görünüyor; bu koşuda kontrollü mouse movement/pointer-lock yön testi yapılmadı. “Mouse camera bozuk” iddiası doğrulanmış bug değildir.
- **Progression/menu/HUD:** XP, üç upgrade ve yerel profil kodda mevcut (`Simulation.ts:496-509`, `ProfileStore.ts:78-100`); dopamine dengesi/uzun vadeli ekonomi kalite değerlendirmesidir, kısa smoke ile ölçülmez.

## Henüz yapma / ertelenmiş kapsam

- Tam rota kanıtı olmadan geniş combat, boss veya progression redesign’ı yapma.
- Sadece screenshot estetiği için legacy dekorasyonları topluca açma; handoff’a göre bu daha önce maliyet artırıp hedefi karşılamadı.
- Yeni dependency, yeni asset paketi, Blender/GLB yeniden üretimi veya lisans araştırmasını bu audit kapsamında başlatma.
- V2 ve legacy’yi aynı anda yeniden mimarileştirme; önce hangi rota ship edilecek kesinleştirilmeli.
- Uzun süreli bellek, gerçek düşük/orta cihaz FPS’i, controller/touch, dar viewport, PHP backend güvenliği ve rekabetçi skor doğrulamasını kısa headless smoke sonucundan çıkarma.
- Bu notta doğrulanmamış kullanıcı raporlarını (okunmaz hero, kırık mouse camera, sessizlik, stutter, zayıf harita/menu, malformed props, zayıf progression) kesin gerçek olarak etiketleme; yukarıdaki kabul koşullarıyla yeniden üret.
