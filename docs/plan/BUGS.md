# BUG AVI - Killgram / ZONK

Tarih: 2026-08-18. Yontem: `app.js` ilgili bolgelerinin okunmasi (read-only denetim, KOD DEGISTIRILMEDI).
Her madde okunarak dogrulandi; satir numaralari denetim anindaki `app.js` (~15.850 satir) icindir.

Siralama: CRITICAL -> HIGH -> MEDIUM -> LOW. Toplam 26 dogrulanmis bulgu.

---

## CRITICAL

### C1. Pause oyunun saatini durdurmuyor
- **Belirti:** ESC ile menuye girip 2 dakika bekleyip donunce Rage/Magnet/Insta-kill/Agir cekim buff'lari bitmis oluyor; ayrica birikmis Soul Round / Saldiri Round / zorluk basamaklari tek karede patliyor.
- **Yer:** `app.js:15558-15562`
- **Sebep:** `if (running) { state.time += dt; }` bloklari `paused` kontrolunun **disinda**. Guncelleme dongusu `if (running && !paused)` ile korunuyor ama saat degil. `openPauseMenu` (`app.js:4782`) `running`'i `true` birakiyor.
- **Duzeltme:**
```js
if (running && !paused) {
  if (hitFreezeTimer > 0) hitFreezeTimer -= dt;
  state.time += dt;
}
```

### C2. Sandik paneli kalici kilitleniyor (chestPanelOpen sifirlanmiyor)
- **Belirti:** Bir dunya sandigi acilirken olur/restart edersen, o oturumda bir daha HICBIR sandik acilamiyor. Ustelik o sandigin odulu yeni kosuya bedava skill olarak dusuyor.
- **Yer:** `app.js:8984` (tanim), `9044-9053` (acilis), `9772-9807` (`setInterval` + `setTimeout`), `9788` (`if (!chestPanelOpen) return;`), `startRun` `app.js:5361-5628` (sifirlama yok).
- **Sebep:** `chestPanelOpen` ne `startRun`'da ne `onPlayerDeath`'te sifirlaniyor. Roll animasyonunun `setInterval`/`setTimeout`'u hicbir yerde `clearInterval` edilmiyor. Panel acikken restart -> bayrak `true` kalir, `updateWorldChests`'teki `!chestPanelOpen` kosulu (`app.js:9044`) sonsuza dek false doner.
- **Duzeltme:** `startRun` ve `onPlayerDeath` icinde `chestPanelOpen = false; chestPanelSkill = null;` + roll handle'ini modul degiskeninde tut (`chestRollHandle`) ve ayni yerlerde `clearInterval(chestRollHandle)`.

### C3. Abyss cukuru kalici soft-lock (dalga sayaci vs dusman tavani)
- **Belirti:** Yesil Abyss halkasi haritada sonsuza kadar duruyor, dalga 2 hic gelmiyor, "Abyss tamamlandi" hic cikmiyor. 2 Abyss slotundan biri kalici doluyor ve o bolgeye baska etkinlik (Breach/Ritual) da spawn olamiyor.
- **Yer:** `app.js:9386` (`spawnAbyssEnemy` erken return), `9432` (dalga 1 spawn dongusu), `9436` (`killsThisWave >= wave1Total` kapisi), `9074-9083` (`getAllZoneCenters`).
- **Sebep:** `spawnAbyssEnemy` `enemies.length >= getMaxEnemies()` ise sessizce return ediyor. `getMaxEnemies()` seviye <= 25 icin **10** (`app.js:130-136`). Faz gecisi ise spawn edilen sayiyi degil, `wave1Total` (4+) sabitini bekliyor. 2 dusman spawn olduysa `killsThisWave` en fazla 2 olur, kapi asilmaz.
- **Duzeltme:** Gercekten spawn olan sayiyi say ve kapiyi ona bagla.
```js
function spawnAbyssEnemy(pit, isBoss) {
  if (enemies.length >= getMaxEnemies()) return false;
  ...
  return true;
}
// updateAbyssPits, idle -> wave1:
pit.wave1Spawned = 0;
for (let w = 0; w < pit.wave1Total; w++) if (spawnAbyssEnemy(pit, false)) pit.wave1Spawned++;
// kapi: if (pit.killsThisWave >= pit.wave1Spawned && pit.wave1Spawned > 0)
```
Ek olarak eksik kalanlari zamanla tamamlayan bir `pendingSpawns` sayaci (Breach'teki gibi) daha saglam olur. Ayni duzeltme `wave2` icin de gerekli.

---

## HIGH

### H1. `acquiredOrder` kosular arasi hic temizlenmiyor
- **Belirti:** Ikinci kosudan itibaren levelup kart havuzu daraliyor (yeni pasif cikmiyor, hep ayni "guclendirici" kartlar geliyor); levelup ekranindaki "Pasif" listesi onceki kosunun skillerini gosteriyor.
- **Yer:** Tanim `app.js:459`; `startRun` sifirlamasi `app.js:5560-5562` (`skillLevels`, `ownedSkills`, `currentChoices` temizleniyor, `acquiredOrder` **temizlenmiyor**); okundugu yerler `13244`, `13262`, `13516`, `14280`, `14328`, `14379`.
- **Sebep:** `countDistinctPassives()` (`app.js:13243`) eski kosularin pasiflerini de sayiyor. `MAX_PASSIVE_SKILLS = 7` (`app.js:422`) esigi ikinci kosuda daha 1. levelde asiliyor ve `pickSkills` havuzu `GENERIC_STRENGTHENER_IDS` + mevcut pasifler ile sinirliyor (`app.js:13261-13264`). Ayni dizi her kartla buyudugu icin sinirsiz buyume de var.
- **Duzeltme:** `app.js:5562` civarina `acquiredOrder.length = 0;` ekle.

### H2. `state.unlockedSkillIds` ve `state.chestsOpened` kosu boyu tasiniyor
- **Belirti:** Ikinci kosuda daha ilk levelup'ta Lifesteal / Execute / Chain Lightning / Shuriken gibi "kill ile acilan" skiller kart olarak cikiyor. Kilit acma bildirimleri de bir daha gorunmuyor.
- **Yer:** `app.js:5434` (`state.unlockedSkillIds = state.unlockedSkillIds || new Set()` - var olani koruyor), `9724` / `9791` (`state.chestsOpened++`), `13199-13224` (`SKILL_UNLOCKS` kosullari), `13253`/`13266` (havuz filtresi).
- **Sebep:** Ikisi de `startRun` icinde sifirlanmiyor. `unlock_sword_throw/boomerang/shuriken` sarti `s.chestsOpened >= 1/2/3` oldugu icin ikinci kosu bunlarla basliyor.
- **Duzeltme:** `startRun`'da `state.unlockedSkillIds = new Set(); state.chestsOpened = 0;`. Meta ilerleme istenirse ayri bir `state.metaUnlocks` seti tut, kosu havuzuna karistirma.

### H3. Eski challenge zamanlayicisi sonraki kosuyu oldururuyor
- **Belirti:** "5 dakika" challenge modunda oynadiktan sonra normal bir kosu baslatirsan, sebepsiz yere olum ekrani aciliyor (genelde 5. dakika civarinda, hicbir dusman degmeden).
- **Yer:** `app.js:5669` (`applyChallengeMode`, sadece `timer_5` icin yazar), `app.js:15701` (`if (state.challengeTimerEnd != null && state.time >= state.challengeTimerEnd) onPlayerDeath();`).
- **Sebep:** `state.challengeTimerEnd` hicbir yerde `null`'lanmiyor. Yeni kosuda `state.time` sifirlanir, eski deadline (or. 300) kalir; oyun 5. dakikayi gecince aninda `onPlayerDeath()`.
- **Duzeltme:** `applyChallengeMode` basina `state.challengeTimerEnd = null;` ekle (mode kontrolunden once).

### H4. "Sok" (shock) carpani HP dusuldukten SONRA uygulaniyor
- **Belirti:** Sok kartlarini aldikca hasar rakamlari buyuyor ama dusmanlarin can barlari ayni hizda inmiyor. Rakam ile gercek hasar tutmuyor.
- **Yer:** `app.js:10468` (`e.hp -= d;`) ve `app.js:10486` (`if (stats.shock) d *= 1 + stats.shock;`).
- **Sebep:** `d *= 1 + stats.shock` satiri `e.hp -= d` satirindan 18 satir sonra. Sonuc sadece `spawnDamageText` (`10552`) ve Runaan zincir hasarina (`10525`) yansiyor. `shock` max 6 x %14 + `pack_shock` %15 = %99'a kadar tamamen olu stat.
- **Duzeltme:** `if (stats.shock) d *= 1 + stats.shock;` satirini `e.hp -= d;` satirinin **ustune** tasi (herald bloklarinin hemen ardina).

### H5. Magnet kartlarinin hicbiri calismiyor (0 x carpan)
- **Belirti:** "Magnet menzil", "Magnet gucu", "Magnet Aura", shrine "Magnet +15%" ve dunya "magnet" pickup'i aliniyor ama XP orblari asla cekilmiyor. HUD'da Magnet hep 0.0.
- **Yer:** `baseStats.magnetRange = 0`, `magnetStrength = 0` (`app.js:378-379`); carpma ile artiran kartlar `app.js:1338`, `1339`, `1418`, `1425`; shrine perk `8789`; pickup `8815`. Tuketim `app.js:13063-13065` (`magnetR2 = stats.magnetRange * stats.magnetRange`, `magnetStr > 0` sarti `13088`).
- **Sebep:** Taban deger 0; `0 * 1.5 = 0`. Sadece skill agaci (`magnet1/magnet2`, toplayici, `app.js:525/531`) ve vending "Magnet Plus" (`app.js:14614`) 0'i kirabiliyor. Coin pickup'i `Math.max(5, stats.magnetRange)` (`app.js:13027`) kullandigi icin coinler cekiliyor, XP orblari cekilmiyor - bu yuzden hata gozden kaciyor.
- **Duzeltme:** Ya taban degerleri anlamli yap (`magnetRange: 2.5, magnetStrength: 6`), ya da kartlari toplamaya cevir:
```js
{ id: "magnet", ... apply(tv) { stats.magnetRange += (tv != null ? tv : 10) * 0.25; } }
```
Tercih: taban degeri ver (tek satir, tum kartlari ve buff'lari birden duzeltir).

### H6. Despawn olan dusmanlar GPU kaynagini sizdiriyor
- **Belirti:** 10-15 dakikalik kosuda FPS surekli dusuyor, GPU bellegi buyuyor; restart sonrasi da tam toparlamiyor.
- **Yer:** `app.js:11162-11167` (despawn: sadece `scene.remove`, dispose yok) ve `app.js:10197` (`killEnemy`: `material.dispose()` var ama `material.map.dispose()` yok).
- **Sebep:** Her dusman `makeHpBar` (`app.js:4373`, 128x16 CanvasTexture) + `makeNameLabel` (`app.js:4401`, 256x28 CanvasTexture) tasiyor. Despawn mesafesi 50 (`ENEMY_DESPAWN_DISTANCE`, `app.js:138`) ve populasyon surekli tavanda oldugu icin dakikada onlarca dusman despawn oluyor; hicbiri dispose edilmiyor.
- **Duzeltme:** Ortak bir `disposeEnemy(e)` yardimcisi yaz, hem `killEnemy` hem despawn dalinda cagir:
```js
function disposeEnemy(e) {
  e.mesh.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    const mats = Array.isArray(c.material) ? c.material : (c.material ? [c.material] : []);
    mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
  });
}
```
(P1.2 havuzlama isi bunu zaten kapsar; o gelene kadar bu gecici cozum.)

### H7. Isinlanma portallarinin yaklasik %60'i harita disinda doguyor
- **Belirti:** Minimapta / uzakta gorunen mavi halkalara yurudugunde goremiyorsun; haritanin kenarina carpip duruyorsun. 8 portaldan cogu ulasilamaz.
- **Yer:** `app.js:15297` (`const maxDist = isIsland ? ISLAND_RADIUS - 28 : WORLD_HALF * 1.6;`), yerlestirme `15308-15311`.
- **Sebep:** `WORLD_HALF = 460` (`app.js:122`) ama portal koordinatlari `[-736, +736]` kutusundan uniform cekiliyor. Oyuncu ise `resolvePlayerCollision` ile `+/-458`'e kelepceli (`app.js:8127-8130`). Oynanabilir alan bu kutunun sadece %39'u. Hedef koordinati `sBound`'a clamp'leniyor (`15360-15361`) ama portalin kendisi disarida kaliyor.
- **Duzeltme:** `const maxDist = isIsland ? ISLAND_RADIUS - 28 : WORLD_HALF - 30;`

### H8. Ritual dusmanlari despawn muafiyetinde degil
- **Belirti:** Ritual baslatiyorsun, tum dusmanlari kesiyorsun ama Ritual bossu hic gelmiyor; 30 saniye doluyor ve "Ritual suresi bitti" bildirimini yiyorsun (sandik + 2 level yok).
- **Yer:** `app.js:11162` - `if (!e.isBoss && !e.isBreach && !e.abyssPitRef && !e.isAttackRound && distToPlayer > ENEMY_DESPAWN_DISTANCE)`. `e.isRitual` / `e.ritualRef` (`app.js:9549-9550`) listede yok.
- **Sebep:** Ritual yaricapi 24 (`RITUAL_RADIUS`, `app.js:9465`), dusmanlar merkezden 0.5..14.4 arasina dogar (`9561`) ama knockback + oyuncunun halkanin karsi ucuna kacmasi 50 metreyi asabiliyor. Despawn `killsThisWave`'i artirmadigi icin `killsThisWave >= totalSpawned` kapisi (`9619`) hic acilmiyor.
- **Duzeltme:** Sarta `&& !e.ritualRef` ekle (Abyss ile tutarli olur).

---

## MEDIUM

### M1. Chaos meteorlari pause sirasinda birikiyor
- **Belirti:** Pause'dan cikinca gokten aynanda 5-10 meteor/buz topu iniyor.
- **Yer:** `app.js:15736` (`if (!frameBehind) { updateDayNight(dt); updateChaos(dt); }` - `running && !paused` blogunun DISINDA), `app.js:7738` (`if (!running || gameOver) return;` - `paused` kontrolu yok).
- **Duzeltme:** `updateChaos` basina `if (paused) return;` ekle veya cagriyi ana blogun icine tasi.

### M2. Breach spawn sayaci gercekten dogan dusmani saymiyor
- **Belirti:** Bazi Breach'ler bombos aciliyor: mor halka genisliyor, icinde hic yaratik olmuyor ama yine de "+1 Breach puani" veriliyor.
- **Yer:** `app.js:9253-9255` (`for (...) spawnBreachEnemy(b, false); b.spawnedCount = b.totalEnemies ?? BREACH_PREDEFINED_COUNT;`) ile `app.js:9195` (`if (enemies.length >= getMaxEnemies()) return;`).
- **Sebep:** `spawnedCount` kosulsuz olarak hedefe esitleniyor. Dusman tavani 10 iken 6 Breach dusmani (`BREACH_PREDEFINED_COUNT`, `app.js:9069`) genelde tamamen dusuyor.
- **Duzeltme:** C3'teki gibi `spawnBreachEnemy` boolean dondursun, `spawnedCount` gercek sayiya esitlensin; eksik kalanlar sonraki karelerde tamamlansin.

### M3. `state.lastWaveLullAt` restart'ta sifirlanmiyor
- **Belirti:** Uzun bir kosudan sonra yeniden basladiginda ilk dakikalarda hic nefes molasi (wave lull) olmuyor, spawn baskisi kesintisiz.
- **Yer:** `app.js:7308-7312`; `startRun`'da yok.
- **Sebep:** Eski kosunun `state.time` degeri (or. 900) kaliyor; yeni kosuda `gameTimeSec - lastLull` 900+ saniye negatif oluyor, `>= WAVE_LULL_INTERVAL` sarti asla saglanmiyor.
- **Duzeltme:** `startRun`'a `state.lastWaveLullAt = 0;`.

### M4. Deadshot vending buff'i kalici kritik sansi caliyor
- **Belirti:** Kritik sansin yuksekken Deadshot alip suresi bitince kritik sansin eskisinden dusuk kaliyor.
- **Yer:** `app.js:15010` - `effect: () => { stats.critChance = Math.min(1, (stats.critChance||0) + 0.30); }, revert: () => { stats.critChance = Math.max(0, (stats.critChance||0) - 0.30); }`.
- **Sebep:** Uygulamada `min(1, ...)` kirpiyor, geri alma kirpilan degeri bilmiyor. %85 -> %100 -> geri alinca %70. Her Deadshot %15 kalici kayip.
- **Duzeltme:** Uygulanan farki sakla: `const add = Math.min(1, c + 0.30) - c; buff.applied = add;` ve revert'te `stats.critChance -= buff.applied`.

### M5. Ana atis `projectileSpeedMult`'u yok sayiyor
- **Belirti:** "Mermi Hizi +%20" karti (5 stack'e kadar) alinabiliyor ama ana otomatik atisin mermileri ayni hizda gidiyor.
- **Yer:** `app.js:8652` (`speed: stats.projectileSpeed`) vs `app.js:8608` (okcu dogru yapiyor: `(stats.projectileSpeed || 22) * (stats.projectileSpeedMult || 1)`).
- **Duzeltme:** `speed: stats.projectileSpeed * (stats.projectileSpeedMult || 1)`.

### M6. Pause menusu acikken yetenekler kullanilabiliyor
- **Belirti:** ESC ile durdurup G (Magnet), V (Rage), Q (auto-attack), Tab, P basilabiliyor. C1 ile birlestiginde Rage'in 12 saniyesi menude yaniyor.
- **Yer:** `app.js:4523`, `4542`, `4551`, `4563`, `4572` - hepsi `running && !leveling && !gameOver` kontrol ediyor ama `!paused` kontrol etmiyor. `openPauseMenu` (`app.js:4782-4786`) `running`'i `true` birakiyor.
- **Duzeltme:** Bu bes yere `&& !paused` ekle. Daha temizi: keydown handler'inin basina `const gameInput = running && !paused && !leveling && !gameOver;` koyup hepsinde onu kullan.

### M7. Bolum gecisi dunyayi yeniden kurmuyor (isim "karli harita" diyor)
- **Belirti:** "BOLUM 2 - KARLI HARITA" yazisi cikiyor ama harita ayni kaliyor; sadece sis/gokyuzu rengi degisiyor. Ayni agaclar, ayni koyler, kullanilmis shrine'lar hala kullanilmis.
- **Yer:** `app.js:8063-8090` (bolum dali: sadece `applyMapTheme`) ile `app.js:8029-8060` (tapinak dali: `clearCurrentWorld()` + `buildWorld()` yapiyor). Bolum isimleri `8050`/`8080`.
- **Sebep:** Iki gecis yolu tutarsiz. Tapinak dali dunyayi yeniden kuruyor, bolum dali kurmuyor.
- **Duzeltme:** Ya bolum dalina da `clearCurrentWorld(); buildWorld(state.selectedMapId);` ekle (dikkat: shrine/altar/chest state'ini de sifirlamak gerekir), ya da bolum isimlerinden harita vaadini kaldir. Karar tasarim isi; P4.2 kapsaminda ele alinmali.

### M8. Ekrandaki XP sayaci iki kat gosteriyor
- **Belirti:** Oyuncunun yanindaki yuzen "+XP" sayaci, XP barinin gercekte artisindan yaklasik 2 kat fazla.
- **Yer:** `app.js:10338` (`addFloatingXp(xpAmount)` - kill aninda) ve `app.js:13142` (`gainXp` icinde tekrar `addFloatingXp(gained)` - orb toplanirken).
- **Duzeltme:** `killEnemy:10338`'deki cagriyi sil (orb toplandiginda zaten sayilir).

### M9. Basarisiz etkinlik spawn'i tum bekleme suresini yakiyor
- **Belirti:** Bazen 3-4 dakika boyunca hic Breach/Abyss/Ritual gorunmuyor.
- **Yer:** `app.js:9227-9229` (timer once resetleniyor: `breachSpawnTimer = 95 + Math.random()*70; spawnBreach();`), ardindan `spawnBreach` `9128`/`9129`'da sessizce return edebiliyor. Ayni desen `9421-9423` (Abyss) ve `9574-9576` (Ritual).
- **Sebep:** `MIN_ZONE_DISTANCE = 72` ve `getAllZoneCenters()` (`app.js:9074`) 20 shrine + 2 boss shrine'i de sayiyor. Oyuncu shrine yogun bir bolgedeyse 38 denemenin hepsi basarisiz oluyor ve 95-165 saniyelik cooldown bosa gidiyor.
- **Duzeltme:** `spawnBreach` boolean dondursun; basarisizsa `breachSpawnTimer = 8;` gibi kisa bir yeniden deneme ver.

### M10. XP orblari her karede bastan siralaniyor
- **Belirti:** Orb sayisi yukselince (tavan 260) gorunur FPS dususu.
- **Yer:** `app.js:13104` - `const sorted = xpOrbs.slice().sort(...)` her karede, sadece en yakin 3 etiketi cizmek icin.
- **Duzeltme:** Tam siralama yerine tek gecisli "en yakin 3" taramasi yap, veya etiket guncellemesini 5 karede bir calistir.

### M11. Sandik "Al" butonuna cift tiklamak odulu iki kez veriyor
- **Belirti:** Hizli cift tiklarsan skill iki kez uygulaniyor (or. Hasar +%7 iki kez).
- **Yer:** `app.js:9721-9748` - `accept()` fonksiyonunda tekrar koruma bayragi yok; `btn.addEventListener("click", ...)` her tiklamada calisiyor.
- **Duzeltme:** `accept()` basina `if (accepted) return; accepted = true;` (closure'da `let accepted = false;`).

---

## LOW

### L1. `state.gameOver` diye bir alan yok
- **Yer:** `app.js:10198` - `if (!state.gameOver && ...)`. Global bayrak `gameOver` (`app.js:159`), `state.gameOver` hicbir yerde yazilmiyor (grep: tek gecen yer bu satir).
- **Etki:** "Oyun bittiyse yeni dusman dogurma" korumasi hic calismiyor. `running` bayragi dongusu durdurdugu icin pratik etki kucuk, ama olum karesinde fazladan spawn olabiliyor.
- **Duzeltme:** `state.gameOver` -> `gameOver`.

### L2. Levelup'ta "1" tusunu basili tutmak tum bekleyen levelleri harciyor
- **Yer:** `app.js:4513-4515` - `if (e.code === "Digit1") chooseLevelCard(0);`, `e.repeat` kontrolu yok.
- **Etki:** 3 level birikmisse tusu basili tutmak ucunu de ilk karta harciyor.
- **Duzeltme:** `if (e.code === "Digit1" && !e.repeat)` (uc satir icin de).

### L3. XP orblari hic yok olmuyor, tavan asilinca XP isinlaniyor
- **Yer:** `app.js:12885` (orb kaydinda omur alani yok), `13067-13099` (`updateXpOrbs` yalnizca toplaninca siliyor), `12876` (`if (xpOrbs.length >= MAX_ORBS) { gainXp(per); continue; }`), `MAX_ORBS = 260` (`app.js:145`).
- **Etki:** Haritanin dort bir yaninda toplanmamis orblar birikiyor; 260'a ulasinca sonraki tum XP dogrudan hesaba yaziliyor - yani orb toplama mekanigi kendini iptal ediyor (pacing'i de hizlandiriyor, bkz. PACING-EXPLORATION.md).
- **Duzeltme:** Orb'a `life: 45` ver, `updateXpOrbs`'ta azalt ve bitince sil. Tavan doldugunda XP vermek yerine en eski orbu birlestir.

### L4. `clearWorld` dekor materyal onbelleklerinin bir kismini birakiyor
- **Yer:** `app.js:2011-2012` sadece `worldDecorRockMats` ve `worldDecorBushMat`'i dispose ediyor; `worldDecorMushroomStemMat`, `worldDecorMushroomCapRed/Brown`, `worldDecorMiniMats`, `worldDecorFlowerMats` (`app.js:577-581`) ne dispose ediliyor ne null'laniyor.
- **Etki:** Kucuk ama olculebilir materyal sizintisi; P1.7 dispose denetiminde yakalanacak.
- **Duzeltme:** Ayni bloga digerlerini de ekle.

### L5. Oyuncu carpisma dongusu her karede ~12.000 mesafe hesabi yapiyor
- **Yer:** `app.js:8132-8153` - `for (iter < 6) for (i < colliders.length)`. Classic haritada `colliders` ~1200 agac + ~620 kaya + evler + sandiklar = 2000+.
- **Etki:** Sabit CPU maliyeti; P1'de uzaysal grid ile cozulmeli.
- **Duzeltme:** Basit hucre gridi (10x10m) veya carpisma oncesi 4m'lik AABB elemesi.

---

## Dogrulanmadi / kasitli gorunen, rapor edilmedi

Bu maddeler kontrol edildi ve **hata degil** diye elendi, tekrar denetlenmesin diye not dusuldu:

| Konu | Sonuc |
|---|---|
| `stats.lifesteal` `Math.min(0.01, ...)` ile kirpiliyor (`app.js:10474`) | Kart aciklamasi zaten "maks %1" diyor (`app.js:1402`). Kasitli. |
| `globalCdReduction` cooldown'u 0'a indirebilir mi (`app.js:12309`) | `global_cd` max 4 x %6 = %24. Ulasilamaz. |
| `e.slowLeft` bazen sure, bazen carpan gibi duruyor | `app.js:11249/11251`'de tutarli sekilde "carpan, saniyede 0.6 sonuyor" olarak kullaniliyor. |
| Coklu mermi `i / (shots - 1)` sifira bolme | Tum cagri yerlerinde `shots > 1` ile korunuyor (`8601`, `8644`, `12389`, `12469`, `12495`). |
| `enterPortal` sonrasi `portalVoidBossSpawned` kalir mi | `app.js:7874` ve `10327`'de sifirlaniyor. |
| Acilan sandiklarin collider'i kaliyor mu | `app.js:9733-9735` / `9800-9802` temizliyor (C2 tetiklenmedigi surece). |
