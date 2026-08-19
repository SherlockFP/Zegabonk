# DURUM - Canli Ilerleme Takibi

> KURAL: Her ajan seans sonunda bu dosyayi gunceller. (1) Workstream tablosunda durum/sahip, (2) "Su An" bolumu, (3) Seans Gunlugune yeni satir. Yarim is birakirken dosya+satir+eksik adimi mutlaka yaz.

Durum degerleri: `bekliyor` | `deVAM` (sahip yaz) | `blokeli (sebep)` | `BITTI (tarih)`

## Su An (en guncel ozet)

- Draw-call AA: uzak dusman tek `__lod` mesh, normal isim/outline yok, HP bar 18m, city/koy PointLight kesildi, cimen 2200.
- Landmark: koy degirmeni + 2 kule (`landmark_mill` / `landmark_tower`).
- Boss saldiri: `pulseBossTelegraph` model poza + yer halkasi.
- Benchmark: `docs/plan/BENCHMARK.md` + perf-probe PASS/FAIL (150 dusman <=700 cagri, >=55 FPS).
- Boot: THREE `vendor/three.min.js`. Coop (P8/P9) yok.

## Kod Haritasi Guncellemesi (PLAN.md'deki numaralar artik eski)

Guncel satirlar (19 Agu, leftover seans):

| Fonksiyon | Satir | | Fonksiyon | Satir |
|---|---|---|---|---|
| paylasilan cache katmani | 106-182 | | `createEnemy` / `createEnemyInner` | 6350 / 6353 |
| `init` | 2299 | | `spawnEnemy` | 7747 |
| pixel ratio 0.5 | 2312 | | `killEnemy` | 11036 |
| `setupMenuDiorama` | 2402 | | `updateEnemies` | 12013 |
| `clearWorld` | 2431 | | `updateProjectiles` | 12707 |
| `addInstancedPlacements` | 296 | | `updateEffects` | 12998 |
| `addVillages` / `addBuildings` | 3999 / 4171 | | `updateAbilities` | 13208 |
| `releaseEnemyVisuals` | 4979 | | `updateHud` / `drawMinimap` | 15093 / 15524 |
| `tryEvolveSkills` / `applySkill` | 14295 / 14328 | | `animate` | 16689 |
| `getMaxEnemies` | 211 | | `pickSkills` | 14224 |

## Workstream Tablosu

| Is | Durum | Sahip | Not |
|---|---|---|---|
| P0 Altyapi | BITTI (18 Agu 2026) | - | `npm run dev` = statik sunucu, `dev:vite` = vite; qa/perf scriptleri eklendi |
| P1.1 Geometry/material cache | BITTI (18 Agu 2026) | - | THREE ctor sarmalayicisi + `withSharedGeo(Mat)`; app.js:106-182 |
| P1.2 Dusman havuzu | YARIM | - | HP/cast + voxel Group havuzu (8/tip, 80 cap) `releaseEnemyVisuals`. Primitive fallback, flying/shadow/boss havuzda degil |
| P1.3 Projektil/efekt havuzu | BITTI kismi (19 Agu) | app.js | Damage text + sekilli projektil + flash/burst havuzu. Ring/wave hala spawn; unique mat |
| P1.4 Dekor instancing | BITTI (19 Agu 2026) | app.js | LIVE classic instanced agac/kaya/cali/varil. Grass + voxel crate/oak/pine |
| P1.5 Statik dunya merge | BITTI instanced (19 Agu) | app.js | BufferGeometryUtils yok; koy/bina/sinir duvari/sehir kutulari InstancedMesh. Bunker tekil. PointLight'lar tekil |
| P1.6 Render ayarlari (pixel ratio/golge) | BITTI (19 Agu 2026) | app.js | pixel ratio min(dpr, 1.25), golge 1024 PCF. 150 dusman hedefi <=700 + LOD; olcum BENCHMARK.md |
| P1.7 Dispose denetimi | BITTI kismi (19 Agu) | app.js | Paylasilan geo dispose skip + NAME_LABEL_CACHE trim(48) restart. Tam 5x restart olcumu yok |
| P1.8 Update maliyeti | BITTI (19 Agu 2026) | app.js | Uzak AI 3 kare; HP 18m; `ENEMY_LOD_DIST` 16 tek mesh |
| P2.1 VoxelModel fabrikasi | BITTI (2026-08-18) | voxel | voxel.js. Geometry cache + 2 paylasilan mat. Handoff: VOXEL-INTEGRATION.md |
| P2.2 Outline | BITTI (2026-08-18) | voxel | Inverted hull, fat-cube, BackSide #1a1a22 |
| P2.3 Toon isik | BITTI (2026-08-18) | voxel | MeshToon 3-step gradient, specular yok. Gozler emissive. |
| P2.4 Voxel prop seti | BITTI + wire + instance | - | shrine/lamba/kasa/agac/portal_frame. Crate/oak/pine InstancedMesh |
| P2.5 Oyuncu karakterleri | BITTI + wire | - | buildPlayer voxel + B/C/A recolor |
| P3 Yaratiklar | BITTI wire | - | createEnemy attachVoxelModel; anim updateVoxelCreatureAnim |
| P4.1 Boss modelleri | BITTI + wire | - | variant + herobrine/serafim/void/zonk |
| P4.2-4.4 Portal sayaci + boss odasi | BITTI kismi (19 Agu) | app.js | portalsEntered HUD n/3; 3. portal 60x60 kutu arena + ZONK Avatari. Faz 2 `*_p2` %50 HP. Shot-director boss sahnesi yok |
| P5 Solo map iyilestirme | BITTI kismi (19 Agu) | - | map-audit.mjs step=4 + Box3 floater. addClassicRamps live. Ground 96. Onceki: maxAbs 0.588, rampMismatch 0. Spec grid=2 asiri yavas |
| P6.1 Ana menu | BITTI diorama (19 Agu) | app.js | Canvas acik; idle voxel oyuncu + goblin/wolf donuyor. Overlay blur duruyor |
| P6.2 Levelup ekrani | CSS+JS kismi | - | rarity-* + cardIcon + xpBarFlash + synergyBadge (10 satir map) |
| P6.3-6.4 HUD + tipografi | BITTI kismi (19 Agu) | app.js | Chip + Press Start 2P + xpBarFlash. Levelup/sandik emoji ASCII [+] / Aktif / Pasif |
| P7.1 Evrim sistemi | BITTI (19 Agu 2026) | app.js | Inferno Orb, Glacier, Blade Storm, Arrow Wall, Storm Caller, Cataclysm |
| P7.2 Yeni aktif skiller | BITTI kismi (19 Agu) | app.js | chain bolt, black hole, poison trail, siginak. Ricochet Disc / Mirror Image yok (ricochet + shadow_clone var) |
| P7.3 Yeni pasifler | BITTI (19 Agu 2026) | app.js | greed, executioner, thorns, momentum, overcharge. Vampirism = mevcut lifesteal |
| P7.4 Horde surge | BITTI (19 Agu 2026) | app.js | 300sn / 30sn, soul-round spawn deseni, soul varken bekler, bitince sandik |
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
| goblin | [x] | [x] | [x] | | snake | [x] | [x] | [x] |
| wolf | [x] | [x] | [x] | | beetle | [x] | [x] | [x] |
| skeleton | [x] | [x] | [x] | | crow | [x] | [x] | [x] |
| spider | [x] | [x] | [x] | | wraith | [x] | [x] | [x] |
| bat | [x] | [x] | [x] | | void | [x] | [x] | [x] |
| slime | [x] | [x] | [x] | | horror | [x] | [x] | [x] |
| bear | [x] | [x] | [x] | | shadow | [x] | [x] | [x] |
| boar | [x] | [x] | [x] | | vampire | [x] | [x] | [x] |
| fox | [x] | [x] | [x] | | purpleShadow | [x] | [x] | [x] |
| ghost | [x] | [x] | [x] | | purpleSkeleton | [x] | [x] | [x] |
| scorpion | [x] | [x] | [x] | | purpleSlime | [x] | [x] | [x] |
| zombie | [x] | [x] | [x] | | redBat | [x] | [x] | [x] |
| creeper | [x] | [x] | [x] | | polarBear | [x] | [x] | [x] |
| flame | [x] | [x] | [x] | | cactus | [x] | [x] | [x] |
| snail | [x] | [x] | [x] | | tree (dusman) | [x] | [x] | [x] |
| flying (createFlyingEnemy) | [x] | [x] | [x] | | waterShark | [x] | [x] | [x] |

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
| 19 Agu | leftover --fast | menu | 1774 | 0.8ms | 47 | 6.5k | 48 | diorama + rAF sinirsiz; FPS anlamsiz |
| 19 Agu | leftover --fast | oyun ici bos | 144.1 | 7.1ms | **238** | 228k | 413 | C: 715 draw. max 3139ms = dunya kurulum donmasi |
| 19 Agu | leftover --fast | 50 dusman | 120.4 | 10.8ms | **621** | 274k | 560 | C: 1365 draw |
| 19 Agu | leftover --fast | 150 dusman + 15 skill | 81.8 | 16.1ms | **1192** | 342k | 576 | C: 1910 draw. FPS --fast ile C'ye kiyaslama; draw call kiyaslanabilir |

Restart x5 geometry sayisi (sizinti kontrolu): baseline 3149/1807/2835 (artan), A 1615/1682/3186/3412/2920 (artan),
C 2156/2690/1706/848/1652 (artan degil). Texture sayisi hala restart basina ~3-5 artiyor (P1.7 kalan is).
19 Agu leftover restart: geo 471/675/421/739/777 (dalgalaniyor, net artis yok); tex 174/179/179/187/195 (hala +~4-5, P1.7).

Kabul kriterine gore durum: FPS hedefi (>=55 @150) onceki tam olcumde TUTMADI (44.8). Draw call hedefi (<=700) 150'de hala TUTMADI (1192) ama bos harita 715->238, 50 dusman 1365->621. Pixel ratio 0.5 duruyor.

## Seans Gunlugu (en yeni ustte)

### 2026-08-19 - Draw call LOD + landmark + telegraph + skill

**Yapilan**
- `threejs-perf` zaten vardi; proje skill `.cursor/skills/threejs-optimization/` + `docs/plan/BENCHMARK.md` kuruldu.
- voxel.js: bake edilen `__lod` tek mesh. Uzak dusman parca grubunu kapatir.
- Normal tier: outline yok, isim sprite yok. PointLight ormani (sehir 60 + koy/lamba/mesale/sunak) kesildi.
- `landmark_mill` / `landmark_tower` instanced. Boss `pulseBossTelegraph`.
- perf-probe cikis kodu 1 (FAIL) / 0 (PASS).

**Olcum (`--fast --label=lod2`):** empty 299/247fps, 50 dusman 487/206fps, 150+skill **699/153fps**. Landmarks 6, pulseBoss ok. BENCHMARK PASS. (Probe vsync kapali; gercek 60fps oyunda dogrulanmali.)

### 2026-08-19 - Boot 404: THREE vendor

index.html importmap `/node_modules/three/` + blocking GLTFLoader. node_modules gitignore; Live Server / file / npm'siz clone 404, modul hic kosmuyordu, window.THREE yok, oyun acilmiyordu. THREE UMD `vendor/three.min.js`, GLTF boot'tan cikti (voxel yeter).

### 2026-08-19 - AA hissi: juice + pacing + bolum

**Yapilan**
- XP egri duz (L11 duvari silindi), GLOBAL_KILL_XP_MULT 0.55->0.40, erken HP ease sertlestirildi.
- Kart tavan: crit 6, crit_dmg 5, critical_master 2, firerate 6, multishot 3, shadow_clone 1, heal_on_kill 4, armor 4, glass 1, rapid_fire 2.
- armorMitigation %75 cap (dokunulmazlik koptu).
- Blob shadow oyuncu+dusman; kill cube havuzu; hitPunch squash; hit-stop 80ms.
- Levelup Hasar/HP/Atis/Hiz/Zirh once->sonra satiri.
- Bolum portal: clearCurrentWorld+buildWorld. Ch2 kar paleti. Boss oda sutun+halka.
- Menu overlay blur kapali.

**Yapilmadi (AA icin sonraki)**
- P8/P9 coop/TD. Meta upgrade agaci. Tam ses paketi. Draw call 150 dusman <=700. Boss telegraf anim. Landmark objeler.

**app.js kilidi:** SERBEST.

### 2026-08-19 - Coop haric leftover kapatma + push

**Yapilan**
- P1.6 kodda zaten acikti (1.25 / 1024 PCF); STATUS guncellendi.
- P1.3 flash + burst paylasilan geo + 24 mesh havuzu. updateEffects / clearEntities dispose skip.
- P1.7 NAME_LABEL_CACHE trim(48) startRun. Breach spawn M2: spawnBreachEnemy boolean, sayac gercek dogum.
- P4 60x60 arena + P7 6 evrim + yaratik walk anim (biped/quad/crawl/slither/fly) zaten vardi.
- P6 HUD emoji ASCII. map-audit step 8 -> 4.
- P7.2 Siginak, P7.3 Momentum + Asiri Sarj.
- Bug: M4 Deadshot applied fark, M5 ana atis projectileSpeedMult, M6 pause G/V/Q/Tab/P, M8 kill'de cift floating XP.
- Coop/TD (P8/P9) dokunulmadi.

**Yapilmadi**
- P8/P9 coop + tower defense.
- Mirror Image / ozel Ricochet Disc (mevcut ricochet + shadow_clone).
- map-audit grid=2, perf-probe tekrar, boss-odasi shot-director sahnesi.
- Primitive/flying/boss enemy havuzu, ring/wave havuzu.

**app.js kilidi:** SERBEST.

### 2026-08-19 - Bug H7/M1 + puan notu
- Random teleport portallari WORLD_HALF-30 icine alindi (once WORLD_HALF*1.6, ~%60 harita disi).
- updateChaos pause'da duruyor (pause meteor yigini).
- Kritik/HIGH C1-C3 H1-H5 H8 onceki seanslarda kapali; H6 kismi (voxel pool).

### 2026-08-19 - Leftover P1.5/pool/P7/P6 (app.js writer, coop haric)

**Yapilan**
- **P1.5** BufferGeometryUtils yok. Koy ev/cit, binalar (bunker haric), sinir duvari, sehir kutu/pencere/yol/lamba InstancedMesh. Voxel paylasilan mat'a dokunulmadi.
- **P1.2** voxel Group havuzu (8/tip, 80 cap) `releaseEnemyVisuals` + killEnemy dispose skip.
- **P1.3** sekilli projektil mesh havuzu (48 cap). Default orb/meteor/lazer yok.
- **P7.1** Inferno Orb (fireball_dmg max + burn), Glacier (frostball_dmg max + freeze), Blade Storm (sword_dmg max + crit).
- **P7.4** HORDE_SURGE 300/30, soul-round spawn, soul varken bekler, sandik.
- **P6** menu diorama: pad + goblin + wolf + oyuncu donuyor. `dir-menu` arkasinda gorunuyor.
- Levelup `card` createElement eksigi (ReferenceError) duzeltildi.
- Playtest: shot-director 5 shot, **0 hata**. perf-probe --fast leftover: bos 238 / 50=621 / 150=1192 draw.
- P1.6 ACILMADI (pixel ratio 0.5).

**Yapilmadi**
- P1.6 pixel ratio/golge, P1.7 texture sizintisi, efekt mesh havuzu, primitive/flying enemy havuzu.
- P7.1 kalan 3 evrim (Arrow Wall / Storm Caller / Cataclysm).
- P4 ozel 60x60 oda, P5 spec grid=2, P8/P9 coop.
- MANUEL: 3. portal duvar + boss faz 2; evrim karti (max dmg + pasif).

**app.js kilidi:** SERBEST.

### 2026-08-19 - Resume remaining phases (app.js writer, coop haric)

**Yapilan**
- Onceki seans STATUS'u P1.4/P5/P7/P4/P6 bitmis yazmisti ama **classic start `buildWorldClassic` kullaniyordu**, chunked InstancedMesh oyuna girmiyordu. 1200 agac + kaya/cali/varil live path'te InstancedMesh yapildi. `addClassicRamps` classic + chunked. Ground 56/64 -> 96.
- executioner: hasar sonrasi HP<=%15 infaz. Poison trail `spawnRing`. getGroundHeight classic ramp max.
- P5 audit: maxAbs 1.703 -> 0.588, rampMismatch 8 -> 0, slope 0. floater Box3; 40 sayac lamba/pencere (yanlis pozitif).
- Playtest: `shot-director.mjs` 5 shot, **0 hata**. map-audit 0 script error.
- P7/P4/P6 onceki seans kodu duruyor (chain/blackhole/poison, greed/executioner, synergyBadge, mega wall, p2 swap). Coop yok.

**Yapilmadi**
- P1.5 merge, P1.6 pixel ratio, P1.2/1.3 tam havuz, P7.1 evrim, P7.4 horde, P6 diorama, P8/P9, perf-probe tekrar (draw call sayisi bu seans olculmedi).
- MANUEL: 3. portal duvar + boss faz 2; levelup yeni kartlar.
- City zone pencereleri hala tekil mesh.

**app.js kilidi:** SERBEST.

### 2026-08-18 - P1.4/P5/P7/P4 leftover (app.js writer, coop haric)

**Yapilan**
- **P1.4** `addInstancedForest` (~650 agac, 4 InstancedMesh). worldDecor rock/bush/flower/mushroom/mini + 48 varil instanced; `updateWorldDecors` instanced sonrasi no-op. Voxel crate/oak/pine `addVoxelPropInstances` (paylasilan toon/outline mat). Chunk tree load bug'i da kapandi (step 3 sonrasi step 5'e zipliyordu, binalar/cim artik gercekten ekleniyor).
- **P1.5** atlandi: `BufferGeometryUtils` yeni import, local `/node_modules/three` importmap ile kavga riski.
- **P5** `tools/qa/map-audit.mjs` (grid step 8, ground raycast, JSON+PNG). RAMP_ZONES iki classic daga (220,40) ve (-260,-140) yamacina tasindi. Ground 48->64. 2 renkli fener obelisk. Audit: 10136 sample, maxAbs 1.703, 80 kritik (cap), 0 slope>50, rampMismatch ~8 (hill interpolation). 0 KRITIK degil.
- **P7** actives: `unlock_chain_bolt`, `unlock_black_hole`, `unlock_poison_trail` (ABILITY_UNLOCK_IDS + CORE + pickSkills). Passives: `greed` (coinMult+goldGainMult), `executioner` (%15 infaz). Thorns zaten melee contact'ta vardi.
- **P4** `spawnMegaArenaWall` (r=58 daire) + player clamp. `trySwapBossPhase2` HP<%50 -> `*_p2`.
- **P6** menu `canvas.style.display=none` kaldirildi. `SKILL_SYNERGY` 10 satir + `.synergyBadge`. Diorama yok.
- Playtest: `node tools/qa/shot-director.mjs` -> 5 shot, **0 hata**.

**Yapilmadi**
- P1.5 merge, P1.6 pixel ratio, P1.2/1.3 tam havuz, P7.1 evrim, P7.4 horde, P6 diorama, P8/P9 coop, perf-probe tekrar (draw call delta olculmedi).
- MANUEL PLAYTEST BEKLIYOR: 3. portal mega arena duvar + boss faz 2; levelup'ta yeni kartlar.

**app.js kilidi:** SERBEST.

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
