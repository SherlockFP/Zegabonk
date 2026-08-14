# Tac Yarigi Endgame System

## Player promise

Hikayeyi bir kez bitir, karakterini kalici olarak gelistir, otomatik uretilen portallarda sonsuza kadar daha derine in ve kendi skorunu ya da arkadaslarinin skorunu gec.

## Unlock and entry

1. Uc hikaye bolgesi ve Catlak Kral Grom tamamlanir.
2. `storyCompleted` ve `princessRescued` profile kaydedilir.
3. Final alanda Tac Yarigi portali acilir.
4. Sonraki oturumlarda ana menudeki `TAC YARIKLARI` dugmesi dogrudan erisilir olur.
5. Harita esyasi veya anahtar dusurme zorunlulugu yoktur. Her portal yeni sozlesmeyi otomatik uretir.

## Rift contract

Her `RiftContract` su alanlari tasir:

- ruleset version;
- depth ve deterministic seed;
- rastgele biome;
- sure limiti;
- oldurme kotasi;
- 1-4 affix;
- dusman ve odul carpani;
- final Tac Muhafizi.

Ilk calisan iskelet 10 dakika, `80 + depth x 10` oldurme hedefi, hedef tamamlaninca boss ve boss oldugunde sonraki portal akisini kullanir. Sure her 10 derinlikte kontrollu olarak azalir ve 6 dakikanin altina inmez.

## Success, failure, depth

- Kalan sure > %40: +3 depth.
- Kalan sure > %20: +2 depth.
- Diger basari: +1 depth.
- Sure biterse build ve kalici profil korunur; sonraki portal bir alt depth icin acilir.
- Olum run'i bitirir ama mastery, gear, Tac Parcasi ve rekor silinmez.
- Sonsuz scaling, depth tabani ve her iki dakikada bir ek baski dalgasi ile surer.

## Affix vocabulary

- Hircin: dusman hareket hizi artar.
- Siperkiran: elit/rare dayanikliligi artar.
- Catlak Zemin: normal dusman olumu gecikmeli mor tehlike halkasi birakir.
- Tac Avcilari: ek elit avci sansi.
- Parlak Risk: daha guclu dusman, daha fazla XP ve odul.

Affix sayisi her 5 depth'te bir artar, en fazla dort olur. Ayni kurallar seed ile tekrar oynatilabilir olmalidir.

## Persistent versus run power

Kalici profil:

- hikaye/endgame unlock;
- max depth ve en iyi skor;
- Tac Parcasi para birimi;
- karakter mastery;
- weapon/armor/charm ekipman yuvalari;
- gear power;
- acilan biome ve kozmetik.

Run ile sifirlananlar:

- combat level ve XP;
- level-up kartlari;
- gecici skill ve buff kombinasyonu;
- kill combo ve harita ici para.

Kalici guc yavas ve sinirli bir taban avantajidir. Run build'i halen kazanmanin ana nedenidir.

## Score and leaderboards

Tac Yarigi skoru:

`depth x 10000 + time bonus + affix bonus + no-death bonus - death penalty`

Siralamada once depth, sonra skor, sonra kalan sure kullanilir. Kayit seed, ruleset, affix ve death sayisini tasir.

Iki rekabet modu hedeflenir:

1. Tac Yarigi Progression: kalici ekipman acik.
2. Tac Denemesi: sabit loadout ve sabit seed; saf rekabet.

Mevcut localStorage tablosu prototiptir. Global rekabet icin sunucu tarafinda seed/ruleset/build hash dogrulamasi, rate limit, imzali run ozeti ve tekrar/telemetri kontrolu zorunludur.

## Implementation stages

### E0 - Runtime skeleton (current slice)

- versioned profile save;
- story unlock;
- generated contract;
- timer, kill quota, rift boss;
- success/failure portal;
- persistent shards/mastery;
- local separate leaderboard;
- HUD and debug state.

### E1 - Reward room and equipment

- 3-choice reward altar;
- item rarity/affix schema;
- stash and loadouts;
- salvage/crafting;
- profile migration tests.

### E2 - Objective variety

- elite hunt;
- shrine hold;
- boss chain;
- escort orb;
- biome-specific hazard director.

### E3 - Competitive integrity

- normalized Tac Denemesi;
- authoritative score service;
- seasonal ruleset and leaderboard archive;
- anti-tamper and replay summary.
