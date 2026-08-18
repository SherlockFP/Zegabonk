# PACING ve KESIF - Killgram / ZONK

Tarih: 2026-08-18. Read-only kod denetimi; tum sayilar `app.js`'ten okundu, tahmin degil.
Iki soru: **(A)** "Cok hizli gucleniyoruz." **(B)** "Haritada kesif hissi yok."

---

# A. GUC EGRISI

## A1. Sistemin gercek sabitleri

| Ne | Deger | Yer |
|---|---|---|
| XP egrisi tabani | `48 * 1.09^(L-1) * 1.35` | `getXpNextForLevel` 86-99 |
| Ilk 10 level indirimi | `xp *= 0.42` | 97 |
| L>10 cezasi | `xp *= 1.28` | 94 |
| L>35 freni | `xp *= 1 + (L-35)*0.024` | 95 |
| Kill XP carpani | `GLOBAL_KILL_XP_MULT = 0.55` | 85 |
| Normal mob ek carpani | `NORMAL_MOB_XP_MULT = 1.1` | 9311 |
| Dusman XP formulu | `cfg.xp * (1 + L*0.04 + (stage-1)*0.08) * diffMult * levelDiffMult` | 6808 |
| Kill combo carpani | 3+ kill 1.0 / 5+ 1.18 / 10+ 1.35 | 10251 |
| Dusman HP formulu | 11 carpanin carpimi | 6782-6800 |
| **Ayni anda dusman tavani** | **L<=25 -> 10, L<=40 -> 15, L<=70 -> 17** | `getMaxEnemies` 130-136 |
| Her kill'de aninda yeni spawn | kosulsuz (tavan altindaysa) | `killEnemy` 10198 |
| Atis hizi rampasi | `3.4 - 2.4 * min(1, L/14)` | `updatePlayer` 11058 |
| Zorluk rampasi | 5 dk'da +%12, sonra 200sn'de bir +%4 | 14973-14992 |
| Bolum HP carpani | ch1 1.19 / ch2 1.69 / ch3 2.70 | `getChapterHpMult` 7361 |
| Bolum hasar carpani | ch1 1.0 / ch2 1.12 / ch3 1.55 | `getChapterDamageMult` 7364 |
| Orb tavani | `MAX_ORBS = 260`, asilinca XP dogrudan hesaba | 145, 12876 |

## A2. Level / dakika tablosu (model)

Varsayim: classic harita, bolum 1, ortalama oyuncu (kart secimi rastgele), tier karisimi normal %45 / magic %40 / rare %13 / unique %2, kill combo aktif.

| Dakika | Kill (toplam) | Kill basi XP | Toplam XP | **Level** | Dusman HP | Oyuncu DPS | Sahadaki dusman |
|---|---|---|---|---|---|---|---|
| 1 | ~15 | 19 | 285 | **8** | 40 | 45 | 3-5 |
| 3 | ~70 | 23 | 1.610 | **16** | 100 | 220 | 10 (tavan) |
| 5 | ~140 | 30 | 4.200 | **22** | 145 | 550 | 10 (tavan) |
| 10 | ~365 | 45 | 16.400 | **34-35** | 280 | 2.000+ | 10 (tavan) |

XP kapilari (kumulatif, `getXpNextForLevel` toplami): L11 = 409, L16 = 1.583, L21 = 3.390, L26 = 6.171, L31 = 10.449.

**Oran:** L1'den L25'e oyuncu hasari yaklasik **30x**, dusman HP'si **18x**, dusman **sayisi 1.0x** buyuyor. Tehdit = HP x sayi oldugu icin gercek zorluk artisi 18x, guc artisi 30x. Fark 1. dakikadan itibaren aciliyor ve hic kapanmiyor.

## A3. Egri tam olarak nerede kiriliyor (etki sirasina gore)

### 1. `getMaxEnemies()` - tek buyuk sebep (`app.js:130-136`)
```js
if (L <= 25) return 10;
```
Kosunun ilk 5-8 dakikasinda ekranda **hicbir zaman 10'dan fazla dusman olmuyor**. Ustelik `killEnemy:10198` her oldurmede aninda yerine yenisini koyuyor, yani populasyon surekli tam tavanda sabit. Sonuc: `updateSpawning`'in "seviye 26+ ise spawn basina 3-10 yaratik" mantigi (7334) tamamen dekoratif; tavan zaten 10.

Bunun yan etkisi butun sisteme yayiliyor: Nova (yaricap 4.2), Gorilla Aura, Meteor, Breach dolgu spawnlari - tum alan hasari sabit 10 hedefe carpiyor. Alan buyutme kartlari bedavaya guc, cunku onlerinde daha fazla dusman yok.

Ayni tavan Abyss/Breach/Ritual spawnlarini da yiyor (bkz. BUGS.md C3, M2).

### 2. Gizli atis hizi rampasi (`app.js:11058`)
```js
const fireRateScale = 3.4 - 2.4 * Math.min(1, level / 14);
```
Level 1'de atis araligi `0.26 * 3.23 = 0.84 sn`, level 14'te `0.26 sn`. Yani **hicbir kart almadan** DPS 3.4x artiyor. Bu, ayni pencerede secilen ~13 kartin uzerine biniyor. Oyuncu "kartlarim cok guclu" diye hissediyor ama yarisi bu satirdan geliyor.

### 3. Iki tarafli erken oyun indirimi
Dusman tarafinda (`createEnemy` 6787/6798/6799): level 1'de HP carpani `first10LevelHpScale (0.388) x earlyLevelEase (0.62) x globalEase (0.75) = 0.18`.
Oyuncu tarafinda (`getXpNextForLevel:97`): `xp *= 0.42`.
Ikisi ayni anda uygulaniyor. Dusmanlar %82 daha zayif VE levellemek %58 daha ucuz. Ilk 10 level ~90 saniyede bitiyor.

### 4. L11'de egri degil duvar var
`getXpNextForLevel` L10'da 59, L11'de 196 donduruyor - tek levelde **3.3x sicrama**. Sebep, `* 0.42` indiriminin bitmesi ile `* 1.28` cezasinin ayni adimda baslamasi. Oyuncu ilk 90 saniyede 10 level atliyor, sonra aniden duvara toslayip "yavasladi" hissediyor. Ne akici ne adil.

### 5. Ritual = 2 bedava level, kosuda ~8 kez (`app.js:9608-9609`, `9632-9633`)
```js
const xpForTwoLevels = (state.xpNext + getXpNextForLevel(state.level + 1)) / (stats.xpGainMult || 1);
gainXp(xpForTwoLevels);
```
`state.xp`'de zaten birikmis kismi saymadigi icin pratikte 2 levelden **fazla** veriyor; `state.caveXpMult` de bolume dahil edilmemis. Ritual timer'i `35 + rand*50` saniye (9575) ve ayni anda 2 ritual olabiliyor (9574). 10 dakikalik kosuda ~8 ritual = **16'ya kadar bedava level**.

### 6. Zorluk rampasi neredeyse hicbir sey yapmiyor (`app.js:14973-14992`)
5. dakikada +%12, sonra her 200 saniyede +%4. 20. dakikada toplam `1.12 * 1.04^4 = 1.31x`. Oyuncu ayni surede 50x+ gucleniyor. Bu, tek bir `dmg` kartindan (%7-10) sadece 3 kat daha degerli.

### 7. Orb tavani XP toplamayi iptal ediyor (`app.js:12876`)
```js
if (xpOrbs.length >= MAX_ORBS) { gainXp(per); continue; }
```
Orblarin omru yok (BUGS.md L3), haritada birikiyorlar. 260'a ulasinca butun XP dogrudan hesaba yaziliyor - yani "XP icin risk alip ortaya gir" dongusu tamamen kalkiyor.

## A4. Asiri guclu skiller ve kombolar

| Skill | Yer | Tavan | Sorun |
|---|---|---|---|
| `crit` | 1333 | 12 stack x %4-12 | Tek kart ID'si ile **%100 kritik**. `Math.min(1, ...)` disinda hicbir fren yok. |
| `crit_dmg` | 1334 | 8 stack x %15-35 | `critMult` 1.9 -> 4.7 |
| `critical_master` | 1454 | 4 stack x %30 | `critMult` +1.2 daha -> **5.9x** |
| `firerate` | 1328 | 8 stack x %2-7 (carpimsal) | 0.56x |
| `rapid_fire` | 1411 | 3 x 0.85 | 0.61x |
| `quick_hands` | 1538 | 5 x 0.92 | 0.66x |
| `multishot` + `shadow_clone` | 1329, 1452 | +4, +2 | Atis basina **7 mermi**, her biri ayri krit atiyor |
| `heal_on_kill` | 1404 | 6 stack x 2-6 | Kill basina 36 HP. 60 kill/dk'da **2.160 HP/dk** iyilesme; temas hasari dusman basina 7.4 dps. |
| `armor` (+`tank_mode`, agac) | 1405, 1416, 519/524/532 | %60 + %24 + %15 | Tuketim `Math.max(0, 1 - stats.armor)` (11426) - **armor 1.0 = tam dokunulmazlik**, clamp yok |
| `glass_cannon` | 1415 | 2 stack | x1.96 hasar / x0.64 HP. Yukaridaki iyilesme ile bedava. |

**Kritik komboyu carpalim:** krit 5.9x x atis hizi 5x x mermi 7 = **206x** taban. Ayni pencerede dusman HP'si 24x. Bu tek basina "cok hizli gucleniyoruz" cevabidir.

Not: `shock` (1367) ve 4 magnet karti (1338/1339/1418/1425) tersine **hic calismiyor** - bkz. BUGS.md H4 ve H5. Yani havuzda hem 200x kombolar hem olu kartlar var; varyans korkunc.

## A5. Yeniden ayar onerisi (hedef: 15-20 dakika gergin kosu)

Sirali uygulanmali. 1 ve 2 tek basina isin %70'i.

### 1. Dusman sayisini oyuncu gucune bagla (`getMaxEnemies` 130)
```js
function getMaxEnemies() {
  const L = state.level || 0;
  const t = state.time || 0;
  const byLevel = 8 + Math.floor(L * 0.9);   // L1=8, L10=17, L20=26, L30=35
  const byTime  = 8 + Math.floor(t / 25);    // 25 sn'de +1
  return Math.min(70, Math.min(byLevel, byTime));
}
```
Iki kapi (level ve zaman) birden, ki ne erken bogulma ne gec bosalma olsun. Tavan 70. **Onkosul: P1 optimizasyon.** Bugunku kodla 70 dusman FPS'i yer; P1 hedefi zaten 150 dusmanda 60 FPS.

### 2. XP egrisini duzlestir (`getXpNextForLevel` 86-99)
- `if (L <= 10) xp *= 0.42;` **sil** (satir 97)
- `XP_LEVEL11_PLUS = 1.28` **sil** (89, 94)
- Taban us: `1.09` -> `1.13`, taban katsayi `48 * 1.35` -> `40`

Yeni: `xp = 40 * 1.13^(L-1)`

| L | Simdi | Onerilen |
|---|---|---|
| 1 | 27 | 40 |
| 5 | 38 | 65 |
| 10 | 59 | 120 |
| 11 | **196** (3.3x sicrama) | 136 |
| 15 | 277 | 222 |
| 20 | 426 | 409 |
| 25 | 656 | 754 |
| 30 | 1.009 | 1.389 |

Kumulatif L11 = 737 (bugun 409), L21 = 3.238, L26 = 6.225. L11 duvari yok, mid-game daha dik.

### 3. Kill XP carpani (`GLOBAL_KILL_XP_MULT` 85)
`0.55` -> `0.34`. Madde 1 daha fazla dusman getirdigi icin dakikadaki kill sayisi artiyor; bu carpan onu dengeler. **Madde 2 ile madde 3'ten sadece birini uygulama - ikisi birden ~3.2x yavaslatir, hedef ~1.8x.** Onerilen: ikisini birden uygula ama us degerini `1.13` yerine `1.11` yap.

### 4. Atis hizi rampasini yay (`app.js:11058`)
```js
const fireRateScale = 2.0 - 1.0 * Math.min(1, level / 25);
```
Level 1'de 2x yavas (3.4x degil), rampa 14 yerine 25'te bitiyor. Gizli gucun 2.4x'i ilk 90 saniyeden cikiyor.

### 5. Kart tavanlarini kis

| Kart | Yer | Simdi | Onerilen |
|---|---|---|---|
| `crit` | 1333 | max 12, %4-12 | max 6, %3-7 |
| `crit_dmg` | 1334 | max 8, %15-35 | max 5, %10-20 |
| `critical_master` | 1454 | max 4 | max 2 |
| `firerate` | 1328 | max 8, %2-7 | max 6, %2-5 |
| `rapid_fire` | 1411 | max 3, x0.85 | max 2, x0.90 |
| `multishot` | 1329 | max 4 | max 3 |
| `shadow_clone` | 1452 | max 2 | max 1 |
| `heal_on_kill` | 1404 | max 6, 2-6 | max 4, 1-3 |
| `armor` | 1405 | max 5, %4-12 | max 4, %3-8 |
| `glass_cannon` | 1415 | max 2 | max 1 |

Ayrica **armor'a global clamp**: tuketim yerlerinde (`11426`, `11130`, `11191`, `10177`, `10972`, `10994`) `Math.max(0, 1 - stats.armor)` yerine `1 - Math.min(0.75, stats.armor || 0)`. Yeni tavan krit komboyu 206x'ten ~38x'e indirir.

### 6. Dusman HP rampasini tek egriye indir (`createEnemy` 6782-6800)

| Sabit | Yer | Simdi | Onerilen |
|---|---|---|---|
| `globalEase` | 6798 | 0.75 | 0.90 |
| `earlyLevelEase` | 6799 | `<=3 ? 0.62 : <=10 ? 0.76 : 1` | `<=3 ? 0.80 : 1` |
| `first10LevelHpScale` | 6787 | `0.32 + 0.068*L` | `0.62 + 0.038*L` |
| `levelScale` | 6783 | `1 + L*0.058` | `1 + L*0.075` |

Sonuc dusman HP'si (normal tier, ch1): L1 ~19 (bugun 10), L10 ~72 (45), L20 ~200 (122), L30 ~430 (219).

### 7. Zorluk rampasini anlamli yap (`app.js:14973-14989`)
- `DIFFICULTY_FIRST_BUMPS_AT` 300 -> **180**
- `DIFFICULTY_RAMP_INTERVAL` 200 -> **90**
- Adim carpani (14989) `1.04` -> **`1.09`**

15. dakikada: `1.12 * 1.09^8 = 2.23x` (bugun 1.24x).

### 8. Ritual odulunu sabitle (`app.js:9608`, `9632`)
```js
gainXp(getXpNextForLevel(Math.min(state.level, 12)) * 1.5 / (stats.xpGainMult || 1));
```
Oyuncunun mevcut leveline gore olceklenmez, bu yuzden gec oyunda "2 bedava level" olmaz. Ayrica `ritualSpawnTimer` (9575) `35 + rand*50` -> `75 + rand*60`, es zamanli ritual tavani (9574) 2 -> **1**.

### 9. Orb tasmasi XP'ye donusmesin (`app.js:12876`)
`gainXp(per)` yerine en yakin orb ile birlestir. Ayrica orb'a `life: 45` ekle (BUGS.md L3).

### Beklenen sonuc

| Dakika | Bugun | Retune sonrasi (model) |
|---|---|---|
| 3 | Lv 16 | **Lv 9** |
| 5 | Lv 22 | **Lv 13** |
| 10 | Lv 34 | **Lv 19** |
| 15 | (kosu bitmis) | **Lv 23**, ekranda 25-40 dusman |
| 20 | - | **Lv 26**, zorluk carpani 2.6x |

---

# B. KESIF KATMANI

Kural: **solo harita degistirilmiyor, gelistiriliyor.** Asagidaki her sey mevcut fonksiyonlarin uzerine biniyor.

## B1. Su an haritada ne var (envanter)

Harita: `WORLD_HALF = 460` (`app.js:122`), yani 920 x 920 m. Arazi: 16 tepe (`HILLS` 1551), 40 plato (`PLATEAUS` 1569), 3 yuksek plato (`HIGH_PLATEAUS` 1623), 10 duz bolge (`FLAT_ZONES` 1611), 10 rampa (`RAMP_ZONES` 1629).

| POI | Adet | Fonksiyon | Uzaktan gorunur mu | Odul | Karar |
|---|---|---|---|---|---|
| Shrine (yesil kubbe) | 20 | `addShrines` 3824 | Kubbe + isik; minimapta sari nokta (14511) | Perk secimi | **Tut** - tek dogru calisan POI |
| Zorluk sunagi | 20 | `addDifficultyAltars` 3639 | 2.5m halka | +%5 zorluk (oduL degil) | **Sayiyi dusur** |
| Boss shrine / summon shrine | 1+1 | 3661-3662, 3667 | Mor kafatasi platformu | Boss cagirir | Tut |
| Koy (NPC'li) | 4 | `addVillages` 3583, `VILLAGES` 3574 | Evler + fener; **minimapta yok** | NPC etkilesimi | **Zayif** |
| Bina (kule/ev/harabe/ciftlik/siginak) | 27 | `addBuildings` 3752 | 10-16m kule siluetleri | **Hicbiri** | **Olu agirlik** |
| Sehir binasi | 14 | `addCityZone` 3286-3309 | 12-37m kutular - haritanin en uzun objeleri | **Hicbiri** | **Olu agirlik / en iyi landmark adayi** |
| Yol yamasi | 45 | `addCityZone` 3310 | Rastgele acili 20-35m parcalar | - | **Olu agirlik - hicbir yere gitmiyor** |
| Sokak lambasi | 60 | `addCityZone` 3320 | 4m direk | - | Olu agirlik |
| Dekoratif sandik/kasa | 70 | `addDecorativeProps` 3873 | 0.5m kutu | **Hicbiri** (sadece collider) | **Olu agirlik + tuzak: sandik sanip gidiyorsun** |
| Boss arenasi | 3 | `addBossArenas` 15127 | 30m kirmizi zemin + kurukafalar | 2.5x HP boss, 3x XP | **Tut, gorunurlugu artir** |
| Parkur kursu | 3 | `addParkourZones` 15183 | Yesil platform + halka | Tepedeki altin kure **sadece mesh, odul kodu yok** (15209, 15226) | **Kirik** |
| Isinlanma portali | 8 | `addRandomTeleportPortals` 15291 | 3.5m mavi halka | Rastgele isinlanma | **Kirik** - %60'i harita disinda (BUGS.md H7) |
| Hardcore portali | 1 | `addHardcorePortal` 15378 | 7m mor cerceve | 4x zorluk / 4x odul | **Tut** - en iyi risk-odul tasarimi |
| Vending makinesi | 8 | `addVendingMachines` 15014 | 2.5m kutu, sabit konum | Coin -> 30-45sn buff | Tut |
| Dunya sandigi | max 14, 32-60sn'de 1 | `spawnRandomWorldChest` 9005 | 1m kutu; **minimapta yok** | Rastgele skill karti | Tut, gorunurluk sifir |
| Breach / Abyss / Ritual | 2 / 2 / 2 | 9097 / 9313 / 9472 | Buyuk renkli kubbe + yazi etiketi | Puan + XP + sandik | **Tut - gorunurlugu dogru yapan tek sistem** |

**Ozet:** ~110 elle yerlestirilmis nokta var, bunun **~216'si (27+14+45+60+70) oyuncuya hicbir sey vermiyor.** Yani harita dolu gorunuyor ama bos.

## B2. Neden kimse hicbir yere yurumuyor

Survivor'da oyuncu bir yere sadece dort sebepten gider:

1. **Uzaktan gorunur odul.** Gitmeden once "orada ne var" bilinmeli. Bugun bunu sadece Breach/Abyss/Ritual yapiyor (buyuk kubbe + yazi). Sandik 1 metre; shrine ancak kendi kubbesine girince okunuyor.
2. **Onceden fiyatlanmis risk.** "Tehlikeli ama degerli" karari. Sadece hardcore portali (1 adet) ve boss arenasi (3 adet) bunu sunuyor - 920x920 haritada 4 nokta.
3. **Yon veren landmark.** Minimap menzili 200 m (`drawMinimap` 14473); haritanin genisliginin **%22'sini** goruyor. Harita ekrani, pusula, ufuk cizgisi yok. Tek uzun objeler (14 sehir binasi) rastgele dagilmis ve hicbir anlam tasimiyor.
4. **Merak odulu.** Su anda **tam olarak sifir sir var.** Parkurun tepesindeki altin kure dekor.

Bunun ustune: **dusman zorlugu konumdan tamamen bagimsiz.** `createEnemy` 6782-6808'de hicbir pozisyon terimi yok. Merkezde de haritanin ucunda da ayni dusman. Yani uzaga gitmenin bir bedeli de yok, bir odulu de.

## B3. Tasarim: dort katman

### Katman 1 - Haritayi okunur yap (yon bulma)
- **4 bolge feneri.** `addCityZone`'daki en uzun 4 binayi (3286-3309) ceyrek basina bir tane, 40 m boyunda, ayri emissive renkli obeliske cevir (kuzey mavi / dogu turuncu / guney yesil / bati mor). Sisin ustunden gorunsun. Oyuncu "mor kuleye dogru gidiyorum" diyebilsin.
- **Yollar bir yere gitsin.** 45 rastgele yol yamasini (3310) spawn'dan dort fenere giden 4 gercek yola cevir. Her koy, shrine ve vending makinesi bir yolun **uzerine** otursun.
- **Minimapa POI ekle.** `drawMinimap` (14467) su an sadece orb / dusman / shrine / turret / aktif portal ciziyor. Koy, sandik, vending, boss arenasi, hardcore portali, breach/abyss/ritual eklenmeli; menzil disi POI'ler icin kenara yapisan ok. **Bu tek madde butun dokumanin en yuksek etki/efor orani.**

### Katman 2 - Olu POI'lere sebep ver (odul)
- **27 bina** (`addBuildings` 3752), tipe gore garanti ganimet:
  - `tower` (6 adet): catida sandik, sadece ziplayarak/parkurla cikilir.
  - `ruin` (5 adet): gomulu zula, 3 saniye F basili tutulur.
  - `farm` (3 adet): "hasat" - 30 saniyelik horde baslatir, 3 sandik duser.
  - `house` (12 adet): kucuk coin + can yenileme.
  - `bunker` (1 adet): haritada **legendary kartin dusebildigi tek yer**.
- **Boss arenalari** (`addBossArenas` 15127): bugun r=30'a girince uyarisiz boss doguyor (`updateBossArenas` 15166). 150 metreden gorunen bir telegraf sutunu + havada boss ismi ekle; oldurunce garanti sandik + 1 skill puani (`killEnemy` 10273 blogu).
- **Parkur** (`addParkourZones` 15183): 15209 ve 15226'daki altin kureler dekor. Interactable yap: garanti unique kart + kalici `magnetRange += 0.5`. Yeni bir `updateParkourRewards(dt)` ile mesafe kontrolu, ~15 satir.
- **70 dekoratif kasayi** (`addDecorativeProps` 3873) ya sil ya kirilabilir yap (kucuk coin). Su hali sandiga benzeyip oyuncuyu bosuna yuruten bir tuzak.

### Katman 3 - Risk/odul gradyani (asil cekim)
- **Merkezden uzaklik carpani.** `createEnemy`'ye (6800, 6808) tek terim:
```js
const rimT = Math.min(1, Math.hypot(g.position.x, g.position.z) / WORLD_HALF); // spawn pozisyonundan
const rimMult = 1 + rimT * 0.8;   // merkez 1.0, kenar 1.8
hp *= rimMult; xp *= rimMult * 1.15;
```
Bu tek degisiklik haritanin boyutunu bir zorluk kadranina cevirir: disari gitmek hem zor hem karli olur. Su an sadece bos.
- **Kose kasalari (4 adet).** Yaklasik `(+/-380, +/-380)` - ucu zaten boss arenasi ayak izi. Kilitli yapi; 60 saniyelik artan horde temizlenince aciliyor, garanti evrim-siniri odul veriyor (P7.1 evrim sistemi geldiginde dogal ev sahibi). Spawn'a uzaklik odulun fiyati.
- **Hardcore portalini sabitle.** `addHardcorePortal` (15378) su an rastgele yere koyuyor; sabit bir rim konumu + gokyuzune uzanan isik sutunu ver ki oyuncu onu ikinci kez bulabilsin.

### Katman 4 - Sirlar (merak)
- **3 gizli zula / kosu.** `FLAT_ZONES` (1611) icine, ayirt edici bir propun altina. 6 metreye yaklasinca ses + sandik acilir. Minimapta isaret **yok**. Sifir UI maliyeti.
- **Echo runu (1 adet / kosu).** Dokununca rastgele bir ziyaret edilmemis POI'yi 60 saniye minimapta isaretler. Harita ekrani acmadan haritayi ogretir.

## B4. Uygulama kontrol listesi (etki/efor sirasi)

| # | Is | Dokunulacak fonksiyon | Etki | Efor |
|---|---|---|---|---|
| 1 | Isinlanma portali sinirini duzelt (`WORLD_HALF*1.6` -> `WORLD_HALF-30`) | `addRandomTeleportPortals` 15297 | Yuksek | 1 satir |
| 2 | Merkezden uzaklik carpani (HP + XP) | `createEnemy` 6800, 6808 | Cok yuksek | 3 satir |
| 3 | Minimapa POI isaretleri + menzil disi kenar oklari | `drawMinimap` 14467 | Cok yuksek | Dusuk |
| 4 | Parkur odulunu gercek odul yap | `addParkourZones` 15209/15226 + yeni `updateParkourRewards` | Yuksek | Dusuk |
| 5 | Boss arenasina uzaktan gorunur telegraf + garanti odul | `addBossArenas` 15127, `updateBossArenas` 15161, `killEnemy` 10273 | Yuksek | Dusuk-Orta |
| 6 | Hardcore portalini sabit rim konumu + isik sutunu | `addHardcorePortal` 15378 | Orta | Dusuk |
| 7 | Gizli zulalar (3 adet, FLAT_ZONES icinde) | `FLAT_ZONES` 1611 + yeni `addHiddenCaches`/`updateHiddenCaches` | Orta | Dusuk |
| 8 | Zorluk sunaklarini 20 -> 6, her birine gorunur odul ekle | `addDifficultyAltars` 3639 | Orta | Dusuk |
| 9 | 70 dekoratif kasayi sil veya kirilabilir yap | `addDecorativeProps` 3873 | Orta | Dusuk |
| 10 | 4 bolge feneri (40m obelisk, ceyrek basina renk) | `addCityZone` 3286-3309 | Yuksek | Orta |
| 11 | 27 binaya tip basina garanti ganimet | `addBuildings` 3752 + yeni `updateBuildingLoot` | Yuksek | Orta-Yuksek |
| 12 | Rastgele yol yamalarini fener yollarina cevir, POI'leri yola diz | `addCityZone` 3310-3319, `addShrines` 3831, `addVendingMachines` 15015 | Orta | Orta |
| 13 | Echo runu | Yeni `addEchoRunes` + `drawMinimap` 14467 | Orta | Dusuk-Orta |
| 14 | Kose kasalari (4 adet, 60sn horde -> evrim odulu) | Yeni `addCornerVaults`/`updateCornerVaults` | Yuksek | Yuksek |
| 15 | Koylere gercek islev (NPC magazasi / gorev) | `addVillages` 3583, `updateNpcInteraction` | Orta | Yuksek |

1-9 arasi bir seansta bitirilebilir ve haritanin his olarak %70'ini degistirir. 10-15 P5 (Solo Map Iyilestirme) kapsaminda ele alinmali.

**Bagimlilik uyarisi:** Madde 2 (uzaklik carpani) ile A5 madde 1 (dusman tavani) birlikte test edilmeli; ikisi de ayni anda zorlugu artiriyor.
