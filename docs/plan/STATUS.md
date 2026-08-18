# DURUM - Canli Ilerleme Takibi

> KURAL: Her ajan seans sonunda bu dosyayi gunceller. (1) Workstream tablosunda durum/sahip, (2) "Su An" bolumu, (3) Seans Gunlugune yeni satir. Yarim is birakirken dosya+satir+eksik adimi mutlaka yaz.

Durum degerleri: `bekliyor` | `deVAM` (sahip yaz) | `blokeli (sebep)` | `BITTI (tarih)`

## Su An (en guncel ozet)

- Voxel modeller oyuna bagli: yaratik, oyuncu, boss, shrine/lamba/kasa/agac/portal cerceve. 3. portal mega arena ZONK Avatari.
- Kritik buglar onceki seans + bu seans: pause saati, sandik kilidi, abyss dalga kapisi, acquiredOrder/unlock reset, challenge timer, getMaxEnemies rampa, fireRateScale, rim HP/XP.
- Minimap: koy, sandik, vending, breach/abyss/ritual, hardcore, parkour odul + kenar ok.
- Parkour altin kureler coin + sandik veriyor. HUD Portal n/3.
- app.js kilidi: SERBEST.
- Siradaki: P1.4 instancing (draw call ~1900), P7 yeni skiller, P5 map-audit, P6 diorama, playtest. Coop (P8/P9) yok.

## Kod Haritasi Guncellemesi (PLAN.md'deki numaralar artik eski)

## Kod Haritasi Guncellemesi (PLAN.md'deki numaralar artik eski)

app.js basina ~80 satir eklendi (paylasilan cache katmani), ayrica birkac fabrika sarmalayicisi girdi.
Guncel satirlar (18 Agu, seans sonu):

| Fonksiyon | Satir | | Fonksiyon | Satir |
|---|---|---|---|---|
| paylasilan cache katmani | 106-182 | | `createEnemy` / `createEnemyInner` | 5842 / 5845 |
| `init` | 1955 | | `spawnEnemy` | 7212 |
| pixel ratio hack | 1968 | | `killEnemy` | 10358 |
| golge mapSize 28 | 2027 | | `updateEnemies` | 11334 |
| `clearWorld` | 2055 | | `updateProjectiles` | 12020 |
| `buildWorldChunked` | 2385 | | `updateEffects` | 12311 |
| `makeHpBar` / `releaseEnemyVisuals` | 4467 / 4488 | | `updateAbilities` | 12521 |
| `makeNameLabel` | 4524 | | `updateWorldDecors` | 13853 |
| `clearEntities` | 5366 | | `updateHud` / `drawMinimap` | 14279 / 14692 |
| `spawnDamageText` (+havuz) | 10191 | | `animate` | 15776 |

## Workstream Tablosu

| Is | Durum | Sahip | Not |
|---|---|---|---|
| P0 Altyapi | BITTI (18 Agu 2026) | - | `npm run dev` = statik sunucu, `dev:vite` = vite; qa/perf scriptleri eklendi |
| P1.1 Geometry/material cache | BITTI (18 Agu 2026) | - | THREE ctor sarmalayicisi + `withSharedGeo(Mat)`; app.js:106-182 |
| P1.2 Dusman havuzu | YARIM | - | HP bar + cast label havuzlandi; yaratik Group'lari HENUZ havuzlanmiyor (asagida) |
| P1.3 Projektil/efekt havuzu | YARIM | - | Damage text havuz+texture cache bitti; projektil mesh havuzu yok |
| P1.4 Dekor instancing | bekliyor | - | Draw call'un buyuk kismi burada |
| P1.5 Statik dunya merge | bekliyor | - | |
| P1.6 Render ayarlari (pixel ratio/golge) | bekliyor | - | 1.4-1.5 bitmeden ACMA. Golge pass maliyeti henuz olculmedi |
| P1.7 Dispose denetimi | YARIM | - | Sizinti azaldi (paylasilan kaynak dispose edilmiyor); texture sayisi hala restart basina ~4 artiyor |
| P1.8 Update maliyeti | BITTI (18 Agu 2026) | - | Uzak dusman 3 karede bir AI; HP bar 38m uzagi gizli + 2 karede bir cizim |
| P2.1 VoxelModel fabrikasi | BITTI (2026-08-18) | voxel | voxel.js. Geometry cache + 2 paylasilan mat. Handoff: VOXEL-INTEGRATION.md |
| P2.2 Outline | BITTI (2026-08-18) | voxel | Inverted hull, fat-cube, BackSide #1a1a22 |
| P2.3 Toon isik | BITTI (2026-08-18) | voxel | MeshToon 3-step gradient, specular yok. Gozler emissive. |
| P2.4 Voxel prop seti | BITTI + kismi wire | - | shrine/lamba/kasa/agac/portal_frame baglandi. Instancing yok. |
| P2.5 Oyuncu karakterleri | BITTI + wire | - | buildPlayer voxel + B/C/A recolor |
| P3 Yaratiklar | BITTI wire | - | createEnemy attachVoxelModel; anim updateVoxelCreatureAnim |
| P4.1 Boss modelleri | BITTI + wire | - | variant + herobrine/serafim/void/zonk |
| P4.2-4.4 Portal sayaci + boss odasi | YARIM | - | portalsEntered HUD n/3; 3. portal mega arena ZONK Avatari. Ozel kucuk arena sahnesi yok. |
| P5 Solo map iyilestirme | YARIM | - | Minimap POI, parkour odul, voxel agac/shrine. map-audit.mjs yok. |
| P6.1 Ana menu | CSS BITTI, diorama JS bekliyor | UI (CSS) | Logo/buton/panel/150ms fade. Voxel diorama app.js. |
| P6.2 Levelup ekrani | CSS+JS kismi | - | rarity-* + cardIcon + xpBarFlash. Sinerji rozeti yok. |
| P6.3-6.4 HUD + tipografi | CSS kismi BITTI | UI (CSS) | Chip boy/radius + Press Start 2P + xpBarFlash. JS emoji kaldi. |
| P7.1 Evrim sistemi | bekliyor | - | |
| P7.2 Yeni aktif skiller | bekliyor | - | |
| P7.3 Yeni pasifler | bekliyor | - | |
| P7.4 Horde surge | bekliyor | - | |
| P8.1 Lobby (trystero) | bekliyor | - | net.js yeni dosya |
| P8.2 Oyuncu replikasyonu | bekliyor | - | |
| P8.3 Ortak XP/gold kurallari | bekliyor | - | |
| P8.4 Kopma senaryolari | bekliyor | - | |
| P9.1 TD haritasi (greybox) | bekliyor | - | TEST-PLAYBOOK 4 surecine gore |
| P9.2 Cekirdek (Nexus) | bekliyor | - | |
| P9.3 Turret genisletme | bekliyor | - | |
| P9.4-9.5 Gold/dalga sistemi | bekliyor | - | |
| P10 Cila | bekliyor | - | Surekli |

## P3 Yaratik Kontrol Tablosu

Islem sirasi: voxel tanim -> animasyon -> hitbox -> screenshot -> isaretle. (Brief: ART-DIRECTION bolum 4)

| Yaratik | Voxel | Anim | Test | | Yaratik | Voxel | Anim | Test |
|---|---|---|---|---|---|---|---|---|
| goblin | [x] | [ ] | [x] | | snake | [x] | [ ] | [x] |
| wolf | [x] | [ ] | [x] | | beetle | [x] | [ ] | [x] |
| skeleton | [x] | [ ] | [x] | | crow | [x] | [ ] | [x] |
| spider | [x] | [ ] | [x] | | wraith | [x] | [ ] | [x] |
| bat | [x] | [ ] | [x] | | void | [x] | [ ] | [x] |
| slime | [x] | [ ] | [x] | | horror | [x] | [ ] | [x] |
| bear | [x] | [ ] | [x] | | shadow | [x] | [ ] | [x] |
| boar | [x] | [ ] | [x] | | vampire | [x] | [ ] | [x] |
| fox | [x] | [ ] | [x] | | purpleShadow | [x] | [ ] | [x] |
| ghost | [x] | [ ] | [x] | | purpleSkeleton | [x] | [ ] | [x] |
| scorpion | [x] | [ ] | [x] | | purpleSlime | [x] | [ ] | [x] |
| zombie | [x] | [ ] | [x] | | redBat | [x] | [ ] | [x] |
| creeper | [x] | [ ] | [x] | | polarBear | [x] | [ ] | [x] |
| flame | [x] | [ ] | [x] | | cactus | [x] | [ ] | [x] |
| snail | [x] | [ ] | [x] | | tree (dusman) | [x] | [ ] | [x] |
| flying (createFlyingEnemy) | [x] | [ ] | [x] | | waterShark | [x] | [ ] | [x] |

## Performans Olcumleri (perf-probe ciktilarini buraya isle)

Olcum ortami: `node tools/qa/perf-probe.mjs`, headless chromium 1280x720, statik sunucu (localhost:5173),
pixel ratio 0.5 (henuz degismedi). Ham JSON'lar `tests/artifacts/perf-*.json`.
UYARI: makinede baska bir Playwright kosarsa sayilar yariya duser; olcumden once
`Get-Process chrome-headless-shell` ile makinenin bos oldugunu dogrula.

| Tarih | Asama | Sahne | FPS | p95 kare | Draw call | Ucgen | Geometry | Not |
|---|---|---|---|---|---|---|---|---|
| 18 Agu | baseline | menu | 1357 | 1.6ms | 26 | 1.3k | 20 | rAF sinirsiz, anlamsiz |
| 18 Agu | baseline | oyun ici bos | 95.3 | 12.2ms | 641 | 46k | 1445 | dunya kurulumunda 3.0 sn donma |
| 18 Agu | baseline | 50 dusman | 47.6 | 29.8ms | 1228 | 66k | 1877 | |
| 18 Agu | baseline | 150 dusman + 15 skill | **37.0** | 35.5ms | 1848 | 89k | 2479 | |
| 18 Agu | A (cache kapali) | 150 dusman + 15 skill | 37.2 | 34.7ms | 1862 | 85k | 2855 | `--nocache`, baseline dogrulamasi |
| 18 Agu | B (P1.1/1.3/1.8) | 150 dusman + 15 skill | 44.6 | 26.8ms | 1928 | 91k | 2204 | A ile ardisik kosuldu (esli test) |
| 18 Agu | C (final) | oyun ici bos | 76.9 | 14.6ms | 715 | 48k | 1929 | |
| 18 Agu | C (final) | 50 dusman | 63.6 | 19.5ms | 1365 | 70k | 2000 | baseline 47.6 -> +34% |
| 18 Agu | C (final) | 150 dusman + 15 skill | **44.8** | 27.7ms | 1910 | 89k | 2072 | baseline 37.0 -> **+21%**, en kotu kare 67ms -> 57ms |

Restart x5 geometry sayisi (sizinti kontrolu): baseline 3149/1807/2835 (artan), A 1615/1682/3186/3412/2920 (artan),
C 2156/2690/1706/848/1652 (artan degil). Texture sayisi hala restart basina ~3-5 artiyor (P1.7 kalan is).

Kabul kriterine gore durum: FPS hedefi (>=55 @150) TUTMADI (44.8), draw call hedefi (<=700) TUTMADI (1910).
Kalan fark buyuk olcude dekor instancing (P1.4) + statik dunya merge (P1.5) isi; ikisi de yapilmadi.

## Seans Gunlugu (en yeni ustte)

### 2026-08-18 - Wire + kesif + portal (Claude, ajan DNS dustukten sonra)
- Voxel scriptleri index.html'de zaten vardi; createEnemy/buildPlayer/boss/props baglantisi onceki yari kalan seans + bu seans.
- Eklenen: shrine/lamba/kasa/agac/portal_frame voxel; parkour odulu (coin+sandik); minimap POI+kenar ok; portalsEntered HUD; 3. portal ZONK Avatari; levelup rarity-* + cardIcon + xpBarFlash.
- app.js kilidi birakildi.
- Yapilmadi: P1.4 instancing, P7 yeni skiller, P5 map-audit, ozel kucuk boss odasi sahnesi, playtest, image gen (ajan DNS).

### 2026-08-18 - P0 + P1 ilk dalga (Claude)

**Yapilan - P0**
- `package.json` guncellendi: `dev` (statik sunucu), `dev:vite` (vite 5, port 5173), `qa` (shot-director), `perf` (perf-probe), `build`.
  Not: vite calisiyor ama shot-director'da tek tuk `ERR_TIMED_OUT` (buyuk mp3'ler) veriyor; sifir hata kapisini
  tutturmak icin varsayilan `dev` mevcut `tools/qa/serve.mjs` birakildi. `vite.config.js` eklendi.
- `index.html`: unpkg CDN importmap kaldirildi, lokal `/node_modules/three/...` kullaniliyor. GLTFLoader da lokal.
  `window.THREE = Object.assign({}, THREE)` - modul namespace'i salt okunur oldugu icin cache katmani icin kopya sart.
- `.gitignore` eklendi (node_modules, dist, tests/artifacts, .vite).
- `tools/qa/perf-probe.mjs` yazildi (TEST-PLAYBOOK bolum 3): 4 senaryo + 5 restart sizinti kontrolu, JSON + stdout tablo.
  Ek bayraklar: `--fast`, `--headed`, `--label=`, `--nocache` (cache'i calisma aninda kapatip A/B olcmek icin).
- `tools/qa/shot-director.mjs` DUZELTILDI: `#playBtn` artik lobiyi aciyor, script lobiyi bilmiyordu ve
  90 sn timeout ile patliyordu (yani smoke test aslinda kirikti). Simdi `#lobbyStartBtn`'e tikliyor. 0 hata.

**Yapilan - P1**
- **1.1 Paylasilan geometry/material cache** (app.js:106-182). THREE'nin geometry/material yapicilarini saran
  bir katman; sadece `withSharedGeo()` / `withSharedGeoMat()` icinde aktif. Anahtar = ctor adi + parametreler.
  Paylasilan kaynagin `dispose`'u no-op yapiliyor, boylece mevcut `killEnemy` / `updateEffects` dispose cagrilari
  baskalarinin kullandigi buffer'i silmiyor. Sarmalanan fabrikalar: `createEnemy`, `createFlyingEnemy`,
  `createShadowEnemy`, `createHerobrineBoss`, `createAngelBoss`, `makeXpOrbMesh`, `makeCoinMesh`,
  `spawnProjectile`, `spawnRing`, `spawnWave`, `updateWorldDecors`. Sonuc: 150 dusmanda geometry sayisi
  2855 -> 2072, dusman basina ~7 geometry alloc -> ~1.4.
- **1.2 (kismi)** HP bar sprite havuzu (`hpBarPool`) ve cast label havuzu (`castLabelPool`);
  `releaseEnemyVisuals()` olum/despawn/soul-round/attack-round/shadow-purge/`clearEntities` yollarinin hepsine baglandi.
  Isim etiketleri `NAME_LABEL_CACHE` ile isim+tier basina tek materyal (her yaratikta canvas+texture yaratmiyor).
- **1.3 (kismi)** `spawnDamageText` yeniden yazildi: metne gore texture onbellegi (`DMG_TEXT_CACHE`, 160 girdi LRU)
  + sprite havuzu. Eskiden HER hasar sayisi icin yeni canvas+CanvasTexture+SpriteMaterial+Sprite yaratiliyordu.
- **1.8** `updateEnemies`: 34m'den uzak, boss olmayan dusmanlar 3 karede bir islenir (dt telafili).
  HP barlari 38m otesinde gizlenir, yakinda 2 karede bir cizilir (her cizim canvas + texture upload demekti).

**Yol boyunca bulunan/duzeltilen performans hatalari**
1. `updateEffects` sona eren her efektte `fx.mesh.geometry.dispose()` cagiriyordu - bu `_sharedFlashGeo` ve
   `_sharedBurstParticleGeo`'yu (tum flash/partikul mesh'lerinin PAYLASTIGI geometri) siliyordu. Yani her
   flash sonunda hayatta kalan butun partikullerin GPU buffer'i yeniden yukleniyordu. Klasik "efekt yagarken
   takilma" sebebi. Artik bu iki geometri `markShared` ile korunuyor.
2. `spawnDamageText` her cagrida `effects.filter(...)` ile sayim yapiyordu; hasar basina bir dizi allocation
   (saniyede yuzlerce cagri). Sayac dongusune cevrildi. Ayni sorun `spawnProjectile`'daki
   `projectiles.filter(...)` ve animate icindeki attack-round `enemies.filter(...)` icin de duzeltildi.
3. Dusman despawn / soul-round / saldiri roundu / shadow purge yollari yaratigi sahneden cikariyor ama
   hicbir seyi geri vermiyordu (hp bar canvas + texture'lari sizdiriyordu). Hepsi `releaseEnemyVisuals`'a baglandi.

**Yarim kalan / siradaki ajana**
- **P1.4 dekor instancing (EN ONEMLI KALAN).** Draw call 150 dusmanda ~1910, hedef <=700. Bos haritada bile
  ~700. `updateWorldDecors` (app.js:13853) chunk basina tekil mesh ekliyor; tip basina `InstancedMesh`'e gecmeli.
- **P1.5 statik dunya merge.** `buildWorldChunked` (app.js:2385) ve `addBuildings`/`addVillages` ciktilari
  materyal basina `mergeGeometries` ile birlestirilmeli.
- **P1.2 tam dusman havuzu.** Su an sadece hp bar/label havuzlaniyor, yaratik Group'lari hala her spawn'da
  bastan kuruluyor (~15 Mesh objesi). Zor kisim: `createEnemyInner` (app.js:5845) model kurulumu ile stat
  hesabini ic ice yapiyor; havuz icin model bloguna (5897 civari ile 6930 arasi; fonksiyonun `return {mesh: g,...}`
  satiri 6995) `if (!pooled)` kapisi acmak ya da modeli ayri bir fonksiyona cikarmak gerekiyor.
  150 dusmani tek karede spawn etmek hala ~1-2 sn donduruyor.
- **P1.3 kalani.** Projektil mesh havuzu (`spawnProjectile` / `disposeProjectileMesh` app.js:15984 ikilisi) ve
  efekt (flash/ring/particle) mesh havuzu yok. MAX_EFFECTS=20 / MAX_DAMAGE_TEXTS=6 / MAX_PROJECTILES=34
  kapaklari sayesinde su an patlamiyorlar; havuz gelirse bu kapaklar yukseltilebilir (gorsel zenginlik icin).
- **P1.6 ACILMADI.** Pixel ratio hala 0.5 (app.js:1968), golge haritasi hala 28x28 (app.js:2027).
  Golge pass'inin gercek maliyetini olcmeyi denedim ama olcum guvenilir cikmadi (150 dusmani tek karede
  spawn eden test scripti oyunu 2 FPS'e dusurdu, sonuc anlamsizdi) - dogru yontem: perf-probe'a
  `--noshadow` bayragi ekleyip esli kosmak. P1.4/1.5 bitmeden pixel ratio'yu yukseltme.
- **P1.7 kalani.** Restart basina texture sayisi hala ~3-5 artiyor (geometry artik artmiyor). Suphe:
  `buildWorld*` icindeki `CanvasTexture`'lar (gokyuzu, zemin) `clearWorld`'de tam temizlenmiyor.
- Baska bir bulgu: dunya kurulumu oyun basinda tek seferlik **2.3-3.5 sn ana thread donmasi** yaratiyor
  (perf-probe "ingame-empty" satirindaki `max` sutunu). `buildWorldChunked` chunk'lari cok buyuk.

**Test durumu:** `node tools/qa/shot-director.mjs` -> 5 goruntu, 0 konsol/page hatasi. perf-probe -> 0 hata.
Kod stili: ASCII, mevcut duz-script yapisi korundu, app.js modullestirilmedi.

### 2026-08-18 - P2.5 oyuncu voxel modelleri
- Yapilan: `models/player.js` (9 id = lobby CHARACTERS). Preview `models/preview-player.html`. Handoff: `docs/plan/PLAYER-MODELS.md`. Screenshot: `tests/artifacts/player/`. **app.js / index.html / styles.css / voxel.js / models/creatures.js / models/bosses.js / models/gallery.html DOKUNULMADI.**
- Id: scout, brawler, mage, survivor, samurai, gorilla, monk, paladin, archer. Recolor: B/b=appBodyColor, C/c=appCapeColor, A/a=appArmorColor.
- Siluet 2. tur: scout visor/anten, brawler omuz+kilic, survivor capul/canta, paladin kalkan+hac, gorilla kol, monk tesbih.
- Siradaki: PLAYER-MODELS.md ile buildPlayer (~4028) swap (app.js kilidi serbest olunca).

### 2026-08-18 - P2.4 voxel prop seti
- Yapilan: `models/props.js` 13 id. Preview `models/preview-props.html`. Handoff: `docs/plan/PROP-MODELS.md`. Screenshot: `tests/artifacts/props/`. **app.js / index.html / styles.css / voxel.js / models/creatures.js / models/bosses.js / models/player.js / gallery.html DOKUNULMADI.**
- Ids (voxel): tree_oak 245, tree_pine 204, rock_s 24, rock_m 76, chest_closed 75, chest_open 72, shrine 62, portal_frame 72, lamp 36, crate 64, fence 22, well 71, turret_base 64. Trees <250, rest <80. Named parts: chest `lid`, portal `ring`.
- Well ikinci turda on yuz U-kesik + su; fence raylari ayrildi.
- Siradaki: PROP-MODELS.md ile addDecorativeProps / addLamppostsAndWells / addVillages / addShrines / spawnPortal / spawnTurret swap (app.js kilidi serbest olunca).

### 2026-08-18 - P3 kalan 15 yaratik voxel
- Yapilan: `models/creatures.js` icine 15 yeni `registerVoxelModel`. **app.js / index.html / styles.css / voxel.js / models/gallery.html / models/bosses.js DOKUNULMADI.**
- Tamamlanan (voxel+test, anim yok): beetle, flame, snail, horror, shadow, vampire, purpleShadow, purpleSkeleton, purpleSlime, redBat, polarBear, cactus, tree, flying, waterShark.
- Screenshot: `tests/artifacts/creatures/` (front + threequarter + gallery-all). Flame/flying/cactus/snail/waterShark ikinci turda siluet abartildi.
- Siradaki: VOXEL-INTEGRATION.md ile createEnemy swap (app.js kilidi serbest olunca). Anim parcalari hazir (wingL/R, fin, shell, shard*, cape, flower, canopy).

### 2026-08-18 - P4.1 boss voxel modelleri
- Yapilan: `models/bosses.js` (9 boss + 9 phase2 id). Preview `models/preview-bosses.html`. Gallery'ye `bosses.js` load (zaten `?set=bosses` vardi). Handoff: `docs/plan/BOSS-MODELS.md`. Screenshot: `tests/artifacts/bosses/<id>-p1|p2-front|side.png`. **app.js / index.html / styles.css / maps/ / voxel.js / models/creatures.js DOKUNULMADI.**
- Modeller (p1 voxel / boy): arachne 2489/28, kraken 1734/30, kral_slime 1646/25, golem 2163/34, herobrine 1354/26, serafim 1628/34, void 1884/29, temple 2130/34, zonk_avatar 2259/40. Hepsi <=2500 ve 24-40 boy.
- Factory sapma: `emissiveKeys` (not `emissive`); `origin`+world `pivot` (not local pivot/`offset`); phase2 ayri id; opacity yok (slime kabuk). Ayrintilar BOSS-MODELS.md.
- Siradaki: BOSS-MODELS.md spawn tablosu ile createEnemy/createHerobrineBoss/createAngelBoss/spawnVoidBossAt/spawnTempleBossAt swap (app.js kilidi serbest olunca). P4.3 henuz yok.

### 2026-08-18 - P2.1-2.3 voxel factory + P3 17 yaratik
- Yapilan: `voxel.js` (register/build, ic yuzey cull, geometry cache, paylasilan toon+emissive+outline). `models/creatures.js` 17 model. `models/gallery.html`. Screenshot: `tests/artifacts/creatures/`. Handoff: `docs/plan/VOXEL-INTEGRATION.md`. **app.js / index.html / styles.css / maps/ DOKUNULMADI.**
- Tamamlanan (voxel+test, anim yok): goblin, wolf, skeleton, spider, bat, slime, zombie, boar, fox, ghost, scorpion, snake, crow, bear, creeper, wraith, void.
- Outline once face-extrude fin verdi; fat-cube hull'a cevrildi. Goblin kulak / spider bacak / crow gaga / wraith kapuson ikinci turda abartildi.
- Siradaki: VOXEL-INTEGRATION.md ile createEnemy swap (app.js kilidi serbest olunca).

### 2026-08-18 - P6.1/P6.2 UI CSS (styles.css ajan)
- Yapilan: `styles.css` + start/lobby/levelup markup (`index.html`). Yeni SVG: `assets/ui/`. Hook listesi: `docs/plan/UI-HOOKS.md`. **app.js DOKUNULMADI.**
- P6.1 gorsel: navy panel #141a2a, 2px acik kenar, 6px kose; altin/gri buton hover %5 + glow, basim 2px; CSS logo; 150ms overlay fade. Diorama JS bekliyor.
- P6.2 gorsel: rarity cerceve (common/magic/rare/unique/boss + eski class'lar); kart grid (ikon/ad/stat/sinerji slot). JS `rarity-*`, `.cardIcon`, her kartta `.cardStat`, `.synergyBadge` basmali.
- P6.3-6.4 CSS: chip 32px/6px; `#xpBarBottom.xpBarFlash`; font Press Start 2P (`--type-lg/md/sm`). Start/lobby/levelup emoji silindi; kalan JS emojileri UI-HOOKS.md.
- Screenshot atlandi: 5173 dolu (vite + perf-probe).
- Siradaki (app.js ajan): UI-HOOKS.md checklist.

### 2026-08-18 - Bug denetimi + pacing/kesif analizi (read-only ajan)
- Yapilan: `app.js` uzerinde salt-okunur denetim. Iki yeni dokuman yazildi. **KOD DEGISTIRILMEDI, app.js kilidi ALINMADI** (baska ajan calisiyordu).
- Yeni dokumanlar (okuma sirasina STATUS/PLAN'dan sonra girer):
  - **BUGS.md** - 26 dogrulanmis hata; CRITICAL/HIGH/MEDIUM/LOW, her biri satir numarasi + kok sebep + duzeltme taslagi. Ayrica "hata degil" diye elenen 6 madde listeli (tekrar denetlenmesin).
  - **PACING-EXPLORATION.md** - (A) guc egrisi analizi: level/dakika tablosu, egrinin kirildigi 7 nokta, sabit bazli retune onerisi. (B) mevcut POI envanteri + kesif katmani tasarimi + 15 maddelik uygulama kontrol listesi.
- En kritik 3 bulgu: pause `state.time`'i durdurmuyor (`app.js:15558`); sandik paneli olum/restart sonrasi kalici kilitleniyor (`chestPanelOpen` sifirlanmiyor, `app.js:8984`); Abyss cukuru dusman tavani yuzunden kalici soft-lock (`app.js:9386` vs `9436`).
- Pacing'in tek buyuk sebebi: `getMaxEnemies()` (`app.js:130`) seviye 25'e kadar **10** donduruyor - dusman sayisi oyuncu gucuyle hic buyumuyor.
- Siradaki adim degismedi: **P0**. BUGS.md'deki CRITICAL maddeler P0 ile birlikte veya hemen sonrasinda alinmali (hepsi kucuk, izole duzeltmeler).

### 2026-08-18 - Plan olusturuldu (Claude)
- Yapilan: Kod denetimi (app.js ~15.850 satir haritalandi), docs/plan/ altinda 5 dokuman yazildi: README, PLAN, STATUS, ART-DIRECTION, TEST-PLAYBOOK.
- Bulgular: package.json yok; three CDN'den; pixel ratio 0.5 hack'i (app.js:1883); golge 28x28 (app.js:1942); 536 geometry alloc noktasi; multiplayer kodu sifir; turret cekirdegi mevcut (app.js:9931).
- Siradaki adim: P0 (bkz. PLAN.md). Kod DEGISTIRILMEDI.
