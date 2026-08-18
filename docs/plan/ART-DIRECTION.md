# SANAT YONERGESI - Voxel Cartoon Stil

Hedef his: "Megabonk x Crossy Road x Cult of the Lamb": voxel govdeler, kalin siyah outline, doygun cizgi film paleti, abartili siluetler. Sirin ama tehditkar.

## 1. Voxel Temel Kurallari

- 1 voxel = 0.125 dunya birimi (oyuncu ~1.8 birim = 14-15 voxel boy).
- Butceler: kucuk dusman <=150 voxel goruntulenen kutu, orta 150-400, buyuk 400-900, boss 900-2500. (Merge sonrasi ucgen sayisi onemli; ic yuzeyler ayiklanir.)
- Siluet kurali: yaratik 32x32 piksellik siyah siluet olarak cizilse taninmali. Taninmiyorsa abartiyi artir (kafa buyut, tek ozelligi buyut).
- Her yaratigin TEK abartili tanimlayici ozelligi olur: goblin = kocaman kulaklar, kurt = dev cene, iskelet = kafatasi 1/3 boy vs.
- Gozler: 2x2 voxel emissive blok (mevcut sari goz gelenegi korunur, tier rengine gore degisebilir).

## 2. Palet

Ana palet 24 renk; tum voxel modeller bundan secer (vertex color). Ton kurali: golge tonu = ana tonun %65 parlaklik + hafif mora kayma (cartoon derinlik).

- Zemin/dogal: `#7ec850` cim, `#5da03e` koyu cim, `#c2a36b` toprak, `#8a8f98` tas, `#6b4a2f` ahsap
- Tier renkleri (mevcut koddan korunur): normal `#ff4d62`, magic `#64d5ff`, rare `#ffd374`, unique `#ff8ddd`, boss `#ff3f4b`
- Vurgular: `#ffe066` altin, `#9b5cff` void moru, `#40e0d0` buz, `#ff7a29` ates, `#3ddc64` zehir
- Notr: `#1a1a22` outline sivahi, `#f4f2ea` kemik/beyaz

## 3. Outline + Isik

- Outline: inverted hull, renk `#1a1a22`, kalinlik govde boyutunun %5'i (kucuk dusmanlarda min 0.02 birim). Boss'larda %6 + tier renginde ikinci ince rim opsiyonel.
- Isik: 3 basamakli toon gradient (karanlik/orta/parlak). Specular yok, metalness 0. Emissive yalniz goz, buyu efekti, portal.
- Golge: karakterler yalnizca yumusak daire blob shadow (ucuz); gercek shadow map yalniz statik dunya + oyuncu.

## 4. Yaratik Brief'leri (P3 icin)

Format: boy (voxel) | siluet ozellik | palet | animasyon. Hepsi 4 bacakli yurume/2 bacakli salinim/ucus sinusu prosedurel animasyon setinden birini kullanir.

| Yaratik | Boy | Tanimlayici ozellik | Renkler | Animasyon |
|---|---|---|---|---|
| goblin | 10 | Kafanin yarisi kadar sivri kulaklar, kambur | yesil + kahve pacavra | 2 bacak hizli paytak |
| wolf | 9 | Govdenin 1/3'u cene, dik kuyruk | gri + beyaz karin | 4 bacak kosu, saldirida cene acilir |
| skeleton | 13 | Buyuk kafatasi, ayrik kaburga voxelleri | kemik beyazi + koyu goz cukuru | 2 bacak tangir tungur, kafa hafif sallanir |
| spider | 7 (genis) | 8 ince bacak (2 voxel kalin), govde yayvan | siyah-kahve + kirmizi sirt lekesi | bacaklar sirayla, saldirida one kalkar |
| bat | 5 | Govdeden buyuk kanatlar (5 voxel'lik) | koyu mor + pembe kulak ici | kanat cirpma sinusu |
| slime | 8 | Yari saydam kup, icinde kucuk cekirdek | yesil %70 opak | squash-stretch ziplama |
| bear / polarBear | 14 | Dev omuzlar, kucuk kafa | kahve / beyaz-buz mavisi | 4 bacak agir, saldirida sah kalkar |
| boar | 9 | Iki buyuk fildisi dis | koyu kahve + krem disler | 4 bacak, carj oncesi yer eseler |
| fox | 8 | Boyu kadar kabarik kuyruk | turuncu + beyaz uc | 4 bacak seri, kuyruk salinir |
| ghost | 11 | Bacaksiz, alt voxeller dagilir (yari saydam) | soluk mavi-beyaz | havada sinus, alt voxel dalgasi |
| scorpion | 6 (uzun) | Govde ustune kivrilan igneli kuyruk | kum sarisi + kizil igne | kuyruk saldiri telegrafinda geriye gerilir |
| zombie | 12 | One uzanmis kollar, yamuk durus | cursuk yesil + yirtik mor | 2 bacak surukleme |
| creeper | 10 | Minecraft-vari sutun govde, 4 kisa bacak | benekli yesil | patlamadan once sisip beyaz yanip soner |
| flame | 8 | Govdesiz alev sutunu, ic cekirdek | turuncu->sari gradyan, emissive | voxel'ler yukari akar (uv/pozisyon animasyonu) |
| snail | 6 | Dev spiral kabuk | kahve kabuk + krem govde | cok yavas, kabuga saklanma (hasar aninda) |
| snake | 5 (uzun) | 12 voxel uzunlugunda segmentli govde | yesil + sari zigzag | segment dalga takibi |
| beetle | 6 | Parlak kabuk (rim isik istisnasi) | lacivert-metalik his | 4 bacak titrek |
| crow | 5 | Buyuk gaga, tuy sacagi | siyah + gri gaga | ucus, dalis saldirisi |
| wraith | 12 | Kapusonlu pelerin, ici bos yuz | koyu gri + mor ic isik | havada suzulme, pelerin dalgasi |
| void / horror | 12/14 | Duzensiz kup kumesi, tekil dev goz | void moru + siyah, emissive goz | voxel'ler yorunge halinde doner |
| shadow / purple* | kaynak modelin silueti | %90 siyah/mor, outline mor | kaynak anim + partikul sizinti |
| vampire | 13 | Dik yaka pelerin, soluk yuz | siyah-kizil + beyaz ten | 2 bacak zarif, yarasaya donus efekti |
| redBat | 6 | bat ile ayni, kizil + daha buyuk dis | kizil | kanat cirpma hizli |
| cactus | 10 | Kollu saguaro, dikenler 1'er voxel | cim yesili + sari cicek tepe | sabit, saldirida diken firlatma geri tepmesi |
| tree (dusman) | 16 | Yuruyen govde, dal kollar | kahve + yesil yaprak tepe | 2 bacak agir, kok saplanma saldirisi |
| flying (genel) | 7 | Kanatli goz kuresi | tier rengi | ucus sinusu |
| waterShark | 12 (uzun) | Su ustunde yalniz sirt yuzgeci gorunur | gri-mavi | yuzgec daire cizer, atlayista tam govde |

## 5. Boss Brief'leri (Opus uretim yonergeleri)

Bu bolum Opus'a verilecek uretim sozlesmesidir. Opus her boss icin asagidaki formatta `voxel.js` verisi uretir:

```js
// Uretim formati (VoxelModel fabrikasi girdisi):
// katmanlar: alttan uste, her string bir satir; harf = palet anahtari, "." = bos
registerVoxelModel("boss_arachne", {
  palette: { B: "#2a1a0a", R: "#ff3f4b", E: "#ffff44" },
  parts: {
    body:  { layers: [ ["..BBB..", ".BBBBB.", "..BBB.."], /* ... */ ], pivot: [3, 0, 3] },
    legL1: { layers: [ /* ... */ ], pivot: [0, 2, 0] },  // adlandirilmis parca = animasyon eklemi
  },
  scale: 0.125,
});
```

Zorunlu kurallar (her boss icin):
- Boy 24-40 voxel; oyuncunun 2-3 kati. Butce <=2500 voxel.
- En az 3 adlandirilmis parca (animasyon icin): govde + 2 uzuv/kafa.
- Saldiri telegrafi gorsel olarak modele islenmis olmali (parlayan bolge, acilan agiz, kalkan kol vs).
- Faz 2'de gorsel degisim: renk kaymasi + bir parcanin kirilmasi/acilmasi.
- Palet bolum 2'den, outline otomatik (fabrika ekler), gozler emissive.

Uretilecek boss listesi ve kimlikleri:

1. **Arachne (bossVariant 0, mevcut orumcek).** Dev orumcek ana; 8 eklemli bacak (her biri ayri parca), sirtinda yumurta kesesi (faz 2'de patlar, kucuk orumcek dogurur). Koyu kahve + kizil isaretler.
2. **Kraken Sapligi (bossVariant 1, tentacle).** Govde yesil et yigini, 8 dokunac (4'u ayri parca, telegrafta yere kalkar-vurur). Faz 2: dokunac uclari mor aleve doner.
3. **Kral Slime (bossVariant 2).** Dev yari saydam kup, icinde kucuk altin tac + yutulmus iskelet gorunur. Zipladikca squash. Faz 2: ikiye bolunur (iki orta boy slime parca modeli).
4. **Golem (bossVariant 3+).** Tas bloklardan govde, gogsunde emissive cekirdek (zayif nokta gorseli). Faz 2: dis tas katman dokulur, cekirdek acikta magma damlar.
5. **Herobrine (createHerobrineBoss).** Insansi 26 voxel, bembeyaz emissive gozler, statik-poz korkutucu duruz. Isinlanma efekti: voxel'lerin dagilip yeniden toplanmasi. Faz 2: etrafinda donen 4 obsidyen kup.
6. **Serafim (createAngelBoss).** 34 voxel, 4 kanat (2 parca), halka (emissive altin). Kutsal zar: yerden isik sutunlari (telegraf halkali). Faz 2: kanatlar kararir, halka catlar - "dusmus melek" palet swap.
7. **Void Efendisi (spawnVoidBossAt).** Merkez goz kuresi + yorungede donen duzensiz kup kusagi. Kupler saldirida oyuncuya firlar geri doner. Faz 2: goz acilir, isin supurmesi.
8. **Tapinak Muhafizi (spawnTempleBossAt).** Antik tas heykel canlanir: oturan poz -> ayaga kalkma animasyonlu giris. Yosunlu tas + altin detay. Faz 2: kolu kirilir, kol yerine enerji kamcisi.
9. **Mega Boss / Boss Odasi finali (P4.3).** "ZONK Avatari": oyuncu karakterinin 3 kat buyuk, bozuk/glitch voxel kopyasi (palet negatif). Oyuncunun kendi skill'lerinin boss versiyonlarini kullanir. Faz 2: parcalanir, cekirdek iskelet kalir, hiz artar.

Teslim kriteri (her boss): voxel tanimi koda girer, sahnede <=6 draw call (parcalar + outline), shot-director boss sahnesi goruntusunde siluet okunur.

## 6. Map Sanat Yonu (P5/P9 destegi)

- Bolge kimligi: koy = sicak sari fener isigi + kirmizi cati; gol = turkuaz su + kamis; tapinak = gri-altin + mor sis; plato = acik kaya + ruzgar cimeni. Uzaktan bakinca renk blogu olarak ayirt edilmeli.
- Landmark kurali: her bolgede ekranin ust yarisina giren 1 dev obje (degirmen, dev heykel, kirik kule) - yon bulma icin.
- Yurunebilir/yurunemez ayrimi: yurunemez kayalar %20 daha koyu + outline'siz (okunabilirlik hilesi).
- TD haritasi: koridor zemini belirgin patika dokusu, turret platformlari altin kenar cizgili daireler; Cekirdek her yerden gorunur isik sutunu yayar.

## 7. UI Stil Kontrol Listesi (P6 kabul kriteri)

- [ ] Tek font ailesi (pixel/rounded), 3 boyut kademesi; emoji kalmadi.
- [ ] Panel stili: koyu lacivert `#141a2a` zemin + 2px acik kenar + 6px kose; her panelde ayni.
- [ ] Butonlar: hover'da %5 buyume + parlama, basimda 2px cokme; primary altin, secondary gri.
- [ ] Levelup kartlari: nadirlik cerceve rengi (tier paleti), ikon, stat farki satiri ("+7 hasar"), sinerji rozeti.
- [ ] HUD chip'leri ayni yukseklik/radius; XP bari levelup'ta altin parlar.
- [ ] Ana menu arkasinda canli voxel diorama; logo yeni tasarim.
