# Killgram (ZONK) - Plan Merkezi

Bu klasor projenin tek dogruluk kaynagidir. Buradaki dosyalar uzerinde birden fazla ajan calisacak.

## Okuma sirasi (her ajan, her seans)

1. **STATUS.md** - Su an nerede kaldik, kim ne yapti, siradaki is ne. HER SEANS ONCE BURAYI OKU.
2. **PLAN.md** - Ana plan: fazlar, isler, kabul kriterleri, bagimliliklar.
3. **ART-DIRECTION.md** - Voxel gorsel dil, yaratik/boss model brief'leri. (Sadece gorsel is yapiyorsan)
4. **TEST-PLAYBOOK.md** - Playtest, performans olcumu, map denetimi, coop sync testleri. (Is bitirmeden once ilgili testi kos)

## Ajan calisma kurallari

1. **STATUS.md'yi guncellemeden seansi bitirme.** Yaptigini, yarim kalani ve siradaki adimi "Seans Gunlugu"ne yaz; workstream tablosundaki durumu degistir.
2. **Bir seansta bir dikey dilim.** Ise basla, bitir, test et, STATUS'a isle. Yarim is birakacaksan tam olarak nerede kaldigini yaz (dosya + satir + ne eksik).
3. **app.js'i asla bastan sona okuma.** ~15.850 satir. Grep ile fonksiyonu bul, Read'i offset/limit ile kullan. PLAN.md'deki "Kod Haritasi" bolumunde ana fonksiyonlarin satir numaralari var (kaydikca STATUS'ta guncellenir).
4. Is bitince **TEST-PLAYBOOK'taki ilgili kapiyi (gate) kos**: en az `node tools/qa/shot-director.mjs` + konsol hatasi kontrolu. Performans isiyse perf probe da kos.
5. `node_modules/`, `.glb`, `dist/` dosyalarini okuma/ekleme.
6. Kod icinde ASCII kullan (mevcut kod stiline uy: "Yukleniyor", "Gorevler" gibi). Yorumlar kisa, sadece niyet aciklayan.
7. Commit'i kullanici ister; kendi basina push/PR yapma.

## Proje ozeti (30 saniyede)

Megabonk tarzi 3D survivor (Vampire Survivors + 3D). Three.js, tek `app.js`. Hedef: voxel/outline cartoonish gorsel dile gecis, ciddi optimizasyon, UI polish, yeni skiller, 3-portal boss odasi mekanigi, P2P online coop ve coop'a ozel tower defense modu. Oyun su an ~2-3/10 bitmislikte; hedef AA hissiyati.
