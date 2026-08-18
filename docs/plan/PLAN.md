# ANA PLAN - Killgram / ZONK

Hedef: Megabonk seviyesinde (AA hissiyatli) voxel-cartoon survivor. Solo mod + P2P coop tower defense modu.
Ilerleme takibi ve guncel durum: **STATUS.md** (bu dosyada durum tutulmaz, plan degistiginde burasi guncellenir).

---

## 1. Mevcut Durum Denetimi (18 Agu 2026)

Gercekler (satir numaralari kayabilir, guncelini STATUS'ta tut):

| Konu | Durum |
|---|---|
| Kod | `app.js` tek dosya, ~15.850 satir, duz script (module degil). `index.html` Three.js 0.159'u unpkg CDN'den importmap ile cekiyor. |
| Build | Kokte `package.json` YOK (sadece package-lock). `node_modules` icinde vite, playwright, gltf-transform kurulu ama kullanilmiyor. |
| Render | `init()` app.js:1871. Pixel ratio 0.5'e sabit (app.js:1883) - o yuzden goruntu bulanik. Golge haritasi 28x28 (app.js:1942) - golgeler bozuk. Antialias kapali, ACES tonemapping acik. |
| Performans | Instancing YOK, object pooling YOK, geometry/material paylasimi YOK. 536 ayri `new *Geometry(...)` cagrisi; her dusman spawn'inda yeni geometry+material yaratiliyor (`createEnemy` app.js:5697, ~1200 satir). En buyuk sorun bu. |
| Dusman modelleri | Tamamen primitive (kure/silindir/kutu) birlestirmeleri. ~30 yaratik tipi + boss varyantlari. Sanat dili yok. |
| Multiplayer | Sifir. Hicbir network kodu yok. |
| Map | `buildWorldChunked` (app.js:2300) + harita basina buildWorld* fonksiyonlari. Rampalar/platolar el ayari (`HILLS` app.js:1551, `PLATEAUS` 1569, `RAMP_ZONES` 1629) - bazi acilar terrain orneklemesiyle uyusmuyor. |
| Portal/Boss | `spawnPortal` 7798, `enterPortal` 8021, `spawnBoss` 7179, MAX_CHAPTER=3. Herobrine/Angel ozel bosslari var. "3 portal -> ozel boss odasi" mekanigi YOK. |
| UI | HTML/CSS overlay tabanli, islevsel ama ham. Levelup ekrani (`renderLevelupCards` 13498) basit kart listesi. Ana menu duz buton yigini. |
| Test | `tools/qa/shot-director.mjs` Playwright smoke testi mevcut ve calisir durumda (localhost:5173 bekliyor). |
| Turret | Zaten mini bir turret sistemi var (`spawnTurret` 9931, `updateTurrets` 9962, TURRET_* sabitleri 594) - TD modu icin cekirdek olarak genisletilebilir. |

## 2. Kod Haritasi (hizli navigasyon)

Grep deseni onerisi: `^function isim` ile ara.

- Dunya kurulumu: `buildWorldChunked` 2300, `buildWorldClassic` 2562, `sampleTerrainHeight` 1730, `getGroundHeight` 1793, `getRampHeight` 1645
- Oyuncu: `buildPlayer` 3943, `updatePlayer` 10565, `resolvePlayerCollision` 8126
- Dusmanlar: `createEnemy` 5697, `spawnEnemy` 7058, `updateEnemies` 11141, `killEnemy` 10166, `applyDamageEnemy` 10387
- Bosslar: `spawnBoss` 7179, `createHerobrineBoss` 6883, `createAngelBoss` 6955, `spawnVoidBossAt` 7878, `spawnTempleBossAt` 7902
- Portallar: `spawnPortal` 7798, `updatePortal` 7975, `enterPortal` 8021, `addRandomTeleportPortals` 15291, `addHardcorePortal` 15378
- Skiller: `pickSkills` 13249, `applySkill` 13320, `updateAbilities` 12306, `SKILL_TREE_NODES` 510, `ULT_DEFS` 544
- Levelup UI: `openLevelup` 13464, `renderLevelupCards` 13498, `chooseLevelCard` 13591
- HUD: `updateHud` 14054, `drawMinimap` 14467, `updateSkillBar` 14398
- Ana dongu: `animate` 15551
- Etkinlikler: Breach 9097, Abyss 9313, Ritual 9472, Shrine 3824, Chest 9810
- Turret: `spawnTurret` 9931, `updateTurrets` 9962

---

## 3. Fazlar

Siralama bagimlilik sirasidir. P0 ve P1 bitmeden gorsel ise girme (cop is olur: optimize edilmemis sisteme cizilen her sey yeniden yazilir).

### P0 - Altyapi ve Temel (once bu)

Amac: Ajanlarin guvenle calisabilecegi zemin.

- [ ] Kokte `package.json` olustur (vite, three@0.159 lokal, @playwright/test dev dep). `npm run dev` -> vite, `npm run qa` -> shot-director.
- [ ] `index.html`'i CDN importmap'ten lokal three'ye gecir. `app.js` duz script kalabilir (modullestirme P0'da DEGIL - riskli, sona birak).
- [ ] `.gitignore` (node_modules, dist, tests/artifacts).
- [ ] `tools/qa/perf-probe.mjs` yaz: oyunu baslat, 60 sn kos, her 5 sn `renderer.info` (drawCalls, triangles, geometries, textures) + FPS orneklemesi al, JSON rapor yaz. (TEST-PLAYBOOK'ta ayrinti)
- [ ] Baseline olc ve STATUS'a yaz: menu FPS, oyun ici 0/50/150 dusmanda FPS + draw call.

Kabul: `npm run dev` calisiyor, `npm run qa` yesil, baseline sayilari STATUS'ta.

### P1 - OPTIMIZASYON (en kritik faz)

Amac: 150 dusman + efekt yagmurunda orta sinif makinede 60 FPS; pixel ratio'yu 0.5 hack'inden kurtarmak.

Sira onemli, her adimdan sonra perf-probe kos ve farki STATUS'a yaz:

- [ ] **1.1 Paylasilan geometry/material cache.** Modul-ustu `GEO` ve `MAT` cache objesi: `getGeo("sphere_r0.5_8_6")` gibi anahtarla. `createEnemy` ve tum make*Mesh fonksiyonlarindaki `new *Geometry` cagrilarini cache'e yonlendir. Materyaller renk bazli anahtarlanir. Hedef: spawn sirasinda sifir geometry allocation.
- [ ] **1.2 Dusman havuzu (pooling).** Yaratik tipi basina insa edilmis Group'lari `killEnemy` sonrasi dispose etmek yerine havuza koy; `spawnEnemy` once havuzdan alsin. HP bar sprite'lari ve name label'lar da havuzlanir.
- [ ] **1.3 Proje ktil/efekt/damage-text havuzu.** `spawnProjectile`, `spawnBurst`, `spawnDamageText`, orb'lar. Canvas tabanli damage text'ler icin sprite havuzu + onceden render edilmis rakam atlasi.
- [ ] **1.4 Dekor instancing.** Agac, cim, cicek, tas: tip basina `InstancedMesh`. `updateWorldDecors` (13632) chunk sistemini instansa gecir (chunk = instance araligini gorunur/gizli yapmak).
- [ ] **1.5 Statik dunya birlestirme.** Binalar, duvarlar, koy propplari: materyal basina `BufferGeometryUtils.mergeGeometries`. Hedef: statik dunya < 40 draw call.
- [ ] **1.6 Render ayarlarini duzelt.** Pixel ratio 0.5 -> `min(devicePixelRatio, 1.5)` (ayarlardan secilebilir). Golge haritasi 28 -> 1024, PCF. Bunlar ancak 1.1-1.5 sonrasi acilabilir.
- [ ] **1.7 Dispose denetimi.** `clearWorld`/`clearEntities` gecislerinde `renderer.info.memory.geometries` sizinti kontrolu (perf-probe raporluyor). Run restart x5 sonrasi geometry sayisi sabit kalmali.
- [ ] **1.8 Update maliyeti.** `updateEnemies` icinde uzaktaki dusmanlara (o(>40m)) seyrek tick (her 3 frame'de bir AI). Minimap cizimi 60fps yerine 10fps.

Kabul (perf-probe ile): 150 dusman + aktif savas: >=55 FPS, <=700 draw call, pixel ratio >=1.0, 5 restart sonrasi geometry sayisi stabil.

### P2 - Voxel Gorsel Cekirdek

Amac: Tum yaratik/prop uretiminin gececegi tek voxel boru hatti. Ayrinti: ART-DIRECTION.md.

- [ ] **2.1 VoxelModel fabrikasi.** `voxel.js` (ayri dosya, index.html'e script olarak eklenir): girdi = kompakt voxel tanimi (katman string'leri veya kutu listesi + palet), cikti = TEK merged BufferGeometry (vertex color, ic yuzeyler ayiklanmis) + isteğe bagli adlandirilmis parcalar (kol, bacak, kafa - prosedurel animasyon icin ayri mesh).
- [ ] **2.2 Outline sistemi.** Inverted hull: voxel geometrisinin siyah, BackSide, %4-6 sisirilmis kopyasi; ayni draw call'a yakin maliyet icin outline'lar tip basina tek instanced mesh. Post-process OUTLINE KULLANMA (perf + pixelated stil uyumsuz).
- [ ] **2.3 Toon isiklandirma.** `MeshToonMaterial` + 3 basamakli gradient map, veya vertex-color + custom onLighting chunk. Tum voxel modeller ayni 2 materyali paylasir (opak + emissive).
- [ ] **2.4 Voxel prop seti.** Agac, kaya, cit, fener, sandik, portal cercevesi, sunak - decor instancing (1.4) ile ayni yoldan.
- [ ] **2.5 Oyuncu karakterleri voxel'e gecir** (9 karakter, `buildPlayer` 3943). Renk ozellestirme (govde/pelerin/zirh) palet swap ile korunur.

Kabul: shot-director goruntulerinde tutarli outline + toon look; yaratik tipi basina <=2 draw call (govde+outline); FPS P1 seviyesinden dusmemis.

### P3 - Yaratik Reworku (teker teker)

Amac: ~30 yaratigin tamami voxel fabrikasindan, her biri okunur siluet + kisisellik. Brief'ler: ART-DIRECTION.md bolum 4. Ilerleme tablosu: STATUS.md.

- [ ] Her yaratik icin: voxel tanimi yaz -> prosedurel animasyon (yurume salinimi, saldiri telegrafi) -> hitbox/radius dogrula -> shot-director ile tekil ekran goruntusu -> STATUS tablosunda isaretle.
- [ ] Oncelik sirasi: (1) classic map ilk 5 dakikada gorunenler (goblin, kurt, iskelet, orumcek, yarasa, slime), (2) diger classic/forest, (3) desert/ice/swamp ozel tipleri, (4) breach/abyss/ritual tipleri.
- [ ] Ucan dusmanlar (`createFlyingEnemy` 4229) ve golge dusmanlar (`createShadowEnemy` 4308) ayni fabrikaya tasinir.

Kabul: `createEnemy` icinde hicbir inline `new *Geometry` kalmadi; tum tipler ART-DIRECTION kontrol listesinden gecti.

### P4 - Boss Sistemi + 3 Portal Boss Odasi

- [ ] **4.1 Boss modelleri.** Mevcut boss varyantlari + Herobrine + Angel + Void + Temple bosslari icin voxel brief'leri ART-DIRECTION bolum 5'te. Bu brief'ler Opus'a uretim icin verilecek; uretilen tanimlar `voxel.js` formatinda koda girer. Boss'lar buyuk (24-40 voxel yukseklik), 2-3 animasyonlu parca, belirgin saldiri telegrafi.
- [ ] **4.2 Portal ilerleme sayaci.** Oyuncu her chapter portalindan gectiginde sayac artar (state.portalsEntered). HUD'da 3 yuvali gosterge (portal ikonu dolar).
- [ ] **4.3 Ozel boss odasi.** 3. portal sonrasi normal chapter yerine "Boss Odasi" sahnesi: ayri kucuk arena (60x60, kacissiz, dekoratif duvar), tek mega boss (mevcut MEGA_BOSS_HP_MULT=25 hattini kullan), oda boyunca daralan guvenli alan opsiyonel. Boss olunce: ozel odul (unique kart secimi + kozmetik/meta para) + kosuyu bitirme veya "sonsuz mod"a devam secenegi.
- [ ] **4.4 Boss dovus tasarimi.** Her boss: 2 faz, faz gecisinde saldiri deseni degisir; tum alan saldirilari zeminde telegraf halkasiyla (spawnTelegraph 10080 mevcut, kullan).

Kabul: 3 portal gecisi -> boss odasi -> kill -> odul akisi bastan sona oynanir; shot-director'a boss odasi sahnesi eklendi.

### P5 - Solo Map Iyilestirme (yeni map YOK, mevcut gelisir)

- [ ] **5.1 Geometri denetimi.** `tools/qa/map-audit.mjs`: RAMP_ZONES/PLATEAUS/HILLS uzerinde grid taramasi, her noktada `sampleTerrainHeight` ile mesh yuksekligi farkini olc; esik ustu sapmalari ve >50 derece egimli yurunebilir yuzeyleri raporla. Yanlis acili rampa/plato acilarini bu rapora gore duzelt.
- [ ] **5.2 Obje hizalama.** Binalar/citler/lambalar zemine gomulu veya havada asili olmasin: yerlesim fonksiyonlarina `snapToGround + normal hizalama` yardimcisi. Denetim: map-audit ekran taramasi.
- [ ] **5.3 Okunabilirlik.** Bolge kimlikleri guclensin: koy / gol / tapinak / plato bolgelerine ayirt edici palet ve landmark (ART-DIRECTION bolum 6). Yol/patika dokusuyla oyuncuyu shrine-portal-koy arasinda yonlendir.
- [ ] **5.4 Akis ayari.** Dar bogazlarda dusman sikismasi ve oyuncunun takildigi koseleri playtest botuyla tespit et (TEST-PLAYBOOK bolum 4), collider'lari yuvarla.

Kabul: map-audit temiz (0 kritik sapma); 10 dk botlu playtest'te takilma yok.

### P6 - UI/UX Polish

- [ ] **6.1 Ana menu.** Arka planda canli 3D sahne (donen voxel diorama: karakter + birkac dusman idle). Logo yeniden tasarim, buton hover/pres animasyonlari, gecislerde 150ms fade. Karakter secimi lobby'den once buyuk kartlarla.
- [ ] **6.2 Levelup ekrani detaylandirma.** Kartlara: nadirlik cercevesi + renk, skill ikonu (SVG/canvas, emoji degil), mevcut seviye -> yeni seviye stat farki satiri ("Hasar 24 -> 31"), sinerji rozetleri ("Fireball ile birlesir"), kart girisinde kademeli deal animasyonu, secimde patlama efekti. Reroll butonu maliyetiyle birlikte kartlarin altinda.
- [ ] **6.3 HUD.** Chip'ler tek tutarli stile (kose, font, golge); XP bari seviye atlarken parlama; hasar alinca vinyet zaten var, tutarlilastir. Minimap cercevesi voxel-cartoon stile.
- [ ] **6.4 Tipografi/ikonografi.** Tek pixel/rounded font sec, TUM emojileri ikonlarla degistir (levelup basligindaki dahil).

Kabul: shot-director'in menu/levelup/HUD goruntuleri ART-DIRECTION bolum 7 kontrol listesinden geciyor.

### P7 - Yeni Skiller ve Ozellikler

Mevcut sistem genis (ABILITY_UNLOCK_IDS 13177). Eklenti onerileri - her biri bagimsiz, paralel yapilabilir:

- [ ] **7.1 Evrim sistemi.** Max seviye skill + eslesen pasif = evrimlesmis skill (Megabonk/VS cekirdek dongusu). Ilk 6 evrim: Fireball+dmg->Inferno Orb, Frostball+slow->Glacier, Swords+crit->Blade Storm, Arrow+multishot->Arrow Wall, Lightning+cd->Storm Caller, Aura+area->Cataclysm Field.
- [ ] **7.2 Yeni aktif skiller (6).** Chain Lightning (sekme 4), Black Hole (cekme+patlama), Sanctuary (duran iyilestirme alani), Ricochet Disc (duvardan seken), Poison Trail (yurudugun yerde iz), Mirror Image (sahte kopya, dusman cekar).
- [ ] **7.3 Yeni pasifler (6).** Thorns (yansitma), Greed (gold +%, drop +), Momentum (hareket halinde hasar+), Executioner (%15 alti HP infaz), Vampirism (can calma kucuk), Overcharge (ult cooldown -).
- [ ] **7.4 Kusatma dakikalari.** Her 5. dakika 30 sn "horde surge" (mevcut soul round hattini kullan, 952) - odul sandigi.

Kabul: her yeni skill kart olarak cikiyor, tab panelde gorunuyor, evrimler calisiyor; balans ilk gecis icin kaba (playtest notlariyla STATUS'a).

### P8 - P2P Online Coop (lobby + sync)

Yeni dosya: `net.js`. Teknoloji karari:

- **Oneri: [trystero](https://github.com/dmotz/trystero)** - sunucusuz WebRTC eslesmesi (public BitTorrent/Nostr relaylari uzerinden sinyallesme), oda kodu ile katilma, data channel API'si temiz. Sunucu maliyeti sifir. Alternatif: PeerJS + PeerServer Cloud (daha olgun ama sinyal sunucusuna bagimli).
- Mimari: **host-authoritative.** Host tum simulasyonu kosar (mevcut kod zaten tek-dunya varsayiyor); konuklar input gonderir (60Hz input, 12Hz snapshot). Dusman/mermi/orb durumu snapshot'ta id'li kompakt dizilerle; interpolasyon konukta.
- [ ] **8.1 Lobby.** Ana menuye "COOP" -> oda kur (6 harfli kod) / odaya katil. Lobby ekraninda: oyuncu listesi + karakter secimleri canli sync, harita/mod secimi sadece host, "hazir" isaretleri, host BASLAT.
- [ ] **8.2 Oyuncu replikasyonu.** Konuk oyuncular hostta gercek entity; digerlerinin ekraninda interpolasyonlu kukla (voxel model + isim etiketi). Skill efektleri event mesajiyla ("cast" olayi) replike edilir, hasar hesabi yalniz hostta.
- [ ] **8.3 Ortak sistemler.** XP/gold paylasimli mi ayri mi -> ayri XP, ortak gold (TD icin gerekli). Levelup ekrani kisisel, oyunu DURDURMAZ (coop'ta pause yok, kart secimi 10 sn zaman limitli).
- [ ] **8.4 Kopma/yeniden baglanma.** Konuk duserse entity'si 60 sn bekler; host duserse oyun biter (v1 icin host migration YOK - kapsami sisirme).

Kabul: TEST-PLAYBOOK bolum 5'teki 2-tarayicili sync testi geciyor (pozisyon sapmasi <0.5m, 10 dk kopmasiz).

### P9 - Coop Tower Defense Modu + Yeni Map

Solo moda DOKUNMA; TD yalnizca coop (ve istege bagli solo-TD) ayri mod.

- [ ] **9.1 Yeni TD haritasi (sifirdan, voxel-based).** Tasarim sureci ve test dongusu TEST-PLAYBOOK bolum 4'te. Ozet yapi: merkezde savunulacak **Cekirdek (Nexus obelisk)**; 3 ana dusman yaklasim koridoru (kuzey/dogu/bati) + koridorlar arasinda farm acik alanlari; koridor agizlarinda dogal turret platformlari; harita solo map'ten kucuk (yaricap ~180) ki koridor savunmasi anlamli olsun. Once greybox (duz renkli bloklar) -> playtest -> sonra voxel dekor.
- [ ] **9.2 Cekirdek.** HP'li yapi; dusman dalgalari cekirdege yurur (oyuncu yoksa bile). Cekirdek olurse oyun biter. Dalga arasi 45 sn hazirlik.
- [ ] **9.3 Turret sistemi.** Mevcut turret kodunu (9931) genislet: gold ile yerlesim noktalarina insa (ok kulesi / yavaslatan buz / alan hasari mortar / gold ureten mayin), 3 kademe upgrade, satma. Yerlesim UI'i: noktaya yaklas + F.
- [ ] **9.4 Megabonk dongusu korunur.** Oyuncular ayni anda kendi skill build'lerini yapar (XP/levelup aynen); gold ortak havuz, turret harcamasi oylamasiz (ilk gelen harcar - basit tut).
- [ ] **9.5 Dalga tasarimi.** 20 dalga; 5/10/15 bossu, 20 final mega boss. Dalga ilerledikce koridorlar ayni anda aktiflesir (1 -> 2 -> 3 koridor).

Kabul: 2 kisiyle 20 dalga bastan sona oynanabilir; cekirdek/turret/gold dongusu calisir; solo mod etkilenmemis (regresyon: shot-director).

### P10 - AA Cila Pasi (surekli)

- [ ] Ses: vurus/kill/levelup seslerinin cesitlenmesi, boss muzigi, TD dalga korna sesi.
- [ ] VFX: kill'lerde voxel parcalanma (kucuk kup patlamasi - instanced, havuzlu), hit-stop zaten var, tutarlilastir.
- [ ] Meta ilerleme: kosu sonu para -> kalici kucuk upgrade agaci (ana menuden).
- [ ] Basari/istatistik ekrani, ayarlarin gozden gecirilmesi, epilepsi/foto-hassasiyet ayari.
- [ ] app.js modullestirme (EN SON, her sey stabilken): once `voxel.js`/`net.js` gibi yeni kod zaten ayri; sonra sistem basina cikarma.

## 4. Paralellik Haritasi

```
P0 -> P1 -> P2 -> { P3 (yaratiklar), P4 (bosslar), P5 (solo map), P6 (UI), P7 (skiller) }  [hepsi paralel]
P1 -> P8 (coop)  [P2-P7'den bagimsiz baslayabilir]
P8 + P2 -> P9 (TD modu)
P10 surekli, her fazin ardindan
```

Ayni anda calisan iki ajan ayni fonksiyona dokunmasin: STATUS'taki workstream tablosunda "sahip" alanini isaretle.

## 5. Riskler

- **Tek dosya catismasi:** iki ajan ayni anda app.js'e yazarsa kayip olur. STATUS'ta kilit al ("app.js: P3 calisiyor").
- **P1 atlanirsa** voxel gecisi FPS'i daha da dusurur; sira kesinlikle P1 -> P2.
- **Coop kapsam sismesi:** v1'de host migration, chat, 4+ oyuncu YOK. 2-4 oyuncu, oda kodu, bitti.
- **Three 0.159 eski.** Surum yukseltme AYRI is, plan disi; kimse "bu arada three'yi de guncelleyeyim" demesin.
